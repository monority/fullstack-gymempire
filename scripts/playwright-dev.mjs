// A5 — serveur de dev dédié à Playwright.
//
// Astro 7 détecte automatiquement les environnements agent/IA et démonise
// `astro dev`. Le CLI rend la main immédiatement, ce qui fait croire à
// Playwright que le `webServer` est mort ("exited early"). On force donc le
// mode foreground avec ASTRO_DEV_BACKGROUND=0 et on garde un process parent
// vivant pendant toute la durée des tests.
import { spawn, execFileSync } from 'node:child_process';

// `--force` démonte un serveur laissé par un run précédent (verrou Astro).
const child = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', '4321', '--force'],
  {
    stdio: 'inherit',
    env: { ...process.env, ASTRO_DEV_BACKGROUND: '0' },
  }
);

let stopped = false;
function shutdown() {
  if (stopped) return;
  stopped = true;
  // Sur Windows, child.kill() ne tue pas les petits-enfants : le serveur
  // Astro resterait en vie et bloquerait le prochain run.
  if (process.platform === 'win32') {
    try {
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } catch {
      // Déjà terminé.
    }
  } else {
    child.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
child.on('exit', (code) => process.exit(code ?? 0));
