// Harnais de parité visuelle programmatique (Phase 1 CSS).
//   node scripts/style-parity.mjs save <label>
//   node scripts/style-parity.mjs diff <label-a> <label-b>
// Compare les styles CALCULÉS des éléments clés sur 14 routes avec un seed figé.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ROUTES = [
  '/',
  '/sessions',
  '/sessions/detail?id=s1',
  '/sessions/create',
  '/exercises',
  '/exercises/history?id=e1',
  '/calendar',
  '/progression/stats',
  '/progression/records',
  '/progression/poids',
  '/settings',
  '/calculator',
  '/timer',
  '/login',
];
const PROPS = [
  'textTransform',
  'fontVariantNumeric',
  'color',
  'fontFamily',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'backgroundColor',
  'borderColor',
  'borderRadius',
  'boxShadow',
  'display',
  'flexDirection',
  'alignItems',
  'justifyContent',
  'textAlign',
  'whiteSpace',
  'overflow',
  'visibility',
  'opacity',
]; // géométrie (width/height/gap) exclue : sensible au HMR et au chargement des polices
const DIR = 'test-results';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321';

const SEED = () => {
  localStorage.setItem('muscu-auth', JSON.stringify({ email: 'a@b.fr', name: 'Alex' }));
  localStorage.setItem(
    'muscu-settings',
    JSON.stringify({ pseudo: 'Alex', unit: 'kg', weeklyGoal: 3, defaultRestTime: 90 })
  );
  localStorage.setItem(
    'muscu:exercises',
    JSON.stringify([{ id: 'e1', name: 'Squat barre', muscle: 'Quadriceps', category: 'Barre' }])
  );
  const sets = [
    { exerciseId: 'e1', setNumber: 1, type: 'work', weight: 80, reps: 8, completed: true },
  ];
  localStorage.setItem(
    'muscu:sessions',
    JSON.stringify([
      {
        id: 's1',
        name: 'Push',
        date: '2026-11-17',
        status: 'completed',
        duration: 3900,
        mood: 'good',
        rpe: 8,
        fatigue: 3,
        notes: 'OK',
        exercises: [{ exerciseId: 'e1', name: 'Squat barre', muscle: 'Quadriceps', sets }],
      },
    ])
  );
  localStorage.setItem(
    'muscu:progress',
    JSON.stringify([
      { exerciseId: 'e1', date: '2026-11-17', estimated1RM: 106, bestWeight: 80, bestReps: 8 },
    ])
  );
};

async function save(label) {
  mkdirSync(DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(SEED);
  const out = {};
  for (const route of ROUTES) {
    await page.goto(BASE + route);
    await page.waitForTimeout(500);
    await page.evaluate(() => document.fonts.ready);
    out[route] = await page.evaluate((props) => {
      const nodes = [...document.querySelectorAll('[class]')].filter((el) =>
        /__(label|stat|value|head|meta|title|mood|fatigue|rpe)|stat-card__|week-metric__|/.test(
          el.className && typeof el.className === 'string' ? el.className : ''
        )
      );
      return nodes.slice(0, 120).map((el) => {
        const cs = getComputedStyle(el);
        const values = {};
        for (const p of props) values[p] = cs[p];
        return { cls: String(el.className).slice(0, 120), tag: el.tagName, values };
      });
    }, PROPS);
  }
  await browser.close();
  writeFileSync(`${DIR}/style-${label}.json`, JSON.stringify(out, null, 2));
  console.log(`saved ${DIR}/style-${label}.json`);
}

function diff(a, b) {
  const A = JSON.parse(readFileSync(`${DIR}/style-${a}.json`, 'utf8'));
  const B = JSON.parse(readFileSync(`${DIR}/style-${b}.json`, 'utf8'));
  const changes = [];
  for (const route of ROUTES) {
    const x = A[route] || [],
      y = B[route] || [];
    if (x.length !== y.length) {
      changes.push(`${route}: nombre d'éléments ${x.length} -> ${y.length}`);
      continue;
    }
    for (let i = 0; i < x.length; i++) {
      for (const p of PROPS) {
        if (x[i].values[p] !== y[i].values[p])
          changes.push(
            `${route} [${i}] ${x[i].cls} :: ${p} : ${x[i].values[p]} -> ${y[i].values[p]}`
          );
      }
    }
  }
  console.log(
    changes.length ? changes.slice(0, 60).join('\n') : 'Aucune différence de style calculé.'
  );
  if (changes.length > 60) console.log(`... et ${changes.length - 60} autres`);
  process.exitCode = changes.length ? 1 : 0;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'save') await save(args[0] || 'current');
else if (cmd === 'diff') diff(args[0], args[1]);
else console.log('Usage: node scripts/style-parity.mjs save <label> | diff <a> <b>');
