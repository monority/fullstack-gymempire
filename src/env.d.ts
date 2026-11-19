/** Pont typé vers le build Alpine auto-hébergé (voir docs/adr/001-alpine-esm.md). */
interface AlpineBridge {
  // Le build Alpine auto-hébergé n'a pas de .d.ts : on ne contextualise pas
  // les factories, comme quand Alpine était typé `any` (comportement précédent).
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  data: Function;
  store: (name: string, value: unknown) => void;
  initTree(root: Element): void;
  $data?: (el: Element) => unknown;
}

interface Window {
  Alpine?: AlpineBridge;
  /** Fourni par /theme-bootstrap.js pour les swaps ClientRouter. */
  __applyStoredTheme?: (doc: Document) => void;
  showToast?: (message: string, variant?: string) => void;
}

interface AlpineMagicThis {
  $el: HTMLElement;
  $root: HTMLElement;
  $refs: Record<string, HTMLElement | undefined>;
  $nextTick: (callback: () => void) => void;
}
