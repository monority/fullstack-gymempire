/**
 * Storage keys and default values.
 */

import type { ReminderSettings, Settings, WebdavSettings } from './types';

export const STORAGE_KEYS = {
  exercises: 'muscu:exercises',
  sessions: 'muscu:sessions',
  progress: 'muscu:progress',
  settings: 'muscu-settings',
  body: 'muscu:body',
  // Cooldown marker for the session reminder watcher: stores the
  // last notified "YYYY-MM-DD HH:MM" slot so a minutely reminder is
  // never fired repeatedly for the same minute/session.
  reminderNotified: 'muscu:reminder-notified',
} as const;

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  days: [1, 3, 5], // Mon, Wed, Fri
  time: '18:00',
};

export const DEFAULT_WEBDAV: WebdavSettings = {
  url: '',
  username: '',
  password: '',
};

export const DEFAULT_SETTINGS: Settings = {
  pseudo: '',
  email: '',
  unit: 'kg',
  repsFormat: 'simple',
  defaultRestTime: 90,
  soundAlerts: true,
  weeklyGoal: 3,
  reminders: DEFAULT_REMINDERS,
  webdav: DEFAULT_WEBDAV,
  benchmarksOptIn: false,
  advancedMode: false,
};

export const DEFAULT_EXERCISES: ReadonlyArray<{
  name: string;
  muscle: string;
  category: string;
}> = [
  // ── Pectoraux ──
  { name: 'Développé couché barre', muscle: 'Pectoraux', category: 'Barre' },
  { name: 'Développé couché haltères', muscle: 'Pectoraux', category: 'Haltère' },
  { name: 'Développé incliné barre', muscle: 'Pectoraux', category: 'Barre' },
  { name: 'Développé incliné haltères', muscle: 'Pectoraux', category: 'Haltère' },
  { name: 'Développé décliné barre', muscle: 'Pectoraux', category: 'Barre' },
  { name: 'Écarté poulie haute', muscle: 'Pectoraux', category: 'Poulie' },
  { name: 'Écarté poulie basse', muscle: 'Pectoraux', category: 'Poulie' },
  { name: 'Pullover haltère', muscle: 'Pectoraux', category: 'Haltère' },
  { name: 'Pec deck', muscle: 'Pectoraux', category: 'Machine' },
  { name: 'Dips pectoraux', muscle: 'Pectoraux', category: 'Poids du corps' },

  // ── Dos ──
  { name: 'Soulevé de terre barre', muscle: 'Dos', category: 'Barre' },
  { name: 'Rowing barre', muscle: 'Dos', category: 'Barre' },
  { name: 'Rowing haltère unilatéral', muscle: 'Dos', category: 'Haltère' },
  { name: 'Rowing poulie basse', muscle: 'Dos', category: 'Poulie' },
  { name: 'Tractions pronation', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Tractions supination', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Tractions neutral grip', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Tirage vertical poulie', muscle: 'Dos', category: 'Poulie' },
  { name: 'Tirage horizontal poulie', muscle: 'Dos', category: 'Poulie' },
  { name: 'Tirage nuque', muscle: 'Dos', category: 'Poulie' },
  { name: 'Rack pull', muscle: 'Dos', category: 'Barre' },
  { name: 'Hyperextension', muscle: 'Dos', category: 'Poids du corps' },
  { name: 'Rowing T-bar', muscle: 'Dos', category: 'Machine' },

  // ── Épaules ──
  { name: 'Développé militaire barre', muscle: 'Épaules', category: 'Barre' },
  { name: 'Développé haltères assis', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Développé Arnold', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Élévations latérales haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Élévations latérales poulie', muscle: 'Épaules', category: 'Poulie' },
  { name: 'Élévations frontales haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Élévations frontales barre', muscle: 'Épaules', category: 'Barre' },
  { name: 'Face pulls poulie', muscle: 'Épaules', category: 'Poulie' },
  { name: 'Shrugs barre', muscle: 'Épaules', category: 'Barre' },
  { name: 'Shrugs haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Oiseau haltères', muscle: 'Épaules', category: 'Haltère' },
  { name: 'Rowing menton barre', muscle: 'Épaules', category: 'Barre' },

  // ── Biceps ──
  { name: 'Curl barre droite', muscle: 'Biceps', category: 'Barre' },
  { name: 'Curl barre EZ', muscle: 'Biceps', category: 'Barre' },
  { name: 'Curl haltères', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl marteau haltères', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl concentré', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl incliné haltères', muscle: 'Biceps', category: 'Haltère' },
  { name: 'Curl poulie basse', muscle: 'Biceps', category: 'Poulie' },
  { name: 'Curl poulie haute', muscle: 'Biceps', category: 'Poulie' },
  { name: 'Curl pupitre', muscle: 'Biceps', category: 'Machine' },

  // ── Triceps ──
  { name: 'Extension poulie haute', muscle: 'Triceps', category: 'Poulie' },
  { name: 'Extension haltère nuque', muscle: 'Triceps', category: 'Haltère' },
  { name: 'Barre au front', muscle: 'Triceps', category: 'Barre' },
  { name: 'Dips triceps', muscle: 'Triceps', category: 'Poids du corps' },
  { name: 'Kickbacks haltères', muscle: 'Triceps', category: 'Haltère' },
  { name: 'Extension corde poulie', muscle: 'Triceps', category: 'Poulie' },
  { name: 'Skull crushers', muscle: 'Triceps', category: 'Barre' },

  // ── Quadriceps ──
  { name: 'Squat barre', muscle: 'Quadriceps', category: 'Barre' },
  { name: 'Squat goblet', muscle: 'Quadriceps', category: 'Haltère' },
  { name: 'Front squat', muscle: 'Quadriceps', category: 'Barre' },
  { name: 'Presse à cuisses', muscle: 'Quadriceps', category: 'Machine' },
  { name: 'Fentes marche haltères', muscle: 'Quadriceps', category: 'Haltère' },
  { name: 'Fentes barre', muscle: 'Quadriceps', category: 'Barre' },
  { name: 'Leg extension', muscle: 'Quadriceps', category: 'Machine' },
  { name: 'Squat hack', muscle: 'Quadriceps', category: 'Machine' },
  { name: 'Bulgarian split squat', muscle: 'Quadriceps', category: 'Haltère' },
  { name: 'Pistol squat', muscle: 'Quadriceps', category: 'Poids du corps' },

  // ── Ischio-jambiers ──
  { name: 'Leg curl couché', muscle: 'Ischio-jambiers', category: 'Machine' },
  { name: 'Leg curl assis', muscle: 'Ischio-jambiers', category: 'Machine' },
  { name: 'Soulevé de terre jambes tendues', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Soulevé de terre roumain', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Good morning barre', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Hip thrust barre', muscle: 'Ischio-jambiers', category: 'Barre' },
  { name: 'Nordic curl', muscle: 'Ischio-jambiers', category: 'Poids du corps' },

  // ── Fessiers ──
  { name: 'Hip thrust barre (fessiers)', muscle: 'Fessiers', category: 'Barre' },
  { name: 'Cable pull-through', muscle: 'Fessiers', category: 'Poulie' },
  { name: 'Squat sumo haltère', muscle: 'Fessiers', category: 'Haltère' },
  { name: 'Fentes marche (fessiers)', muscle: 'Fessiers', category: 'Haltère' },
  { name: 'Step-up haltères', muscle: 'Fessiers', category: 'Haltère' },
  { name: 'Pont fessier', muscle: 'Fessiers', category: 'Poids du corps' },

  // ── Mollets ──
  { name: 'Mollets debout machine', muscle: 'Mollets', category: 'Machine' },
  { name: 'Mollets assis machine', muscle: 'Mollets', category: 'Machine' },
  { name: 'Mollets marche', muscle: 'Mollets', category: 'Haltère' },
  { name: 'Mollets cheval', muscle: 'Mollets', category: 'Machine' },

  // ── Abdominaux ──
  { name: 'Crunch', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Crunch poulie', muscle: 'Abdominaux', category: 'Poulie' },
  { name: 'Planche', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Russian twists', muscle: 'Abdominaux', category: 'Haltère' },
  { name: 'Relevé de jambes', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Roue abdominale', muscle: 'Abdominaux', category: 'Machine' },
  { name: 'Pallof press', muscle: 'Abdominaux', category: 'Poulie' },
  { name: 'Dead bug', muscle: 'Abdominaux', category: 'Poids du corps' },
  { name: 'Mountain climbers', muscle: 'Abdominaux', category: 'Poids du corps' },

  // ── Avant-bras ──
  { name: 'Curl revers haltères', muscle: 'Avant-bras', category: 'Haltère' },
  { name: 'Curl revers barre', muscle: 'Avant-bras', category: 'Barre' },
  { name: 'Curl poignet barre', muscle: 'Avant-bras', category: 'Barre' },
];
