/**
 * pure SVG/HTML renderers for the stats page.
 *
 * No Alpine, no localStorage, no Date.now(): data, labels and DOM-dependent
 * helpers are injected. Renderers return deterministic strings so they can
 * be snapshot-tested without a browser.
 */

import type { PercentileBand } from '../benchmarks';
import { muscleHue } from '../colors';
import { familyLabel, groupByFamily, muscleToneColor, svgEscape } from '../stats-helpers';
import type { MuscleVolumeSlice } from '../volume-stats';
import type { TopExercise, WeekBucket } from '../week-aggregation';
import { gridLine, plotArea, svgRoot } from './geometry';

export interface StatsChartLabels {
  kg: string;
  noData: string;
  volumeChart: string;
  freqChart: string;
  volumeByMuscle: string;
  total: string;
  sessionSingular: string;
  volumeEmpty: string;
  benchmarksEmpty: string;
  benchmarksColExercise: string;
  benchmarksColYour1RM: string;
  benchmarksPctl50: string;
  benchmarksPctl75: string;
  benchmarksPctl90: string;
  benchmarksTitle: string;
  benchmarksNoBands: string;
}

export interface StatsChartDeps {
  cssVar(name: string): string;
  cssVarAlpha(name: string, alpha: number): string;
  formatNumber(n: number): string;
  formatDate(iso: string): string;
  trExercise(name: string): string;
  trMuscle(name: string): string;
}

export interface BenchmarkRowView {
  exercise: string;
  userValue: number | null;
  band: PercentileBand | null;
  p50: number;
  p75: number;
  p90: number;
}

/** Percentile badge below a benchmark value; no badge under p50. */
export function benchmarkBadge(band: PercentileBand | null): string {
  const lower: Record<string, string> = {
    'p50-p75': '50',
    'p75-p90': '75',
    'p90+': '90',
  };
  if (!band || !(band in lower)) return '';
  return `<span class="stats__bench-badge">≥ ${lower[band]}ᵉ</span>`;
}

/** 12-week weekly volume: area + line chart. */
export function renderVolumeChart(
  weeks: WeekBucket[],
  labels: StatsChartLabels,
  deps: StatsChartDeps
): string {
  const W = 1000;
  const H = 280;
  const area = plotArea(W, H, { left: 50, right: 16, top: 16, bottom: 48 });
  const { width: plotW, height: plotH, left: PAD_L, top: PAD_T } = area;

  const accent = deps.cssVar('--color-accent');
  const muted = deps.cssVar('--color-muted');
  const grid = deps.cssVar('--color-border');

  if (weeks.length === 0) {
    return `<p class="stats__empty" role="status">${labels.noData}</p>`;
  }

  const maxVol = weeks.reduce((m, b) => (b.volume > m ? b.volume : m), 0);
  const peak = maxVol > 0 ? maxVol * 1.1 : 1;

  const ticks = 4;
  const tickPositions: { y: number; value: number }[] = [];
  for (let i = 0; i <= ticks; i++) {
    tickPositions.push({
      value: (peak * i) / ticks,
      y: PAD_T + (1 - i / ticks) * plotH,
    });
  }

  const slotW = plotW / Math.max(1, weeks.length - 1);
  const baselineY = area.baselineY;
  const points = weeks.map((bucket, i) => ({
    bucket,
    x: weeks.length === 1 ? PAD_L + plotW / 2 : PAD_L + i * slotW,
    y: baselineY - (bucket.volume / peak) * plotH,
  }));

  const labelIdxs: number[] = [];
  weeks.forEach((_, i) => {
    // On garde un intervalle libre avant le dernier libellé (aligné à droite)
    // pour éviter que l'avant-dernier, centré, ne vienne le chevaucher.
    if (i === 0 || i === weeks.length - 1 || (i % 2 === 0 && i < weeks.length - 2)) {
      labelIdxs.push(i);
    }
  });

  let svg = svgRoot(W, H, 'stats__chart', labels.volumeChart);

  for (const t of tickPositions) {
    svg += gridLine(area, t.y, grid);
    svg += `<text x="${PAD_L - 8}" y="${(t.y + 4).toFixed(1)}" font-size="13" fill="${muted}" text-anchor="end" font-family="var(--font-body, sans-serif)">${deps.formatNumber(t.value)}</text>`;
  }

  const linePath = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baselineY.toFixed(1)} L ${points[0].x.toFixed(1)} ${baselineY.toFixed(1)} Z`;
  svg += `<path d="${areaPath}" fill="${deps.cssVarAlpha('--color-accent', 0.08)}" aria-hidden="true"/>`;
  svg += `<path d="${linePath}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  points.forEach((point, i) => {
    const radius = i === points.length - 1 ? 4.5 : 3;
    svg += `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${radius}" fill="${accent}"><title>${deps.formatDate(point.bucket.key)} · ${deps.formatNumber(point.bucket.volume)} ${labels.kg}</title></circle>`;
  });

  svg += gridLine(area, area.baselineY, grid);

  for (const i of labelIdxs) {
    const b = weeks[i];
    // Les libellés extrêmes sont alignés sur les bords de la zone de tracé :
    // centrés, ils dépassaient du viewBox et étaient coupés à l'écran.
    const isFirst = i === 0;
    const isLast = i === weeks.length - 1;
    const cx = isFirst ? area.left : isLast ? area.right : points[i].x;
    const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
    svg += `<text x="${cx.toFixed(1)}" y="${(PAD_T + plotH + 24).toFixed(1)}" font-size="12" fill="${muted}" text-anchor="${anchor}" font-family="var(--font-body, sans-serif)">${deps.formatDate(b.key)}</text>`;
  }

  return svg + '</svg>';
}

