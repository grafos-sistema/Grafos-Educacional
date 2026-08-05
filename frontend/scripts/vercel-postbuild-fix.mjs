import {
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  cpSync,
} from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const nextDir = resolve(projectRoot, '.next');
const parentRoot = resolve(projectRoot, '..');
const parentNextDir = resolve(parentRoot, '.next');

const ensureFile = (targetPath, sourcePath, fallbackContent) => {
  if (existsSync(targetPath)) return;
  if (sourcePath && existsSync(sourcePath)) {
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(sourcePath, targetPath);
    return;
  }
  if (fallbackContent) {
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, fallbackContent);
  }
};

ensureFile(
  resolve(nextDir, 'routes-manifest-deterministic.json'),
  resolve(nextDir, 'routes-manifest.json'),
  null,
);

ensureFile(resolve(nextDir, 'package.json'), null, '{}\n');

ensureFile(resolve(nextDir, 'server', 'pages-manifest.json'), null, '{}\n');

if (process.env.VERCEL && basename(projectRoot) === 'frontend') {
  mkdirSync(parentNextDir, { recursive: true });
  cpSync(nextDir, parentNextDir, { recursive: true, force: true });

  ensureFile(
    resolve(parentNextDir, 'routes-manifest-deterministic.json'),
    resolve(nextDir, 'routes-manifest-deterministic.json'),
    null,
  );
  ensureFile(
    resolve(parentNextDir, 'routes-manifest.json'),
    resolve(nextDir, 'routes-manifest.json'),
    null,
  );
  ensureFile(resolve(parentNextDir, 'package.json'), null, '{}\n');
  ensureFile(
    resolve(parentNextDir, 'server', 'pages-manifest.json'),
    resolve(nextDir, 'server', 'pages-manifest.json'),
    '{}\n',
  );
}
