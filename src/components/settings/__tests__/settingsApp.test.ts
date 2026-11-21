import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../../lib/storage/defaults';

const mocks = vi.hoisted(() => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  exportAllData: vi.fn(),
  importAllData: vi.fn(),
  resetAllData: vi.fn(),
  exportSessionsAsCSV: vi.fn(),
  getSessionsThisWeek: vi.fn(),
  syncPush: vi.fn(),
  syncPull: vi.fn(),
  syncTest: vi.fn(),
}));

vi.mock('../../../lib/storage/settings', () => ({
  getSettings: mocks.getSettings,
  updateSettings: mocks.updateSettings,
}));
vi.mock('../../../lib/storage/backup', () => ({
  exportAllData: mocks.exportAllData,
  importAllData: mocks.importAllData,
  resetAllData: mocks.resetAllData,
}));
vi.mock('../../../lib/storage/csv', () => ({
  exportSessionsAsCSV: mocks.exportSessionsAsCSV,
}));
vi.mock('../../../lib/storage/sessions', () => ({
  getSessionsThisWeek: mocks.getSessionsThisWeek,
}));
vi.mock('../../../lib/sync', () => ({
  syncPush: mocks.syncPush,
  syncPull: mocks.syncPull,
  syncTest: mocks.syncTest,
}));

import { buildSettingsLabels, createSettingsApp } from '../settingsApp';
import type { Dictionary } from '../../../i18n/types';

// Only the keys consumed by buildSettingsLabels are needed at runtime.
const dictionary = {
  settings: {
    notSet: 'non définie',
    download: 'Télécharger',
    preparing: 'Préparation',
    importing: 'Import',
    seanceSingular: 'séance',
    storageError: 'Stockage indisponible',
    exportFailed: 'Export impossible',
    exportCsvFailed: 'Export CSV impossible',
    backupDownloaded: 'Sauvegarde téléchargée',
    exportCsvDownloaded: 'CSV téléchargé',
    backupRestored: 'Sauvegarde restaurée',
    invalidFile: 'Fichier invalide',
    readError: 'Lecture impossible',
    allDataReset: 'Données effacées',
    savedAtPrefix: 'Enregistré à ',
    pseudoPlaceholder: 'Pseudo',
    emailPlaceholder: 'Email',
    sync: {
      url: 'URL',
      urlPlaceholder: 'https://…',
      conflict: 'Conflit',
      usernamePlaceholder: 'Utilisateur',
      passwordPlaceholder: 'Mot de passe',
      test: 'Tester',
      testing: 'Test en cours',
      push: 'Envoyer',
      pushing: 'Envoi en cours',
      pull: 'Restaurer',
      pulling: 'Restauration',
      testOk: 'Connexion OK',
      testOkNoBackup: 'Connexion OK, aucune sauvegarde',
      pushed: 'Sauvegarde envoyée',
      restored: 'Sauvegarde restaurée',
      notConfigured: 'WebDAV non configuré',
      unavailable: 'Indisponible',
      fallback: 'Erreur inconnue',
      lastSync: 'Dernière sync : ',
      never: 'jamais',
      error: {
        'sync-unavailable': 'Indisponible',
        'sync-network': 'Réseau indisponible',
        'sync-http': 'Erreur serveur',
      },
    },
    resetConfirm: 'SUPPRIMER',
  },
} as unknown as Dictionary;

function makeDeps(
  overrides: Partial<{
    now: Date;
    nowIso: string;
    locale: string;
  }> = {}
) {
  const notify = vi.fn();
  const download = vi.fn();
  const readFile = vi.fn(async () => '{"version":1}');
  const openDialog = vi.fn();
  const closeDialog = vi.fn();
  const pickImportFile = vi.fn();

  return {
    deps: {
      demo: false,
      labels: buildSettingsLabels(dictionary),
      clock: {
        now: () => overrides.now ?? new Date('2026-11-17T12:34:56Z'),
        nowIso: () => overrides.nowIso ?? '2026-11-17T12:34:56.000Z',
        locale: () => overrides.locale ?? 'fr-FR',
      },
      ui: { notify, download, readFile, openDialog, closeDialog, pickImportFile },
    },
    notify,
    download,
    readFile,
    openDialog,
    closeDialog,
    pickImportFile,
  };
}

// `makeApp` retourne l'app et ses dépendances ; on garde un alias pratique.
function create(overrides: Partial<{ locale: string }> = {}) {
  const built = makeDeps(overrides);
  return { app: createSettingsApp(built.deps), ...built };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSettings.mockReturnValue({ ...DEFAULT_SETTINGS });
  mocks.updateSettings.mockImplementation((updates) => ({ ...DEFAULT_SETTINGS, ...updates }));
  mocks.getSessionsThisWeek.mockReturnValue([]);
  mocks.exportAllData.mockReturnValue({ version: 1 });
  mocks.exportSessionsAsCSV.mockReturnValue('id;name\n');
  mocks.syncTest.mockResolvedValue({ reachable: true, hasBackup: false });
  mocks.syncPush.mockResolvedValue(undefined);
  mocks.syncPull.mockReturnValue({ version: 1 });
});

