import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(projectRoot, 'supabase', 'migrations');
const migrationNamePattern = /^(\d{14})_(.+)\.sql$/;

// These files predate the repository migration naming contract. Keep them in
// place until the remote migration history is reconciled; renaming an already
// applied migration would make Supabase treat it as a new migration.
const knownLegacyMigrationFiles = new Set([
  '20260624_grants_public_schema.sql',
  '20260624_integrate_auth_users.sql',
  '20260624_onboarding_invites.sql',
  '20260624_revoke_rls_auto_enable.sql',
  '20260624_rls_content.sql',
  '20260624_rls_core.sql',
  '20260624_rls_exams_gamification_ideb.sql',
  '20260624_security_hardening.sql',
  '20260817_fix_admin_user_updates.sql',
  'fix_recursive_rls_access.sql',
  'fix_teachers_select_self_access.sql',
  'fix_users_select_self_only.sql',
]);

const migrationFiles = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => entry.name)
  .sort();

const invalidFiles = migrationFiles.filter((file) => !migrationNamePattern.test(file));
const unexpectedInvalidFiles = invalidFiles.filter(
  (file) => !knownLegacyMigrationFiles.has(file),
);
const versions = migrationFiles
  .map((file) => file.match(migrationNamePattern)?.[1])
  .filter(Boolean);
const duplicateVersions = versions.filter((version, index) => versions.indexOf(version) !== index);

if (unexpectedInvalidFiles.length > 0 || duplicateVersions.length > 0) {
  console.error('Supabase migration contract failed.');

  if (unexpectedInvalidFiles.length > 0) {
    console.error('\nFiles must follow YYYYMMDDHHmmss_name.sql:');
    for (const file of unexpectedInvalidFiles) console.error(`- ${file}`);
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

if (invalidFiles.length > 0) {
  console.warn(
    '\nKnown legacy migration filenames were preserved and excluded from this validation:',
  );
  for (const file of invalidFiles) console.warn(`- ${file}`);
  console.warn(
    'Reconcile the remote migration history before renaming these files. Supabase CLI may skip files that do not follow the timestamp format.',
  );
}

console.log(`Validated ${migrationFiles.length - invalidFiles.length} current migration file(s).`);
