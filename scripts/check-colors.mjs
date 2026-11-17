// E1 — aucun littéral de couleur hors tokens et exceptions documentées.
// Les valeurs ci-dessous sont des choix explicites, pas des oublis :
//  - tokens/ : définition des tokens (source de vérité)
//  - debug.astro : page autonome volontairement indépendante des tokens
//  - sessions/print.astro : palette papier fixe (l'impression ne suit pas le thème)
//  - ui.astro : spécimens de design system, les littéraux sont la donnée affichée
//  - meta theme-color : le navigateur ne résout pas var() dans une balise meta
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const roots = ['src/pages', 'src/components', 'src/styles'];
const allowed = [
  'src/styles/tokens/',
  'src/pages/debug.astro',
  'src/pages/sessions/print.astro',
  'src/pages/ui.astro',
];
const colorRe = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/;

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(astro|css)$/.test(p)) files.push(p);
  }
}
for (const dir of roots) walk(join(root, dir));

const violations = [];
for (const file of files) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (allowed.some((a) => rel.startsWith(a))) continue;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes('theme-color')) return;
    if (colorRe.test(line)) violations.push(`${rel}:${i + 1}`);
  });
}

if (violations.length > 0) {
  console.error(`Couleurs en dur interdites (${violations.length}) :`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('check:colors — aucun littéral de couleur hors exceptions.');
