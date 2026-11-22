// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navId, renderIcon, chevronDown } from '../nav';
import { normalize } from '../text';
import { buildDescribedBy } from '../form-utils';
import { slugify, downloadBlob } from '../csv-export';
import { parseLocalDate, localDateKey } from '../date';

describe('nav helpers', () => {
  it('navId retire le préfixe de locale et les caractères spéciaux', () => {
    expect(navId('/en/progression/poids')).toBe('progression-poids');
    expect(navId('/sessions/create')).toBe('sessions-create');
    expect(navId('/')).toBe('');
  });

  it('renderIcon utilise le registre et gère les absences', () => {
    expect(renderIcon('arrowLeft')).toContain('<svg');
    expect(renderIcon('inconnu')).toBe('');
    expect(renderIcon()).toBe('');
    expect(chevronDown).toContain('<polyline');
  });
});

describe('text et formulaires', () => {
  it('normalize ignore la casse et les accents', () => {
    expect(normalize('Échec')).toBe('echec');
    expect(normalize('DéVELOPPÉ')).toBe('developpe');
  });

  it('buildDescribedBy combine hint et erreur', () => {
    expect(buildDescribedBy(undefined, 'hint')).toBeUndefined();
    expect(buildDescribedBy('name')).toBeUndefined();
    expect(buildDescribedBy('name', 'aide')).toBe('name-hint');
    expect(buildDescribedBy('name', 'aide', 'erreur')).toBe('name-hint name-error');
  });
});

describe('csv-export', () => {
  it('slugify produit un nom de fichier sûr', () => {
    expect(slugify('Séance Push')).toBe('seance-push');
    expect(slugify('Échec / 100%')).toBe('echec-100');
    expect(slugify('!!!')).toBe('seance');
  });

  it('downloadBlob déclenche un téléchargement et nettoie le DOM', () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:test');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const append = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const remove = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    downloadBlob('test.csv', 'a,b', 'text/csv');
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalledWith(anchor);
    expect(remove).toHaveBeenCalledWith(anchor);
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith('blob:test');

    createElement.mockRestore();
    append.mockRestore();
    remove.mockRestore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});

describe('date', () => {
  it('parseLocalDate et localDateKey sont cohérents', () => {
    expect(localDateKey(parseLocalDate('2026-11-17'))).toBe('2026-11-17');
    expect(parseLocalDate('2026-11-17T10:00:00.000Z').toISOString()).toBe(
      '2026-11-17T10:00:00.000Z'
    );
  });
});

afterEach(() => vi.restoreAllMocks());
