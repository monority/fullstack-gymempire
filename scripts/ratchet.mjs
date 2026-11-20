/**
 * Ratchet de qualité : la dette existante est tolérée, mais toute
 * AUGMENTATION d'un compteur fait échouer la CI. On abaisse la baseline
 * au fur et à mesure des lots de nettoyage.
 */
import { existsSync, readFileSync } from 'node:fs';

const BASELINE_FILE = 'scripts/quality-baseline.json';

export function enforceRatchet(name, byRule, strict) {
  if (!strict) return;
  if (!existsSync(BASELINE_FILE)) {
    console.error(`Ratchet: ${BASELINE_FILE} introuvable.`);
    process.exit(1);
  }
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))[name] ?? {};
  const regressions = [];
  for (const [rule, count] of Object.entries(byRule)) {
    const allowed = baseline[rule] ?? 0;
    if (count > allowed) regressions.push(`  ${rule}: ${count} > baseline ${allowed}`);
  }
  if (regressions.length) {
    console.error(`Ratchet ${name} — dette en augmentation :`);
    for (const line of regressions) console.error(line);
    process.exit(1);
  }
  console.log(`Ratchet ${name} — OK (aucune nouvelle dette).`);
}