/** Volume-by-muscle donut, grouped by muscle family. */
export function renderMuscleChart(
  slices: MuscleVolumeSlice[],
  labels: StatsChartLabels,
  deps: StatsChartDeps
): string {
  const groups = groupByFamily(slices);
  if (groups.length === 0) {
    return `<p class="stats__empty" role="status">${labels.volumeEmpty}</p>`;
  }

  const W = 300;
  const H = 300;
  const cx = W / 2;
  const cy = H / 2;
  const r = 100;
  const thickness = 14;
  const C = 2 * Math.PI * r;

  const accent = deps.cssVar('--color-accent');
  const muted = deps.cssVar('--color-muted');

  let arcs = '';
  let cursor = 0;
  for (const g of groups) {
    const frac = g.pct / 100;
    const segLen = C * frac;
    const gapLen = Math.max(0, C - segLen);
    const offset = -(C * cursor);
    cursor += frac;

    const color = muscleToneColor(g.dominant.muscle, deps.cssVar);
    const tip = `${svgEscape(familyLabel(g, deps.trMuscle))} · ${deps.formatNumber(g.volume)} ${labels.kg} · ${Math.round(g.pct)}%`;
    arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${thickness}" stroke-dasharray="${segLen.toFixed(2)} ${gapLen.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"><title>${tip}</title></circle>`;
  }

  const total = groups.reduce((s, g) => s + g.volume, 0);

  const legend = groups
    .map((g) => {
      const color = muscleToneColor(g.dominant.muscle, deps.cssVar);
      const name = svgEscape(familyLabel(g, deps.trMuscle));
      const tip = `${name} · ${deps.formatNumber(g.volume)} ${labels.kg} · ${Math.round(g.pct)}%`;
      return `
              <li class="stats__legend-row" title="${tip}">
                <span class="stats__legend-swatch" style="background: ${color}" aria-hidden="true"></span>
                <span class="stats__legend-name">${name}</span>
                <span class="stats__legend-pct">${Math.round(g.pct)}%</span>
                <span class="stats__legend-value">${deps.formatNumber(g.volume)} ${labels.kg}</span>
              </li>`;
    })
    .join('');

  return `
<div class="stats__donut">
  ${svgRoot(W, H, 'stats__donut-svg', labels.volumeByMuscle)}
    <g transform="rotate(-90 ${cx} ${cy})">
      ${arcs}
    </g>
    <text x="${cx}" y="${cy - 4}" font-size="13" fill="${muted}" text-anchor="middle" font-family="var(--font-body, sans-serif)" letter-spacing="0.1em">${labels.total.toUpperCase()}</text>
    <text x="${cx}" y="${cy + 20}" font-size="22" fill="${accent}" text-anchor="middle" font-family="var(--font-display, sans-serif)" font-weight="700">${deps.formatNumber(total)} ${labels.kg}</text>
  </svg>
  <ul class="stats__donut-legend" aria-label="${labels.volumeByMuscle}">
    ${legend}
  </ul>
</div>`.trim();
}

/** 8-week training frequency: bars on a subtle rail, readable date ticks. */
export function renderFrequencyChart(
  weeks: WeekBucket[],
  labels: StatsChartLabels,
  deps: StatsChartDeps
): string {
  if (weeks.length === 0) {
    return `<p class="stats__empty" role="status">${labels.noData}</p>`;
  }

  const W = 480;
  const H = 260;
  const area = plotArea(W, H, { left: 12, right: 12, top: 26, bottom: 36 });
  const { width: plotW, height: plotH, left: PAD_L, top: PAD_T, baselineY } = area;
  const muted = deps.cssVar('--color-muted');
  const grid = deps.cssVar('--color-border');
  const rail = deps.cssVar('--color-surface-3');

  const peak = Math.max(1, ...weeks.map((w) => w.sessionCount));
  const slotW = plotW / weeks.length;
  const barW = Math.min(30, Math.max(10, slotW * 0.5));
  const last = weeks.length - 1;

  let svg = svgRoot(W, H, 'stats__chart stats__chart--freq', labels.freqChart);
  svg += gridLine(area, baselineY, grid);

  weeks.forEach((bucket, i) => {
    const cx = PAD_L + i * slotW + slotW / 2;
    const h = (bucket.sessionCount / peak) * plotH;
    const y = baselineY - h;
    // Dégradé de récence : les vieilles semaines s'estompent, la dernière ressort.
    const alpha = 0.32 + 0.68 * (i / Math.max(1, last));
    svg += `<line x1="${cx.toFixed(1)}" y1="${PAD_T}" x2="${cx.toFixed(1)}" y2="${baselineY.toFixed(1)}" stroke="${rail}" stroke-width="${barW.toFixed(1)}" stroke-linecap="round" opacity="0.55"/>`;
    svg += `<rect x="${(cx - barW / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="${(barW / 2).toFixed(1)}" fill="${deps.cssVarAlpha('--color-accent', alpha)}"><title>${deps.formatDate(bucket.key)} · ${bucket.sessionCount} ${labels.sessionSingular}${bucket.sessionCount > 1 ? 's' : ''}</title></rect>`;
    if (bucket.sessionCount > 0) {
      svg += `<text x="${cx.toFixed(1)}" y="${(y - 8).toFixed(1)}" font-size="12" font-weight="700" fill="${muted}" text-anchor="middle" font-family="var(--font-display, sans-serif)">${bucket.sessionCount}</text>`;
    }
  });

  // Peu de libellés : les extrêmes sont alignés sur les bords, les autres
  // espacés d'une semaine sur deux, avec un trou avant le dernier.
  weeks.forEach((bucket, i) => {
    if (i !== 0 && i !== last && (i % 2 !== 0 || i >= last - 1)) return;
    const isFirst = i === 0;
    const isLast = i === last;
    const cx = PAD_L + i * slotW + slotW / 2;
    const x = isFirst ? PAD_L : isLast ? area.right : cx;
    const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
    svg += `<text x="${x.toFixed(1)}" y="${(area.bottom + 18).toFixed(1)}" font-size="11" fill="${muted}" text-anchor="${anchor}" font-family="var(--font-body, sans-serif)">${deps.formatDate(bucket.key)}</text>`;
  });

  return svg + '</svg>';
}

/** Top 5 exercises by volume, as HTML bars. */
export function renderTopExercises(
  top: TopExercise[],
  labels: StatsChartLabels,
  deps: StatsChartDeps
): string {
  if (top.length === 0) {
    return `<p class="stats__empty" role="status">${labels.noData}</p>`;
  }

  const peak = top[0].volume;
  const items = top
    .map((item, idx) => {
      const pct = peak > 0 ? (item.volume / peak) * 100 : 0;
      const rank = idx + 1;
      return `
              <li class="stats__top-row">
                <span class="stats__top-rank">${rank}</span>
                <div class="stats__top-main">
                  <div class="stats__top-head">
                    <span class="stats__top-name">${svgEscape(deps.trExercise(item.name))}</span>
                    <span class="badge--category badge--cat-${muscleHue(item.muscle)} stats__muscle-badge">${svgEscape(deps.trMuscle(item.muscle))}</span>
                    <span class="stats__top-value">${deps.formatNumber(item.volume)} ${labels.kg}</span>
                  </div>
                  <div class="stats__top-bar" role="presentation">
                    <span class="stats__top-fill" style="width: ${pct.toFixed(1)}%"></span>
                  </div>
                </div>
              </li>
            `;
    })
    .join('');

  return `<ol class="stats__top-list">${items}</ol>`;
}

/** Benchmarks table; opt-in is an intention only, no network call. */
export function renderBenchmarksTable(
  rows: BenchmarkRowView[],
  hasCompletedSessions: boolean,
  labels: StatsChartLabels,
  deps: StatsChartDeps
): string {
  if (!hasCompletedSessions) {
    return `<p class="stats__empty" role="status">${svgEscape(labels.benchmarksEmpty)}</p>`;
  }

  const head = `
          <thead>
            <tr>
              <th>${svgEscape(labels.benchmarksColExercise)}</th>
              <th>${svgEscape(labels.benchmarksColYour1RM)}</th>
              <th>${labels.benchmarksPctl50}</th>
              <th>${labels.benchmarksPctl75}</th>
              <th>${labels.benchmarksPctl90}</th>
            </tr>
          </thead>`;

  const body = rows
    .map((row) => {
      const value =
        row.userValue != null
          ? `<span class="stats__bench-num">${deps.formatNumber(row.userValue)} ${labels.kg}</span>`
          : '—';
      const isTop = row.band === 'p75-p90' || row.band === 'p90+';
      return `
              <tr class="stats__bench-row${isTop ? ' stats__bench-row--top' : ''}">
                <th scope="row">${svgEscape(deps.trExercise(row.exercise))}</th>
                <td class="stats__bench-value">${value}${benchmarkBadge(row.band)}</td>
                <td>${deps.formatNumber(row.p50)}</td>
                <td>${deps.formatNumber(row.p75)}</td>
                <td>${deps.formatNumber(row.p90)}</td>
              </tr>`;
    })
    .join('');

  const anyMissing = rows.some((r) => r.userValue == null);
  const legend = anyMissing
    ? `<p class="stats__bench-legend">— : ${svgEscape(labels.benchmarksNoBands)}</p>`
    : '';

  return `
          <div class="stats__bench-scroll" role="region" aria-label="${labels.benchmarksTitle}">
            <table class="stats__bench-table">
              ${head}
              <tbody>${body}</tbody>
            </table>
            ${legend}
          </div>`;
}
