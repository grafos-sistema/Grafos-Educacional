import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const GLOBAL_ADMIN_ROLE = 'SUPER_ADMIN_GLOBAL';

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }

  return value;
}

function normalizeCpf(value: string) {
  return value.replace(/\D/g, '');
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    throw new Error('Informe nome completo com pelo menos nome e sobrenome.');
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

async function main() {
  const supabaseUrl = requiredEnv('SUPABASE_URL');
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const email = requiredEnv('BOOTSTRAP_GLOBAL_ADMIN_EMAIL').toLowerCase();
  const password = requiredEnv('BOOTSTRAP_GLOBAL_ADMIN_PASSWORD');
  const cpf = normalizeCpf(requiredEnv('BOOTSTRAP_GLOBAL_ADMIN_CPF'));
  const fullName = requiredEnv('BOOTSTRAP_GLOBAL_ADMIN_NAME');
  const institutionId = requiredEnv('BOOTSTRAP_GLOBAL_ADMIN_INSTITUTION_ID');
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);

  const { firstName, lastName } = splitName(fullName);

  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, name: true, isActive: true },
  });

  if (!institution) {
    throw new Error('Instituicao base nao encontrada para o bootstrap.');
  }

  const existingUserByEmail = await prisma.user.findFirst({
    where: { email },
    select: { id: true, role: true },
  });

  if (existingUserByEmail) {
    throw new Error(`Ja existe usuario com este email: ${email}`);
  }

  const existingUserByCpf = await prisma.user.findFirst({
    where: { cpf },
    select: { id: true, email: true },
  });

  if (existingUserByCpf) {
    throw new Error(`Ja existe usuario com este CPF: ${existingUserByCpf.email}`);
  }

  const supabase = createClient(supabaseUrl.replace(/\/+$/, ''), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name: fullName,
      role: GLOBAL_ADMIN_ROLE,
    },
  });

  if (authError || !authUser.user) {
    throw new Error(authError?.message || 'Nao foi possivel criar o usuario no Supabase Auth.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, rounds);

    const user = await prisma.user.create({
      data: {
        id: authUser.user.id,
        authUserId: authUser.user.id,
        email,
        password: hashedPassword,
        role: GLOBAL_ADMIN_ROLE as never,
        firstName,
        lastName,
        name: fullName,
        cpf,
        institutionId,
        isActive: true,
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        institutionId: true,
      },
    });

    await prisma.userInstitution.upsert({
      where: {
        userId_institutionId: {
          userId: user.id,
          institutionId,
        },
      },
      update: {
        isActive: true,
        isPrimary: true,
      },
      create: {
        userId: user.id,
        institutionId,
        isActive: true,
        isPrimary: true,
      },
    });

    console.log('SUPER_ADMIN_GLOBAL criado com sucesso.');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Instituicao base: ${institution.name} (${institution.id})`);
  } catch (error) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Falha no bootstrap do SUPER_ADMIN_GLOBAL.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
