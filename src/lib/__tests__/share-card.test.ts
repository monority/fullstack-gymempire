// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  downloadDataUrl,
  drawRoundRect,
  generateSessionShareCard,
  truncateForCanvas,
  type ShareCardLabels,
} from '../share-card';
import type { Session } from '../storage/types';

const labels: ShareCardLabels = {
  exercises: 'Exercices',
  shareSetsLabel: 'SÉRIES',
  volume: 'Volume',
  setSingular: 'série',
  setPlural: 'séries',
  moreSingular: 'autre',
  morePlural: 'autres',
  shareFooter: 'Gym Empire — Training Log',
  completed: 'Terminée',
  inProgress: 'En cours',
  planned: 'Planifiée',
};

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 's1',
  name: 'Séance Push très longue pour tester la troncature du titre',
  date: '2026-11-25',
  status: 'completed',
  exercises: [
    {
      exerciseId: 'e1',
      name: 'Développé couché',
      muscle: 'Pectoraux',
      sets: [
        {
          exerciseId: 'e1',
          setNumber: 1,
          type: 'work',
          weight: 80,
          reps: 8,
          completed: true,
        },
      ],
    },
  ],
  ...overrides,
});

function fakeContext() {
  const calls: Array<[string, unknown[]]> = [];
  const ctx = new Proxy(
    {
      measureText: (text: string) => ({ width: text.length * 10 }),
    } as unknown as CanvasRenderingContext2D,
    {
      get(target, prop: string) {
        const value = (target as unknown as Record<string, unknown>)[prop];
        if (value !== undefined) return value;
        return (...args: unknown[]) => {
          calls.push([prop, args]);
          return undefined;
        };
      },
      set(target, prop: string, value: unknown) {
        calls.push(['set:' + prop, [value]]);
        (target as unknown as Record<string, unknown>)[prop] = value;
        return true;
      },
    }
  );
  return { ctx, calls };
}

const originalCreateElement = document.createElement.bind(document);
let createdCanvas: { width: number; height: number; getContext: () => unknown; toBlob: unknown };
let blobResult: Blob | null;

beforeEach(() => {
  blobResult = new Blob(['png'], { type: 'image/png' });
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag === 'canvas') {
      createdCanvas = {
        width: 0,
        height: 0,
        getContext: () => fakeContext().ctx,
        toBlob: (cb: (b: Blob | null) => void) => cb(blobResult),
      };
      return createdCanvas as unknown as HTMLElement;
    }
    return originalCreateElement(tag);
  }) as typeof document.createElement);
  vi.stubGlobal(
    'FileReader',
    class {
      result = 'data:image/png;base64,MOCK';
      onloadend: (() => void) | null = null;
      readAsDataURL() {
        this.onloadend?.();
      }
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('truncateForCanvas', () => {
  it('laisse le texte court intact', () => {
    const { ctx } = fakeContext();
    expect(truncateForCanvas(ctx, 'Court', 100)).toBe('Court');
  });

  it('tronque avec une ellipse quand le texte dépasse', () => {
    const { ctx } = fakeContext();
    const source = 'Un titre beaucoup trop long';
    const result = truncateForCanvas(ctx, source, 80);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThan(source.length);
  });
});

describe('drawRoundRect', () => {
  it('trace un chemin fermé avec un rayon borné', () => {
    const { ctx, calls } = fakeContext();
    drawRoundRect(ctx, 10, 20, 100, 40, 50);
    const names = calls.map(([name]) => name);
    expect(names).toContain('beginPath');
    expect(names).toContain('closePath');
    expect(calls.filter(([name]) => name === 'quadraticCurveTo')).toHaveLength(4);
  });
});

describe('generateSessionShareCard', () => {
  it('génère une image 1080x1080 et un data URL', async () => {
    const result = await generateSessionShareCard(session(), { labels });
    expect(createdCanvas.width).toBe(1080);
    expect(createdCanvas.height).toBe(1080);
    expect(result).toBe('data:image/png;base64,MOCK');
  });

  it('retourne une chaîne vide si le blob est absent', async () => {
    blobResult = null;
    expect(await generateSessionShareCard(session(), { labels })).toBe('');
  });

  it('gère une séance vide et un statut planifié', async () => {
    const result = await generateSessionShareCard(session({ status: 'planned', exercises: [] }), {
      labels,
    });
    expect(result).toBe('data:image/png;base64,MOCK');
  });
});

describe('downloadDataUrl', () => {
  it('crée un lien temporaire, le clique et le retire', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const append = vi.spyOn(document.body, 'appendChild');
    const remove = vi.spyOn(document.body, 'removeChild');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    downloadDataUrl('data:image/png;base64,AA', 'card.png');
    expect(click).toHaveBeenCalledOnce();
    expect(append).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });
});
