// liste les modules src/ non importés hors tests.
// Usage : node scripts/dead-code.mjs
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = 'src';
const EXT = /\.(ts|astro)$/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXT.test(entry)) yield full;
  }
}

// env.d.ts est une déclaration ambiante : jamais importée par design.
const files = [...walk(SRC)].filter(
  (f) => !f.includes('__tests__') && !f.includes('i18n') && !f.endsWith('env.d.ts')
);

// Collecte de tous les spécificateurs d'import/export-from/dynamic import.
const importRe =
  /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|^import\s+['"]([^'"]+)['"]\s*;?/gm;
const specs = new Set();
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const m of content.matchAll(importRe)) {
    const spec = m[1] || m[2] || m[3];
    if (spec.startsWith('.')) {
      // Résout le spécificateur relativement au fichier importeur,
      // en essayant les extensions implicites (TS/Astro).
      const resolved = new URL(spec, `file:///${file.replace(/\\/g, '/')}`).pathname
        .replace(/^\//, '')
        .replace(/\\/g, '/');
      specs.add(resolved);
      specs.add(`${resolved}.ts`);
      specs.add(`${resolved}.astro`);
      specs.add(`${resolved}/index.ts`);
    } else {
      specs.add(spec);
    }
  }
}

const orphans = [];
for (const file of files) {
  const rel = relative(SRC, file).replace(/\\/g, '/');
  if (rel === 'pages' || rel.startsWith('pages/')) continue; // routes Astro = points d'entrée
  const base = rel.replace(/\.(ts|astro)$/, '');
  const candidates = [
    `./${base}`,
    `../${base}`,
    `../../${base}`,
    `../../../${base}`,
    `@/${base}`,
    base,
  ];
  // Les .astro sont importés par leur nom de fichier complet.
  const full = `./${rel}`;
  const imported = [...specs].some(
    (s) =>
      candidates.some((c) => s === c || s.startsWith(c + '/index')) ||
      s === full ||
      s === file.replace(/\\/g, '/') ||
      s.endsWith('/' + rel)
  );
  if (!imported) orphans.push(rel);
}

if (orphans.length === 0) {
  console.log('Aucun module orphelin détecté.');
} else {
  console.log('Modules possiblement orphelins (non importés hors tests) :');
  for (const o of orphans) console.log(`- ${o}`);
}
