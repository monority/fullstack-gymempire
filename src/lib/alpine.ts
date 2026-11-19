/**
 * Pont typé vers le build Alpine auto-hébergé (ADR-001).
 * Aucun import direct d'Alpine, aucun `(window as any).Alpine`.
 */

export function getAlpine(): AlpineBridge | null {
  return window.Alpine ?? null;
}

/**
 * Enregistre un composant Alpine une fois pour toutes, en gérant les deux
 * cas : script exécuté avant le démarrage d'Alpine (listener `alpine:init`)
 * et script exécuté après (appel immédiat).
 */
export function registerAlpine<T, A extends unknown[]>(
  name: string,
  factory: (...args: A) => T
): void {
  const register = () => getAlpine()?.data(name, factory);
  document.addEventListener('alpine:init', register);
  if (getAlpine()) register();
}

/** Enregistre un store une seule fois (contrairement aux data factories). */
export function registerStore<T>(name: string, value: T): void {
  const register = () => getAlpine()?.store(name, value);
  if (getAlpine()) register();
  else document.addEventListener('alpine:init', register, { once: true });
}

interface SwapEvent extends Event {
  newDocument: Document;
}

/**
 * Lifecycle ClientRouter, déplacé tel quel depuis AppLayout.astro :
 * - ré-applique le thème sur le document entrant (correctif light/dark) ;
 * - ignore les racines Alpine de la page entrante le temps de l'enregistrement ;
 * - rejoue `alpine:init` puis initialise uniquement les nouvelles racines.
 */
export function installAlpineLifecycle(): void {
  document.addEventListener('astro:before-swap', (event) => {
    const swap = event as SwapEvent;
    window.__applyStoredTheme?.(swap.newDocument);
    swap.newDocument.querySelectorAll('main [x-data]').forEach((root) => {
      root.setAttribute('x-ignore', '');
    });
  });

  document.addEventListener('astro:page-load', () => {
    document.dispatchEvent(new CustomEvent('alpine:init'));
    window.setTimeout(() => {
      const alpine = getAlpine();
      if (!alpine) return;
      document.querySelectorAll('main [x-data][x-ignore]').forEach((root) => {
        root.removeAttribute('x-ignore');
        delete (root as HTMLElement & { _x_ignore?: unknown })._x_ignore;
        delete (root as HTMLElement & { _x_ignoreSelf?: unknown })._x_ignoreSelf;
        alpine.initTree(root);
      });
    }, 50);
  });
}
