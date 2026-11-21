// Vérifie que la langue du contenu HTML buildé correspond au préfixe de route.
// Détecte le bug P0 (t() appelé avant setLocale() dans le frontmatter des pages).
// On analyse <title> + <h1> + premier <p> : ces textes viennent du frontmatter
// t(locale). Le reste peut contenir des chaînes figées dans les composants
// (dette i18n Phase 4), sans rapport avec la corruption de langue.
// Usage : node scripts/check-i18n-build.mjs [--json]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const AS_JSON = process.argv.includes('--json');

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (entry.endsWith('.html')) yield full;
  }
}

const FR_MARKERS = [
  'Calculateur de disques',
  'Nouvelle séance',
  'Réglages',
  'Historique',
  'Bienvenue',
  'Séance rapide',
  'Tableau de bord',
  'Statistiques',
  'Calendrier',
  'Connexion',
  'Indiquez',
  'Poids total',
  'Chargement par côté',
  'Suivez',
  'Retour aux exercices',
  'Séances récentes',
  'Browse and manage',
  'Enter a total',
  'Track your performance',
  'Welcome back',
];
const EN_MARKERS = [
  'Welcome back',
  'Sign in',
  'Settings',
  'New session',
  'Quick session',
  'Exercise history',
  'Track your performance',
  'Back to exercises',
  'Plate calculator',
  'Enter the total',
  'Recent sessions',
  'Add exercise',
  'Browse and manage',
  'Calculator de disques',
];

function strip(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const failures = [];
for (const file of walk('dist')) {
  const html = readFileSync(file, 'utf8');
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] ?? '';
  const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [])[1] ?? '';
  const h1 = (main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] ?? '';
  const firstP = (main.match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] ?? '';
  // Analyse de TOUT le texte visible (et pas seulement title/h1/p) pour
  // détecter les libellés de composants restés en FR sur une route EN.
  const visible = strip(main);
  const content = [title, strip(h1), strip(firstP), visible].join('\n');

  const isEnRoute = relative('dist', file).replace(/\\/g, '/').startsWith('en/');
  const frCount = FR_MARKERS.filter((m) => content.includes(m)).length;
  const enCount = EN_MARKERS.filter((m) => content.includes(m)).length;

  // Sur une route EN, tous les liens internes doivent être préfixés /en/.
  if (isEnRoute) {
    const internalLinks = [...html.matchAll(/href="(\/[^"#?][^"]*)"/g)]
      .map((m) => m[1])
      .filter(
        (href) =>
          href !== '/en' &&
          !href.startsWith('/en/') &&
          !href.startsWith('/_astro/') &&
          !href.startsWith('/fonts/') &&
          !href.startsWith('/vendor/') &&
          href !== '/favicon.svg' &&
          href !== '/manifest.json' &&
          !href.startsWith('/api/')
      );
    if (internalLinks.length) {
      failures.push({
        file: relative('dist', file),
        expected: 'liens /en/ manquants',
        title,
        frCount: internalLinks.length,
        enCount: 0,
      });
    }
  }

  if (isEnRoute && frCount > enCount) {
    failures.push({ file: relative('dist', file), expected: 'en', title, frCount, enCount });
  }
  if (!isEnRoute && enCount > frCount) {
    failures.push({ file: relative('dist', file), expected: 'fr', title, frCount, enCount });
  }
}

if (AS_JSON) console.log(JSON.stringify({ failures }, null, 2));
else {
  console.log('check:i18n-build — cohérence langue / route');
  if (failures.length === 0) console.log('  OK — toutes les pages sont dans la bonne langue.');
  for (const f of failures)
    console.log(
      `  ${f.file} : attendu ${f.expected}, titre « ${f.title} » (fr=${f.frCount}, en=${f.enCount})`
    );
}
if (failures.length) process.exit(1);