describe('createSettingsApp', () => {
  it('initializes from storage and fills the WebDAV form', () => {
    mocks.getSettings.mockReturnValue({
      ...DEFAULT_SETTINGS,
      webdav: { url: 'https://dav.test/', username: 'u', password: 'p' },
    });
    mocks.getSessionsThisWeek.mockReturnValue([{}, {}, {}]);

    const { app } = create();
    app.init();

    expect(app.weeklyDone).toBe(3);
    expect(app.syncConfigured).toBe(true);
    expect(app.syncForm).toEqual({ url: 'https://dav.test/', username: 'u', password: 'p' });
  });

  it('uses the injected locale for the saved toast', () => {
    const { app, notify } = create({ locale: 'en-US' });
    app.toastSaved();
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toContain('Enregistré à ');
  });

  it('does not duplicate the saved toast on weekly goal change', () => {
    const { app, notify } = create();
    app.setWeeklyGoal(5);
    expect(mocks.updateSettings).toHaveBeenCalledWith({ weeklyGoal: 5 });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid and unchanged weekly goals', () => {
    const { app, notify } = create();
    app.setWeeklyGoal(Number.NaN);
    app.setWeeklyGoal(DEFAULT_SETTINGS.weeklyGoal);
    expect(mocks.updateSettings).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('trims pseudo before saving', () => {
    const { app } = create();
    app.display.pseudo = '  Alice  ';
    app.savePseudo();
    expect(mocks.updateSettings).toHaveBeenCalledWith({ pseudo: 'Alice' });
  });

  it('exports JSON through the injected download function', () => {
    const { app, download, notify } = create();
    app.exportData();
    expect(download).toHaveBeenCalledWith(
      expect.stringContaining('muscu-backup'),
      expect.any(String),
      'application/json'
    );
    expect(notify).toHaveBeenCalledWith('Sauvegarde téléchargée', 'success');
    expect(app.exporting).toBe(false);
  });

  it('reports a missing snapshot instead of downloading', () => {
    mocks.exportAllData.mockReturnValue(null);
    const { app, download, notify } = create();
    app.exportData();
    expect(download).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('Stockage indisponible', 'error');
  });

  it('imports a file and reports read failures', async () => {
    const { app, notify, readFile } = create();
    const event = { target: { files: [{ name: 'backup.json' }], value: 'x' } } as unknown as Event;

    await app.handleImportFile(event);
    expect(mocks.importAllData).toHaveBeenCalledWith({ version: 1 });
    expect(notify).toHaveBeenCalledWith('Sauvegarde restaurée', 'success');
    expect(app.importing).toBe(false);

    readFile.mockRejectedValueOnce(new Error('Lecture impossible'));
    await app.handleImportFile(event);
    expect(notify).toHaveBeenCalledWith('Lecture impossible', 'error');
  });

  it('requires the exact reset confirmation text', () => {
    const { app, closeDialog, notify } = create();
    app.resetConfirmText = 'supprimer';
    app.confirmReset();
    expect(mocks.resetAllData).not.toHaveBeenCalled();

    app.resetConfirmText = 'SUPPRIMER';
    app.confirmReset();
    expect(mocks.resetAllData).toHaveBeenCalledOnce();
    expect(closeDialog).toHaveBeenCalledWith('set-reset-dialog');
    expect(notify).toHaveBeenCalledWith('Données effacées', 'success');
  });

  it('persists the sync timestamp from the injected clock', async () => {
    const { app } = create();
    app.syncForm = { url: 'https://dav.test/', username: 'u', password: 'p' };
    await app.doPushSync();
    expect(mocks.updateSettings).toHaveBeenCalledWith({
      webdav: {
        url: 'https://dav.test/',
        username: 'u',
        password: 'p',
        lastSyncAt: '2026-11-17T12:34:56.000Z',
      },
    });
    expect(app.syncBusy).toBeNull();
  });

  it('delegates dialogs and file picking to the page', () => {
    const { app, openDialog, closeDialog, pickImportFile } = create();
    app.openDialogById('a');
    app.closeDialogById('b');
    app.triggerImport();
    expect(openDialog).toHaveBeenCalledWith('a');
    expect(closeDialog).toHaveBeenCalledWith('b');
    expect(pickImportFile).toHaveBeenCalledOnce();
  });
});
