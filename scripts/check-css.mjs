// Gouvernance CSS (plan v3). Sans dépendance.
// Usage : node scripts/check-css.mjs [--json]
import { enforceRatchet } from './ratchet.mjs';
// STRICT=1 transforme les avertissements en erreurs.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src';
const STRICT = process.env.STRICT === '1';
const AS_JSON = process.argv.includes('--json');

const LAYER_ORDER = ['reset', 'tokens', 'base', 'components', 'utilities', 'overrides'];
const COLOR_LITERAL = /(#[0-9a-fA-F]{3,8}\b|hsl?\(|rgb?\()/;
const WHITELIST_COLOR = new Set([
  'styles/tokens/colors.css',
  'styles/base/elements.css', // ::selection
  'pages/ui.astro',
  'pages/debug.astro',
  'pages/sessions/print.astro',
]);
// Variables injectées à l'exécution par les composants (inline style).
const RUNTIME_TOKENS = new Set(['--icon-size', '--button-min-height']);
const WHITELIST_IMPORTANT = new Set([
  'styles/base/root.css', // --icon-size sur <svg> injecté
  'styles/base/a11y.css', // [x-cloak] + prefers-reduced-motion
]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (entry.endsWith('.css') || entry.endsWith('.astro')) yield full;
  }
}

const files = [...walk(ROOT)].map((f) => ({
  path: f,
  rel: relative(ROOT, f).replace(/\\/g, '/'),
  text: readFileSync(f, 'utf8'),
}));

// Tokens définis
const definedTokens = new Set();
for (const f of files.filter((f) => f.rel.includes('/tokens/'))) {
  for (const m of f.text.matchAll(/(--[\w-]+)\s*:/g)) definedTokens.add(m[1]);
}

const findings = [];
const add = (rule, file, detail, blocking = true) =>
  findings.push({ rule, file, detail, blocking });

// Ordre des layers dans global.css
const globalCss = files.find((f) => f.rel === 'styles/global.css')?.text ?? '';
const declared = [...globalCss.matchAll(/@layer\s+([\w\s,]+);/g)]
  .flatMap((m) => m[1].split(',').map((s) => s.trim()))
  .filter((x) => LAYER_ORDER.includes(x));
if (declared.join(',') !== LAYER_ORDER.join(',')) {
  add('layer order', 'styles/global.css', `attendu: ${LAYER_ORDER.join(', ')}`, true);
}

for (const { rel, text } of files) {
  const isToken = rel.includes('/tokens/');
  const css = rel.endsWith('.css')
    ? text
    : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');

  // Couleurs littérales hors tokens/whitelist
  if (!isToken && COLOR_LITERAL.test(css) && !WHITELIST_COLOR.has(rel)) {
    const count = (css.match(COLOR_LITERAL.g) || []).length;
    add('color literal', rel, `${count} littéral(aux) de couleur`, true);
  }

  // !important (whitelist documentée)
  const importantCount = (css.match(/!important/g) || []).length;
  if (importantCount && !WHITELIST_IMPORTANT.has(rel)) {
    add('!important', rel, `${importantCount} occurrence(s)`, true);
  }

  // :where() interdit dans components/ et utilities/
  if (
    /\.where\(|:where\(/.test(css) &&
    (rel.startsWith('components/') || rel.startsWith('utilities/'))
  ) {
    add(':where()', rel, 'interdit dans components/ et utilities/', true);
  }

  // Sélecteur #id
  for (const m of css.matchAll(/(^|[\s>])(#(?![\da-fA-F]{3,8}\b)[a-zA-Z][\w-]*)/g)) {
    if (!m[2].startsWith('#exo-') && !m[2].startsWith('#set-') && !m[2].startsWith('#ses-')) {
      add('#id selector', rel, m[2]);
    }
  }

  // Profondeur > 2
  for (const m of css.matchAll(/(^|\n)\s*([.#]?[\w-]+(?:\s+[.#]?[\w-]+){2,})\s*\{/g)) {
    add('specificity depth', rel, m[2].trim().slice(0, 70));
  }

  // Tokens inconnus (les variables définies localement sont valides)
  const localTokens = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const m of css.matchAll(/var\((--[\w-]+)/g)) {
    if (!definedTokens.has(m[1]) && !localTokens.has(m[1]) && !RUNTIME_TOKENS.has(m[1]))
      add('unknown token', rel, m[1]);
  }

  // Blocs <style> > 80 lignes
  if (rel.endsWith('.astro')) {
    for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      const lines = m[1].split('\n').length;
      if (lines > 80) add('style block > 80', rel, `${lines} lignes`);
    }
  }

  // Compteurs de duplication (KPI plan v3)
  if (
    !isToken &&
    !rel.startsWith('utilities/') &&
    !rel.startsWith('components/') &&
    !rel.startsWith('styles/components/') &&
    !rel.startsWith('styles/utilities/')
  ) {
    const counts = {
      uppercase: (css.match(/text-transform:\s*uppercase/g) || []).length,
      tabular: (css.match(/font-variant-numeric:\s*tabular-nums/g) || []).length,
      hairline: (css.match(/border:\s*1px solid var\(--color-border\)/g) || []).length,
      focus: (css.match(/:focus-visible/g) || []).length,
    };
    for (const [k, v] of Object.entries(counts)) {
      if (v > (k === 'hairline' ? 15 : 5)) add(`kpi:${k}`, rel, `${v} occurrences`);
    }
  }
}

const byRule = findings.reduce((a, f) => ((a[f.rule] = (a[f.rule] || 0) + 1), a), {});
if (AS_JSON) console.log(JSON.stringify({ byRule, findings }, null, 2));
else {
  console.log('check-css — gouvernance CSS (plan v3)');
  for (const [k, v] of Object.entries(byRule)) console.log(`  ${k}: ${v}`);
  console.log(`  total: ${findings.length}`);
  if (!STRICT) console.log('(mode avertissement — STRICT=1 pour bloquer)');
}
enforceRatchet('check-css', byRule, STRICT);
