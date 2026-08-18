import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(projectRoot, 'supabase', 'migrations');
const migrationNamePattern = /^(\d{14})_(.+)\.sql$/;

const migrationFiles = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => entry.name)
  .sort();

const invalidFiles = migrationFiles.filter((file) => !migrationNamePattern.test(file));
const versions = migrationFiles
  .map((file) => file.match(migrationNamePattern)?.[1])
  .filter(Boolean);
const duplicateVersions = versions.filter((version, index) => versions.indexOf(version) !== index);

if (invalidFiles.length > 0 || duplicateVersions.length > 0) {
  console.error('Supabase migration contract failed.');

  if (invalidFiles.length > 0) {
    console.error('\nFiles must follow YYYYMMDDHHmmss_name.sql:');
    for (const file of invalidFiles) console.error(`- ${file}`);
  }

  if (duplicateVersions.length > 0) {
    console.error('\nMigration timestamps must be unique:');
    for (const version of [...new Set(duplicateVersions)]) console.error(`- ${version}`);
  }

  console.error(
    '\nDo not rename a migration that may already be recorded remotely. Reconcile the remote migration history first with `supabase migration list` and `supabase migration repair`.'
  );
  process.exit(1);
}

console.log(`Validated ${migrationFiles.length} Supabase migration file(s).`);
