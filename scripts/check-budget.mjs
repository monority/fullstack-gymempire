// G1 — budget de poids du build (gzip). Garde-fou simple, sans dépendance.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const dir = 'dist/_astro';
const LIMITS = { jsGzip: 140_000, cssGzip: 60_000, fileGzip: 40_000 };

const files = readdirSync(dir).map((name) => {
  const raw = readFileSync(`${dir}/${name}`);
  return { name, raw: raw.length, gzip: gzipSync(raw, { level: 9 }).length };
});
const js = files.filter((f) => f.name.endsWith('.js'));
const css = files.filter((f) => f.name.endsWith('.css'));
const sum = (arr) => arr.reduce((n, f) => n + f.gzip, 0);

const totals = { jsGzip: sum(js), cssGzip: sum(css) };
const largest = [...files].sort((a, b) => b.gzip - a.gzip)[0];
const failures = [];

for (const [key, limit] of Object.entries(LIMITS)) {
  const value = key === 'fileGzip' ? largest.gzip : totals[key];
  const label = key === 'fileGzip' ? `${largest.name} (gzip)` : key;
  console.log(`${label}: ${value} B / ${limit} B`);
  if (value > limit) failures.push(`${label} dépasse le budget (${value} > ${limit})`);
}

if (failures.length) {
  console.error('\nBudget dépassé :');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('check:budget — budgets respectés.');
