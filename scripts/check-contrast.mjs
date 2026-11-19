// Contraste WCAG des tokens, dans les deux thèmes.
// Compare les couleurs de texte déclarées dans tokens/colors.css.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/tokens/colors.css', 'utf8');

/** Découpe :root { … } et [data-theme="light"] { … }. */
function block(selector) {
  const start =
    css.indexOf(selector.replace(/"/g, "'")) >= 0
      ? css.indexOf(selector.replace(/"/g, "'"))
      : css.indexOf(selector);
  if (start === -1) throw new Error(`Bloc introuvable : ${selector}`);
  const open = css.indexOf('{', start);
  let depth = 0;
  let close = -1;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      close = i;
      break;
    }
  }
  if (close === -1) throw new Error(`Accolade non fermée : ${selector}`);
  return css.slice(open + 1, close);
}

function tokens(source) {
  const out = {};
  for (const [, key, value] of source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[key] = value.trim();
  }
  return out;
}

function rgb(value) {
  const hex = value.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const hsl = value.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
  if (hsl) {
    const h = Number(hsl[1]) / 360;
    const s = Number(hsl[2]) / 100;
    const l = Number(hsl[3]) / 100;
    if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [h + 1 / 3, h, h - 1 / 3].map((t) => {
      let x = t;
      if (x < 0) x += 1;
      if (x > 1) x -= 1;
      const c =
        x < 1 / 6
          ? p + (q - p) * 6 * x
          : x < 1 / 2
            ? q
            : x < 2 / 3
              ? p + (q - p) * (2 / 3 - x) * 6
              : p;
      return Math.round(c * 255);
    });
  }
  throw new Error(`Couleur non interprétable : ${value}`);
}

function luminance(color) {
  const [r, g, b] = rgb(color).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const pairs = [
  ['--color-text', '--color-bg'],
  ['--color-text', '--color-surface'],
  ['--color-text', '--color-surface-2'],
  ['--color-muted', '--color-bg'],
  ['--color-muted', '--color-surface'],
];

const themes = [
  { name: 'dark', values: tokens(block(':root')) },
  { name: 'light', values: tokens(block('[data-theme="light"]')) },
];

const failures = [];
for (const theme of themes) {
  // Le thème clair ne redéclare que certaines couleurs : on hérite du dark.
  const values = theme.name === 'light' ? { ...themes[0].values, ...theme.values } : theme.values;
  for (const [fg, bg] of pairs) {
    if (!values[fg] || !values[bg]) continue;
    const r = ratio(values[fg], values[bg]);
    console.log(`${theme.name.padEnd(5)} ${fg} sur ${bg} : ${r.toFixed(2)}:1`);
    if (r < 4.5) failures.push(`${theme.name} ${fg}/${bg} = ${r.toFixed(2)}:1`);
  }
}

if (failures.length) {
  console.error('\nContraste insuffisant (< 4.5:1) :');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('\ncheck:contrast — tous les couples >= 4.5:1.');
