// Outil de revue visuelle (non versionné dans git) :
//   pnpm dev                 # dans un autre terminal
//   pnpm screens             # captures dark + light de 14 pages
// Les PNG sont écrits dans test-results/screens (ignoré par git).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = process.env.SCREENS_DIR || 'test-results/screens';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4321';
mkdirSync(OUT, { recursive: true });

const session = {
  id: 's1',
  name: 'Séance Push',
  date: '2026-11-17T10:00:00.000Z',
  status: 'completed',
  duration: 3600,
  mood: 'great',
  rpe: 8,
  fatigue: 2,
  notes: 'Bonne séance, un peu fatigué en fin de session.',
  exercises: [
    {
      exerciseId: 'e1',
      name: 'Développé couché barre',
      muscle: 'Pectoraux',
      sets: [
        { exerciseId: 'e1', setNumber: 1, type: 'work', weight: 80, reps: 8, completed: true },
        { exerciseId: 'e1', setNumber: 2, type: 'work', weight: 80, reps: 8, completed: true },
        { exerciseId: 'e1', setNumber: 3, type: 'work', weight: 75, reps: 10, completed: true },
      ],
    },
  ],
};

const routes = [
  ['dashboard', '/'],
  ['sessions', '/sessions'],
  ['builder', '/sessions/create'],
  ['quick', '/sessions/quick'],
  ['detail', '/sessions/detail?id=s1'],
  ['exercises', '/exercises'],
  ['calendar', '/calendar'],
  ['stats', '/progression/stats'],
  ['records', '/progression/records'],
  ['poids', '/progression/poids'],
  ['settings', '/settings'],
  ['timer', '/timer'],
  ['calculator', '/calculator'],
  ['login', '/login'],
];

const browser = await chromium.launch();
for (const theme of ['dark', 'light']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript((mode) => {
    if (sessionStorage.getItem('__cap_seeded')) return;
    localStorage.clear();
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'qa@gymempire.test', name: 'QA' }));
    localStorage.setItem('muscu-theme', mode);
    sessionStorage.setItem('__cap_seeded', '1');
  }, theme);

  for (const [name, route] of routes) {
    await page.goto(BASE + route);
    await page.evaluate((s) => {
      localStorage.setItem('muscu:sessions', JSON.stringify([s]));
    }, session);
    await page.reload();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${name}-${theme}.png`, fullPage: true });
    console.log(`${name}-${theme}.png`);
  }
  await page.close();
}
await browser.close();
