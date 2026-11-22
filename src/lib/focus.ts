/** Utilitaires de focus partagés entre le shell et les dialogues. */

/** Sélecteur des éléments focalisables (hors éléments désactivés). */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Éléments focalisables visibles dans un conteneur.
 * Le filtre par défaut écarte les éléments cachés (attribut `hidden` ou
 * `display:none` via offsetParent) pour éviter de piéger le focus sur du
 * contenu invisible.
 */
export function getFocusable(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.tabIndex !== -1 &&
      !el.hasAttribute('hidden') &&
      el.offsetParent !== null
  );
}
