// Prettier sur les fichiers modifiés uniquement (pas de reformat global).
// Usage : node scripts/format-changed.mjs [--write]
// En CI (process.env.CI), vérifie TOUS les fichiers : un checkout shallow
// n'a pas de diff HEAD et l'ancien logique laissait le gate toujours vert.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const write = process.argv.includes('--write');
const mode = write ? '--write' : '--check';
const isCI = Boolean(process.env.CI);

// Pas de `shell: bash` : sur Windows, `bash` passe par le relais WSL et
// renvoie une liste vide -> le gate devient un faux vert.
function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

const SOURCE_EXT = /\.(astro|ts|tsx|js|mjs|json|css|md|html)$/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', '.astro', 'coverage', 'test-results', '.opencode'].includes(entry))
      continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SOURCE_EXT.test(entry)) yield full;
  }
}

let files;
if (isCI) {
  files = [...walk('.')];
  console.log(`format:${write ? 'write' : 'check'} (CI) sur ${files.length} fichiers sources.`);
} else {
  files = [
    ...git('diff', '--name-only', '--diff-filter=ACM', 'HEAD'),
    ...git('ls-files', '--others', '--exclude-standard'),
  ];
  if (files.length === 0) {
    console.log('format:check - aucun fichier modifié à vérifier.');
    process.exit(0);
  }
  console.log(`format:${write ? 'write' : 'check'} sur ${files.length} fichier(s) modifié(s).`);
}

files = files
  .filter((f) => SOURCE_EXT.test(f))
  .filter((f) => !f.startsWith('public/vendor/'))
  .filter((f) => !f.startsWith('pnpm-lock.yaml'))
  .filter((f) => !f.startsWith('package-lock.json'));

if (files.length === 0) {
  console.log('format:check - aucun fichier à vérifier.');
  process.exit(0);
}

const prettier = fileURLToPath(
  new URL('../node_modules/prettier/bin/prettier.cjs', import.meta.url)
);
try {
  execFileSync(process.execPath, [prettier, mode, ...files], { stdio: 'inherit' });
} catch {
  process.exit(1);
}
