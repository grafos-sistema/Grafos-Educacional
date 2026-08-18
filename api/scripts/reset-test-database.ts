import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

if (!process.env.DATABASE_URL?.trim() && process.env.DIRECT_URL?.trim()) {
  process.env.DATABASE_URL = process.env.DIRECT_URL.trim();
}

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error(
    'DATABASE_URL nao configurada. Defina a URL direta do Postgres no api/.env ou na sessao do PowerShell antes de executar o reset.',
  );
}

const prisma = new PrismaClient();
const EXECUTE_FLAG = '--execute';
const DRY_RUN_FLAG = '--dry-run';

const protectedTables = new Set([
  'users',
  'institutions',
  'user_institutions',
  '_prisma_migrations',
  'schema_migrations',
]);

type PublicTable = { tableName: string };
type GlobalAdmin = { id: string; authUserId: string | null; email: string };
type AuthUser = { id: string; email?: string | null };

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

async function listPublicDataTables() {
  const rows = await prisma.$queryRaw<PublicTable[]>`
    SELECT table_name AS "tableName"
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  return rows
    .map((row) => row.tableName)
    .filter((tableName) => !protectedTables.has(tableName));
}

async function countRows(tableName: string) {
  const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM public.${quoteIdentifier(tableName)}`,
  );
  return Number(result[0]?.count ?? 0);
}

async function getGlobalAdmins() {
  return prisma.user.findMany({
    where: { role: UserRole.SUPER_ADMIN_GLOBAL },
    select: { id: true, authUserId: true, email: true },
    orderBy: { email: 'asc' },
  }) as Promise<GlobalAdmin[]>;
}

async function getProtectedInstitutionIds(adminIds: string[]) {
  if (adminIds.length === 0) return [];

  const rows = await prisma.userInstitution.findMany({
    where: { userId: { in: adminIds }, isActive: true },
    select: { institutionId: true },
  });

  const primaryRows = await prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { institutionId: true },
  });

  return Array.from(
    new Set(
      [...rows.map((row) => row.institutionId), ...primaryRows.map((row) => row.institutionId)].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );
}

async function listAuthUsers() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl.replace(/\/+$/, ''), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users: AuthUser[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Falha ao listar usuarios do Auth: ${error.message}`);

    users.push(...(data.users as AuthUser[]));
    if (data.users.length < perPage) break;
    page += 1;
  }

  return { supabase, users };
}

async function printPreview(admins: GlobalAdmin[], tables: string[], authUsers?: AuthUser[]) {
  const counts = await Promise.all(
    tables.map(async (tableName) => ({ tableName, count: await countRows(tableName) })),
  );

  const adminIds = admins.map((admin) => admin.id);
  const nonGlobalUsers = await prisma.user.count({
    where: { role: { not: UserRole.SUPER_ADMIN_GLOBAL } },
  });
  const protectedInstitutionIds = await getProtectedInstitutionIds(adminIds);
  const institutionsToDelete = await prisma.institution.count({
    where: { id: { notIn: protectedInstitutionIds } },
  });

  console.log('PREVIA DO RESET DO BANCO');
  console.log(`Super Admins Globais preservados: ${admins.length}`);
  admins.forEach((admin) => console.log(`  - ${admin.email} (${admin.id})`));
  console.log(`Usuarios publicos que serao removidos: ${nonGlobalUsers}`);
  console.log(`Instituicoes que serao removidas: ${institutionsToDelete}`);
  console.log('Tabelas de dados que serao esvaziadas:');
  counts
    .filter(({ count }) => count > 0)
    .forEach(({ tableName, count }) => console.log(`  - ${tableName}: ${count}`));

  if (authUsers) {
    const protectedAuthIds = new Set(
      admins.map((admin) => admin.authUserId ?? admin.id),
    );
    const authUsersToDelete = authUsers.filter((user) => !protectedAuthIds.has(user.id));
    console.log(`Usuarios do Supabase Auth que serao removidos: ${authUsersToDelete.length}`);
  }
}

async function clearPublicDatabase(tables: string[], admins: GlobalAdmin[]) {
  const adminIds = admins.map((admin) => admin.id);
  const protectedInstitutionIds = await getProtectedInstitutionIds(adminIds);

  await prisma.$transaction(async (transaction) => {
    if (tables.length > 0) {
      const tableList = tables
        .map((tableName) => `public.${quoteIdentifier(tableName)}`)
        .join(', ');
      await transaction.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
    }

    await transaction.$executeRaw`
      DELETE FROM public.user_institutions ui
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = ui."userId"
          AND u.role = 'SUPER_ADMIN_GLOBAL'
      )
    `;

    await transaction.$executeRaw`
      DELETE FROM public.users
      WHERE role <> 'SUPER_ADMIN_GLOBAL'
    `;

    if (protectedInstitutionIds.length > 0) {
      await transaction.institution.deleteMany({
        where: { id: { notIn: protectedInstitutionIds } },
      });
    } else {
      await transaction.institution.deleteMany();
    }
  });
}

async function clearAuthUsers(admins: GlobalAdmin[]) {
  const { supabase, users } = await listAuthUsers();
  const protectedAuthIds = new Set(admins.map((admin) => admin.authUserId ?? admin.id));
  const usersToDelete = users.filter((user) => !protectedAuthIds.has(user.id));

  for (const user of usersToDelete) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error && !/user not found/i.test(error.message)) {
      throw new Error(`Falha ao remover ${user.email ?? user.id} do Auth: ${error.message}`);
    }
  }

  console.log(`Usuarios removidos do Supabase Auth: ${usersToDelete.length}`);
}

async function main() {
  const shouldExecute = process.argv.includes(EXECUTE_FLAG);
  const isDryRun = process.argv.includes(DRY_RUN_FLAG) || !shouldExecute;

  if (process.argv.includes(EXECUTE_FLAG) && process.argv.includes(DRY_RUN_FLAG)) {
    throw new Error('Escolha apenas --dry-run ou --execute.');
  }

  const admins = await getGlobalAdmins();
  if (admins.length === 0) {
    throw new Error('Nenhum SUPER_ADMIN_GLOBAL encontrado. Reset abortado por seguranca.');
  }

  const tables = await listPublicDataTables();

  if (isDryRun) {
    let authUsers: AuthUser[] | undefined;
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      ({ users: authUsers } = await listAuthUsers());
    }
    await printPreview(admins, tables, authUsers);
    console.log('\nNenhuma alteracao foi feita. Use --execute somente depois de revisar a previa.');
    return;
  }

  console.log('Executando reset: os SUPER_ADMIN_GLOBAL serao preservados.');
  await clearPublicDatabase(tables, admins);
  await clearAuthUsers(admins);
  console.log('Reset concluido. Os SUPER_ADMIN_GLOBAL continuam preservados.');
}

main()
  .catch((error) => {
    console.error('Falha no reset do banco de teste.');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
