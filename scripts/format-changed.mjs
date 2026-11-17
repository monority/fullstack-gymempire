// A3 — Prettier sur les fichiers modifiés uniquement (pas de reformat global).
// Usage : node scripts/format-changed.mjs [--write]
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const write = process.argv.includes('--write');
const mode = write ? '--write' : '--check';

// Pas de `shell: bash` : sur Windows, `bash` passe par le relais WSL et
// renvoie une liste vide -> le gate devient un faux vert.
function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

// Fichiers modifiés dans le working tree + fichiers non suivis.
const files = [
  ...git('diff', '--name-only', '--diff-filter=ACM', 'HEAD'),
  ...git('ls-files', '--others', '--exclude-standard'),
]
  .filter((f) => /\.(astro|ts|tsx|js|mjs|json|css|md|html)$/.test(f))
  .filter((f) => !f.startsWith('public/vendor/'));

if (files.length === 0) {
  console.log('format:check - aucun fichier modifié à vérifier.');
  process.exit(0);
}

console.log(`format:${write ? 'write' : 'check'} sur ${files.length} fichier(s) modifié(s).`);
const prettier = fileURLToPath(
  new URL('../node_modules/prettier/bin/prettier.cjs', import.meta.url)
);
try {
  execFileSync(process.execPath, [prettier, mode, ...files], { stdio: 'inherit' });
} catch {
  process.exit(1);
}
