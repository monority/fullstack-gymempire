/**
 * Géométrie et primitives SVG partagées par les graphiques (poids, volume,
 * fréquence, donut). Centralise le calcul de la zone de tracé et le balisage
 * commun pour éviter que les graphiques divergent avec le temps.
 */

export interface ChartPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PlotArea {
  /** Largeur de la zone de tracé : W - left - right. */
  width: number;
  /** Hauteur de la zone de tracé : H - top - bottom. */
  height: number;
  left: number;
  top: number;
  /** Bord droit : W - right. */
  right: number;
  /** Bord bas : H - bottom (égal à top + height). */
  bottom: number;
  /** Ligne de base du graphique : top + height. */
  baselineY: number;
}

/** Calcule la zone de tracé à partir des dimensions et des marges. */
export function plotArea(W: number, H: number, pad: ChartPadding): PlotArea {
  const width = W - pad.left - pad.right;
  const height = H - pad.top - pad.bottom;
  return {
    width,
    height,
    left: pad.left,
    top: pad.top,
    right: W - pad.right,
    bottom: H - pad.bottom,
    baselineY: pad.top + height,
  };
}

/** Balise d'ouverture `<svg>` commune à tous les graphiques. */
export function svgRoot(W: number, H: number, className: string, ariaLabel: string): string {
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="${className}" role="img" aria-label="${ariaLabel}">`;
}

/** Ligne de grille horizontale traversant la zone de tracé. */
export function gridLine(area: PlotArea, y: number, color: string): string {
  return `<line x1="${area.left}" y1="${y.toFixed(1)}" x2="${area.right}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="1"/>`;
}
