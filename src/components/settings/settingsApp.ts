/**
 * settings page Alpine logic, extracted as a pure
 * factory. The page keeps only the wiring (real DOM / localStorage / fetch
 * implementations) and its template.
 */

import type { Dictionary } from '../../i18n/types';
import type { Settings } from '../../lib/storage/types';
import {
  formatSyncLastLabel,
  formatSyncErrorLabel,
  parseRestTime,
  clampWeeklyGoal,
  exportFilename,
} from '../../lib/settings-stats';
import { getSettings, updateSettings } from '../../lib/storage/settings';
import { getWebdavPassword, setWebdavPassword } from '../../lib/storage/webdav-credentials';
import { exportAllData, importAllData, resetAllData } from '../../lib/storage/backup';
import { exportSessionsAsCSV } from '../../lib/storage/csv';
import { getSessionsThisWeek } from '../../lib/storage/sessions';
import { syncPush, syncPull, syncTest } from '../../lib/sync';

/** Maps the i18n dictionary to the flat label bag used by the template. */
export function buildSettingsLabels(L: Dictionary) {
  const s = L.settings;
  return {
    demoReadOnly: s.demoReadOnly,
    notSet: s.notSet,
    download: s.download,
    preparing: s.preparing,
    importing: s.importing,
    seanceSingular: s.seanceSingular,
    storageError: s.storageError,
    exportFailed: s.exportFailed,
    exportCsvFailed: s.exportCsvFailed,
    backupDownloaded: s.backupDownloaded,
    exportCsvDownloaded: s.exportCsvDownloaded,
    backupRestored: s.backupRestored,
    invalidFile: s.invalidFile,
    readError: s.readError,
    allDataReset: s.allDataReset,
    savedAtPrefix: s.savedAtPrefix,
    pseudoPlaceholder: s.pseudoPlaceholder,
    emailPlaceholder: s.emailPlaceholder,
    syncUrl: s.sync.url,
    syncUrlPlaceholder: s.sync.urlPlaceholder,
    syncConflict: s.sync.conflict,
    syncUsernamePlaceholder: s.sync.usernamePlaceholder,
    syncPasswordPlaceholder: s.sync.passwordPlaceholder,
    syncTest: s.sync.test,
    syncTesting: s.sync.testing,
    syncPush: s.sync.push,
    syncPushing: s.sync.pushing,
    syncPull: s.sync.pull,
    syncPulling: s.sync.pulling,
    syncTestOk: s.sync.testOk,
    syncTestOkNoBackup: s.sync.testOkNoBackup,
    syncPushed: s.sync.pushed,
    syncRestored: s.sync.restored,
    syncNotConfigured: s.sync.notConfigured,
    syncUnavailable: s.sync.unavailable,
    syncFallback: s.sync.fallback,
    syncLastSync: s.sync.lastSync,
    syncNever: s.sync.never,
    syncError: s.sync.error,
    resetConfirm: s.resetConfirm,
  };
}

export type SettingsLabels = ReturnType<typeof buildSettingsLabels>;

export interface SettingsAppDeps {
  labels: SettingsLabels;
  demo: boolean;
  clock: {
    now(): Date;
    nowIso(): string;
    locale(): string;
  };
  ui: {
    notify(message: string, kind?: string): void;
    download(filename: string, content: string, mime: string): void;
    readFile(file: File): Promise<string>;
    openDialog(id: string): void;
    closeDialog(id: string): void;
    pickImportFile(): void;
  };
}

export interface SettingsApp {
  display: Settings;
  exporting: boolean;
  exportingCsv: boolean;
  importing: boolean;
  resetConfirmText: string;
  weeklyDone: number;
  syncForm: { url: string; username: string; password: string };
  syncConfigured: boolean;
  syncBusy: 'test' | 'push' | 'pull' | null;
  syncHasBackup: boolean;
  syncLastLabel: string;
  labels: SettingsLabels;
  init(): void;
  toastSaved(): void;
  savePseudo(): void;
  saveEmail(): void;
  setUnit(unit: 'kg' | 'lbs'): void;
  setRepsFormat(format: 'simple' | 'range'): void;
  saveRestTime(value: string): void;
  saveSoundAlerts(checked: boolean): void;
  saveAdvancedMode(checked: boolean): void;
  setWeeklyGoal(value: number): void;
  exportData(): void;
  exportCSV(): void;
  triggerImport(): void;
  handleImportFile(event: Event): Promise<void>;
  askReset(): void;
  confirmReset(): void;
  saveSyncFields(): void;
  persistSyncConfig(): void;
  persistSyncConfigWithNow(): void;
  lastSyncLabel(lastSyncAt?: string): string;
  syncErrorLabel(err: unknown): string;
  testSync(): Promise<void>;
  askPush(): void;
  doPushSync(): Promise<void>;
  confirmPush(): Promise<void>;
  askRestore(): void;
  confirmRestore(): Promise<void>;
  openDialogById(id: string): void;
  closeDialogById(id: string): void;
}

