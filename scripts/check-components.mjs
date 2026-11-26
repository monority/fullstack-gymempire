// Mesure de la dette de componentisation (voir docs/componentization-rules.md).
// Sans dépendance. Mode avertissement par défaut ; STRICT=1 rend les findings bloquants.
// Usage : node scripts/check-components.mjs [--json]
import { enforceRatchet } from './ratchet.mjs';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src';
const STRICT = process.env.STRICT === '1';
const AS_JSON = process.argv.includes('--json');

const LIMITS = { page: 250, style: 20, script: 20 };

// Exceptions documentées dans docs/componentization-rules.md §9.
const WHITELIST = {
  // ui = galerie design system (404 en prod), print = feuille imprimable autonome.
  size: new Set(['pages/ui.astro', 'pages/debug.astro', 'pages/sessions/print.astro']),
  style: new Set(['pages/ui.astro', 'pages/debug.astro', 'pages/sessions/print.astro']),
  script: new Set(['pages/ui.astro', 'pages/debug.astro']),
  global: new Set(['pages/sessions/print.astro', 'pages/ui.astro']),
  // Toast : enregistrement trivial (2 lignes), aucune logique à extraire.
  inline: new Set(['components/ui/Toast.astro']),
};

const findings = [];
const add = (rule, file, detail, line = 0) =>
  findings.push({ rule, file, line, detail, blocking: !isWhitelisted(rule, file) });

function isWhitelisted(rule, file) {
  switch (rule) {
    case 'size':
      return WHITELIST.size.has(file);
    case 'style':
      return WHITELIST.style.has(file);
    case 'script':
      return WHITELIST.script.has(file);
    case 'is:global':
      return WHITELIST.global.has(file);
    case 'inline alpine factory':
      return WHITELIST.inline.has(file);
    default:
      return false;
  }
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (entry.endsWith('.astro') || entry.endsWith('.ts')) yield full;
  }
}

const files = [...walk(ROOT)].map((f) => ({
  path: f,
  rel: relative(ROOT, f).replace(/\\/g, '/'),
  text: readFileSync(f, 'utf8'),
}));

const blockLen = (source, tag) => {
  const re = new RegExp(`<${tag}(?![^>]*is:inline)[^>]*>([\\s\\S]*?)</${tag}>`, 'g');
  let max = 0;
  for (const m of source.matchAll(re)) {
    max = Math.max(max, m[1].split('\n').length);
  }
  return max;
};

const lineOf = (text, needle) => {
  const i = text.indexOf(needle);
  return i < 0 ? 0 : text.slice(0, i).split('\n').length;
};

for (const { rel, text } of files) {
  const lines = text.split('\n').length;
  const isPage = rel.startsWith('pages/') && !rel.startsWith('pages/en/');

  if (isPage && lines > LIMITS.page) add('size', rel, `${lines} lignes > ${LIMITS.page}`, 1);

  if (isPage) {
    const style = blockLen(text, 'style');
    if (style > LIMITS.style) add('style', rel, `bloc <style> de ${style} lignes`, 1);
    const script = blockLen(text, 'script');
    if (script > LIMITS.script) add('script', rel, `bloc <script> de ${script} lignes`, 1);
  }

  // Une factory Alpine dans un composant .astro n'est pas testable : elle
  // doit vivre dans xApp.ts + xRegistration.ts (règle §5).
  if (rel.startsWith('components/') && rel.endsWith('.astro') && text.includes('registerAlpine(')) {
    add(
      'inline alpine factory',
      rel,
      'registerAlpine dans un composant',
      lineOf(text, 'registerAlpine(')
    );
  }

  for (const needle of ['is:global', '(window as any)']) {
    let from = 0;
    while ((from = text.indexOf(needle, from)) >= 0) {
      add(needle, rel, needle, lineOf(text.slice(0, from + needle.length), needle));
      from += needle.length;
    }
  }

  if (rel.startsWith('pages/') && text.includes('Alpine.data(')) {
    add(
      'Alpine.data in pages',
      rel,
      'enregistrement Alpine dans une page',
      lineOf(text, 'Alpine.data(')
    );
  }

  // Domaines : interdiction d'importer un autre domaine de composants.
  const domain = rel.match(/^components\/([^/]+)\//)?.[1];
  if (domain && domain !== 'ui' && domain !== 'layout') {
    for (const m of text.matchAll(
      /from\s+['"](\.\.\/)+([^'"]*components\/([^/'"]+)\/[^'"]+)['"]/g
    )) {
      const other = m[3];
      if (other && other !== domain)
        add('interdomain import', rel, `import du domaine ${other}`, lineOf(text, m[0]));
    }
  }

  // Composant sans Props (informatif : les atomes sans données n'en ont pas besoin).
  if (
    rel.startsWith('components/') &&
    rel.endsWith('.astro') &&
    !text.includes('interface Props')
  ) {
    add('missing Props', rel, 'aucune interface Props détectée', 1);
  }
}

const byRule = findings
  .filter((f) => f.blocking !== false)
  .reduce((acc, f) => {
    acc[f.rule] = (acc[f.rule] || 0) + 1;
    return acc;
  }, {});

if (AS_JSON) {
  console.log(JSON.stringify({ totals: byRule, findings }, null, 2));
} else {
  console.log('check-components — dette de componentisation');
  for (const [rule, count] of Object.entries(byRule)) console.log(`  ${rule}: ${count}`);
  console.log(`  total: ${findings.length}`);
  if (!STRICT) console.log('(mode avertissement — STRICT=1 pour bloquer)');
}

enforceRatchet('check-components', byRule, STRICT);
