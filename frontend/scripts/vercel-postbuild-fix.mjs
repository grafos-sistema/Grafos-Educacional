import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const nextDir = resolve(projectRoot, '.next');

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
