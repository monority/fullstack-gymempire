// budget de poids du build (gzip). Garde-fou simple, sans dépendance.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dir = 'dist/_astro';
const LIMITS = {
  jsGzip: 120_000, // mesuré ~110 Ko
  cssGzip: 52_000, // mesuré ~47 Ko
  fileGzip: 30_000, // mesuré ~27 Ko
  htmlGzip: 16_000, // mesuré ~12,8 Ko
  domNodes: 1_800, // mesuré ~1 563
};

const files = readdirSync(dir).map((name) => {
  const raw = readFileSync(`${dir}/${name}`);
  return { name, raw: raw.length, gzip: gzipSync(raw, { level: 9 }).length };
});
const js = files.filter((f) => f.name.endsWith('.js'));
const css = files.filter((f) => f.name.endsWith('.css'));
const sum = (arr) => arr.reduce((n, f) => n + f.gzip, 0);

function walkHtml(d) {
  return readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkHtml(join(d, e.name)) : [join(d, e.name)]
  );
}
const html = walkHtml('dist')
  .filter((f) => f.endsWith('.html'))
  .map((f) => {
    const raw = readFileSync(f);
    return {
      name: f,
      gzip: gzipSync(raw, { level: 9 }).length,
      nodes: (raw.toString().match(/</g) || []).length,
    };
  });
const largestHtml = [...html].sort((a, b) => b.gzip - a.gzip)[0];
const densestHtml = [...html].sort((a, b) => b.nodes - a.nodes)[0];

const totals = { jsGzip: sum(js), cssGzip: sum(css) };
const largest = [...files].sort((a, b) => b.gzip - a.gzip)[0];
const failures = [];

for (const [key, limit] of Object.entries(LIMITS)) {
  const value =
    key === 'fileGzip'
      ? largest.gzip
      : key === 'htmlGzip'
        ? largestHtml.gzip
        : key === 'domNodes'
          ? densestHtml.nodes
          : totals[key];
  const label =
    key === 'fileGzip'
      ? `${largest.name} (gzip)`
      : key === 'htmlGzip'
        ? `${largestHtml.name} (gzip)`
        : key === 'domNodes'
          ? `${densestHtml.name} (balises)`
          : key;
  console.log(
    `${label}: ${value} ${key === 'domNodes' ? '' : 'B '}/ ${limit} ${key === 'domNodes' ? '' : 'B'}`
  );
  if (value > limit) failures.push(`${label} dépasse le budget (${value} > ${limit})`);
}

// Marge minimale : évite d'ajouter une fonctionnalité client alors qu'il ne
// reste que quelques octets avant la limite.
const MIN_JS_MARGIN = 1_000;
const jsMargin = LIMITS.jsGzip - totals.jsGzip;
console.log(`jsMargin: ${jsMargin} B / min ${MIN_JS_MARGIN} B`);
if (jsMargin < MIN_JS_MARGIN) {
  failures.push(`marge JS insuffisante (${jsMargin} < ${MIN_JS_MARGIN})`);
}

if (failures.length) {
  console.error('\nBudget dépassé :');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('check:budget — budgets respectés.');
