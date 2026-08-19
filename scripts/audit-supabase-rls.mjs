import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const migrationsDirectory = join(process.cwd(), 'supabase', 'migrations');
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();

const createdTables = new Set();
const rlsEnabledTables = new Set();

function normalizeIdentifier(identifier) {
  return identifier.replaceAll('"', '').replaceAll(/\s/g, '');
}

function addPublicTable(target, identifier) {
  const normalized = normalizeIdentifier(identifier);
  const parts = normalized.split('.');
  const schema = parts.length > 1 ? parts.at(-2) : 'public';
  const table = parts.at(-1);

  if (schema === 'public' && table) {
    target.add(table);
  }
}

for (const file of migrationFiles) {
  const sql = await readFile(join(migrationsDirectory, file), 'utf8');
  const withoutComments = sql.replaceAll(/--.*$/gm, ' ');
  const identifier = '(?:"?[a-zA-Z_][a-zA-Z0-9_]*"?\\s*\\.\\s*)?"?[a-zA-Z_][a-zA-Z0-9_]*"?';

  for (const match of withoutComments.matchAll(
    new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${identifier})`, 'gi'),
  )) {
    addPublicTable(createdTables, match[1]);
  }

  for (const match of withoutComments.matchAll(
    new RegExp(`ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(${identifier})\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'gi'),
  )) {
    addPublicTable(rlsEnabledTables, match[1]);
  }
}

const missingRls = [...createdTables]
  .filter((table) => !rlsEnabledTables.has(table))
  .sort();

console.log(
  `RLS audit: ${createdTables.size} public tables found; ${rlsEnabledTables.size} have ENABLE ROW LEVEL SECURITY in migrations.`,
);

if (missingRls.length > 0) {
  console.error(`Public tables without RLS migration: ${missingRls.join(', ')}`);
  process.exit(1);
}

console.log('RLS audit passed.');
