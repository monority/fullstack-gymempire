// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearWebdavPassword,
  getWebdavPassword,
  migrateLegacyWebdavPassword,
  setWebdavPassword,
} from '../storage/webdav-credentials';

describe('identifiants WebDAV', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    clearWebdavPassword();
  });

  it('ne persiste pas le mot de passe dans localStorage', () => {
    setWebdavPassword('secret');
    expect(getWebdavPassword()).toBe('secret');
    expect(sessionStorage.getItem('muscu:webdav-password')).toBe('secret');
    expect(localStorage.getItem('muscu:webdav-password')).toBeNull();
  });

  it('efface la valeur quand le mot de passe est vide', () => {
    setWebdavPassword('secret');
    setWebdavPassword('');
    expect(getWebdavPassword()).toBe('');
    expect(sessionStorage.getItem('muscu:webdav-password')).toBeNull();
  });

  it('migre un ancien mot de passe sans écraser une valeur existante', () => {
    migrateLegacyWebdavPassword('legacy');
    expect(getWebdavPassword()).toBe('legacy');

    setWebdavPassword('nouveau');
    migrateLegacyWebdavPassword('legacy');
    expect(getWebdavPassword()).toBe('nouveau');
  });

  it('ignore une valeur legacy invalide', () => {
    migrateLegacyWebdavPassword(42);
    migrateLegacyWebdavPassword('');
    expect(getWebdavPassword()).toBe('');
  });
});