export function createSettingsApp(deps: SettingsAppDeps): SettingsApp {
  const { labels, clock, ui, demo } = deps;
  const readOnly = (): boolean => {
    if (demo) ui.notify(labels.demoReadOnly ?? 'Compte démo : lecture seule.', 'warning');
    return demo;
  };

  return {
    display: getSettings(),
    exporting: false,
    exportingCsv: false,
    importing: false,
    resetConfirmText: '',
    weeklyDone: 0,
    syncForm: { url: '', username: '', password: '' },
    syncConfigured: false,
    syncBusy: null,
    syncHasBackup: false,
    syncLastLabel: '',
    labels,

    init() {
      this.display = getSettings();
      this.weeklyDone = getSessionsThisWeek().length;
      this.syncForm = {
        url: this.display.webdav?.url || '',
        username: this.display.webdav?.username || '',
        password: getWebdavPassword(),
      };
      this.syncConfigured = Boolean(this.display.webdav?.url);
      this.syncLastLabel = this.lastSyncLabel(this.display.webdav?.lastSyncAt);
    },

    toastSaved() {
      ui.notify(
        labels.savedAtPrefix +
          clock.now().toLocaleTimeString(clock.locale(), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        'success'
      );
    },

    savePseudo() {
      if (readOnly()) return;
      this.display = updateSettings({ pseudo: this.display.pseudo.trim() });
      this.toastSaved();
    },

    saveEmail() {
      if (readOnly()) return;
      this.display = updateSettings({ email: this.display.email.trim() });
      this.toastSaved();
    },

    setUnit(unit) {
      if (this.display.unit === unit) return;
      this.display = updateSettings({ unit });
      this.toastSaved();
    },

    setRepsFormat(format) {
      if (this.display.repsFormat === format) return;
      this.display = updateSettings({ repsFormat: format });
      this.toastSaved();
    },

    saveRestTime(value) {
      const rest = parseRestTime(value);
      if (rest === null || this.display.defaultRestTime === rest) return;
      this.display = updateSettings({ defaultRestTime: rest });
      this.toastSaved();
    },

    saveSoundAlerts(checked) {
      if (this.display.soundAlerts === checked) return;
      this.display = updateSettings({ soundAlerts: checked });
      this.toastSaved();
    },

    saveAdvancedMode(checked) {
      if (this.display.advancedMode === checked) return;
      this.display = updateSettings({ advancedMode: checked });
      document.documentElement.setAttribute('data-advanced', checked ? 'true' : 'false');
      this.toastSaved();
    },

    setWeeklyGoal(value) {
      const next = clampWeeklyGoal(value);
      if (next === null || this.display.weeklyGoal === next) return;
      this.display = updateSettings({ weeklyGoal: next });
      this.toastSaved();
    },

    exportData() {
      this.exporting = true;
      try {
        const snapshot = exportAllData();
        if (!snapshot) {
          ui.notify(labels.storageError, 'error');
          return;
        }
        ui.download(
          exportFilename('muscu-backup', 'json'),
          JSON.stringify(snapshot, null, 2),
          'application/json'
        );
        ui.notify(labels.backupDownloaded, 'success');
      } catch (err) {
        ui.notify(err instanceof Error ? err.message : labels.exportFailed, 'error');
      } finally {
        this.exporting = false;
      }
    },

    exportCSV() {
      this.exportingCsv = true;
      try {
        const csv = exportSessionsAsCSV();
        ui.download(exportFilename('muscu-sessions', 'csv'), csv, 'text/csv;charset=utf-8');
        ui.notify(labels.exportCsvDownloaded, 'success');
      } catch (err) {
        ui.notify(err instanceof Error ? err.message : labels.exportCsvFailed, 'error');
      } finally {
        this.exportingCsv = false;
      }
    },

    triggerImport() {
      ui.pickImportFile();
    },

    async handleImportFile(event) {
      if (readOnly()) return;
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      this.importing = true;
      try {
        const text = await ui.readFile(file);
        importAllData(JSON.parse(text));
        this.display = getSettings();
        ui.notify(labels.backupRestored, 'success');
      } catch (err) {
        ui.notify(err instanceof Error ? err.message : labels.invalidFile, 'error');
      } finally {
        this.importing = false;
        input.value = '';
      }
    },

    askReset() {
      this.resetConfirmText = '';
      ui.openDialog('set-reset-dialog');
    },

    confirmReset() {
      if (readOnly()) return;
      if (this.resetConfirmText !== 'SUPPRIMER') return;
      resetAllData();
      this.display = getSettings();
      this.resetConfirmText = '';
      ui.closeDialog('set-reset-dialog');
      ui.notify(labels.allDataReset, 'success');
    },

    saveSyncFields() {
      this.persistSyncConfig();
      this.toastSaved();
    },

    persistSyncConfig() {
      if (readOnly()) return;
      const url = this.syncForm.url.trim();
      setWebdavPassword(this.syncForm.password);
      this.display = updateSettings({
        webdav: {
          url,
          username: this.syncForm.username.trim(),
          password: '',
          lastSyncAt: url ? this.display.webdav?.lastSyncAt : undefined,
        },
      });
      this.syncConfigured = Boolean(url);
      this.syncLastLabel = this.lastSyncLabel(
        this.syncConfigured ? this.display.webdav?.lastSyncAt : undefined
      );
    },

    persistSyncConfigWithNow() {
      setWebdavPassword(this.syncForm.password);
      this.display = updateSettings({
        webdav: {
          url: this.syncForm.url.trim(),
          username: this.syncForm.username.trim(),
          password: '',
          lastSyncAt: clock.nowIso(),
        },
      });
      this.syncConfigured = true;
      this.syncLastLabel = this.lastSyncLabel(this.display.webdav?.lastSyncAt);
    },

    lastSyncLabel(lastSyncAt) {
      return formatSyncLastLabel(lastSyncAt, labels.syncNever, labels.syncLastSync);
    },

    syncErrorLabel(err) {
      return formatSyncErrorLabel(err, labels.syncError, labels.syncFallback);
    },

    async testSync() {
      if (readOnly()) return;
      if (!this.syncForm.url.trim()) {
        ui.notify(labels.syncNotConfigured, 'error');
        return;
      }
      this.syncBusy = 'test';
      try {
        const result = await syncTest(
          this.syncForm.url,
          this.syncForm.username,
          this.syncForm.password
        );
        this.syncHasBackup = result.hasBackup;
        ui.notify(result.hasBackup ? labels.syncTestOk : labels.syncTestOkNoBackup, 'success');
      } catch (err) {
        ui.notify(this.syncErrorLabel(err), 'error');
      } finally {
        this.syncBusy = null;
      }
    },

    askPush() {
      if (readOnly() || !this.syncForm.url.trim()) {
        ui.notify(labels.syncNotConfigured, 'error');
        return;
      }
      // On confirme toujours : un backup distant peut exister même si le test
      // de connexion n'a pas été lancé manuellement.
      ui.openDialog('set-push-dialog');
    },

    async doPushSync() {
      if (readOnly()) return;
      this.syncBusy = 'push';
      try {
        const snapshot = exportAllData();
        if (!snapshot) {
          ui.notify(labels.storageError, 'error');
          return;
        }
        await syncPush(this.syncForm.url, this.syncForm.username, this.syncForm.password, snapshot);
        this.syncHasBackup = true;
        this.persistSyncConfigWithNow();
        ui.notify(labels.syncPushed, 'success');
      } catch (err) {
        ui.notify(this.syncErrorLabel(err), 'error');
      } finally {
        this.syncBusy = null;
      }
    },

    async confirmPush() {
      ui.closeDialog('set-push-dialog');
      await this.doPushSync();
    },

    askRestore() {
      if (!this.syncForm.url.trim()) {
        ui.notify(labels.syncNotConfigured, 'error');
        return;
      }
      ui.openDialog('set-restore-dialog');
    },

    async confirmRestore() {
      if (readOnly()) return;
      this.syncBusy = 'pull';
      try {
        const snapshot = await syncPull(
          this.syncForm.url,
          this.syncForm.username,
          this.syncForm.password
        );
        importAllData(snapshot);
        this.display = getSettings();
        this.persistSyncConfigWithNow();
        ui.closeDialog('set-restore-dialog');
        ui.notify(labels.syncRestored, 'success');
      } catch (err) {
        ui.notify(this.syncErrorLabel(err), 'error');
      } finally {
        this.syncBusy = null;
      }
    },

    openDialogById(id) {
      ui.openDialog(id);
    },

    closeDialogById(id) {
      ui.closeDialog(id);
    },
  };
}
