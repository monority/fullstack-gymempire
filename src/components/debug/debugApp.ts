/** Logique Alpine de la page /debug (outil dev) — extraite de debug.astro (P3). */
import { generateDemoData, resetAllData, currentCounts } from '../../lib/seed';

export interface DebugApp {
  counts: ReturnType<typeof currentCounts>;
  summary: string;
  message: string;
  busy: boolean;
  init(): void;
  refresh(): void;
  generate(): void;
  wipe(): void;
}

export function createDebugApp(): DebugApp {
  return {
    counts: { sessions: 0, progress: 0, body: 0, exercises: 0 },
    summary: '',
    message: '',
    busy: false,

    init() {
      this.refresh();
    },

    refresh() {
      this.counts = currentCounts();
    },

    generate() {
      if (this.busy) return;
      this.busy = true;
      this.message = '';
      // Laisse le libellé "occupied" se repeindre avant le travail synchrone.
      window.setTimeout(() => {
        const s = generateDemoData();
        this.summary =
          `Exercices   : ${s.exercises}\n` +
          `Séances     : ${s.sessions} (${s.completed} complétées, ${s.inProgress} en cours, ${s.planned} planifiées)\n` +
          `Progression : ${s.progressRecords} records\n` +
          `Mesures     : ${s.bodyRecords} entrées\n` +
          `\nLien démo séance : /sessions/detail?id=${s.demoSessionId}\n` +
          `Lien démo comparaison : /sessions/compare?id1=${s.compareId1}&id2=${s.compareId2}`;
        this.refresh();
        this.busy = false;
        this.message = "OK — données de test générées. Parcours l'app depuis le dashboard.";
      }, 30);
    },

    wipe() {
      if (this.busy) return;
      if (!window.confirm('Effacer toutes les données (séances, progression, mesures) ?')) return;
      resetAllData();
      this.refresh();
      this.summary = '';
      this.message = 'Données effacées.';
    },
  };
}
