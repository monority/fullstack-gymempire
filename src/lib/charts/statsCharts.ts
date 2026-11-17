/**
 * D3 (plan-execution.md) — pure SVG/HTML renderers for the stats page.
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
  const PAD_L = 50;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 48;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

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
  const baselineY = PAD_T + plotH;
  const points = weeks.map((bucket, i) => ({
    bucket,
    x: weeks.length === 1 ? PAD_L + plotW / 2 : PAD_L + i * slotW,
    y: baselineY - (bucket.volume / peak) * plotH,
  }));

  const labelIdxs: number[] = [];
  weeks.forEach((_, i) => {
    if (i === 0 || i === weeks.length - 1 || i % 2 === 0) {
      labelIdxs.push(i);
    }
  });

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="stats__chart" role="img" aria-label="${labels.volumeChart}">`;

  for (const t of tickPositions) {
    svg += `<line x1="${PAD_L}" y1="${t.y.toFixed(1)}" x2="${W - PAD_R}" y2="${t.y.toFixed(1)}" stroke="${grid}" stroke-width="1"/>`;
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

  svg += `<line x1="${PAD_L}" y1="${(PAD_T + plotH).toFixed(1)}" x2="${W - PAD_R}" y2="${(PAD_T + plotH).toFixed(1)}" stroke="${grid}" stroke-width="1"/>`;

  for (const i of labelIdxs) {
    const b = weeks[i];
    const cx = points[i].x;
    svg += `<text x="${cx.toFixed(1)}" y="${(PAD_T + plotH + 24).toFixed(1)}" font-size="12" fill="${muted}" text-anchor="middle" font-family="var(--font-body, sans-serif)">${deps.formatDate(b.key)}</text>`;
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
  <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="stats__donut-svg" role="img" aria-label="${labels.volumeByMuscle}">
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

/** 8-week training frequency bar chart. */
export function renderFrequencyChart(
  weeks: WeekBucket[],
  labels: StatsChartLabels,
  deps: StatsChartDeps
): string {
  const W = 480;
  const H = 280;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 48;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const accent = deps.cssVar('--color-accent');
  const muted = deps.cssVar('--color-muted');
  const grid = deps.cssVar('--color-border');

  if (weeks.length === 0) {
    return `<p class="stats__empty" role="status">${labels.noData}</p>`;
  }

  const maxCount = weeks.reduce((m, b) => (b.sessionCount > m ? b.sessionCount : m), 0);
  const peak = Math.max(1, maxCount);

  const ticks = Math.min(4, peak);
  const tickPositions: { y: number; value: number }[] = [];
  for (let i = 0; i <= ticks; i++) {
    tickPositions.push({
      value: (peak * i) / ticks,
      y: PAD_T + (1 - i / ticks) * plotH,
    });
  }

  const slotW = plotW / weeks.length;
  const barW = Math.max(10, slotW * 0.55);
  const barGap = (slotW - barW) / 2;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" class="stats__chart" role="img" aria-label="${labels.freqChart}">`;

  for (const t of tickPositions) {
    svg += `<line x1="${PAD_L}" y1="${t.y.toFixed(1)}" x2="${W - PAD_R}" y2="${t.y.toFixed(1)}" stroke="${grid}" stroke-width="1"/>`;
    svg += `<text x="${PAD_L - 8}" y="${(t.y + 4).toFixed(1)}" font-size="12" fill="${muted}" text-anchor="end" font-family="var(--font-body, sans-serif)">${Math.round(t.value)}</text>`;
  }

  const accentSoft = deps.cssVarAlpha('--color-accent', 0.55);
  weeks.forEach((b, i) => {
    const x = PAD_L + i * slotW + barGap;
    const h = peak > 0 ? (b.sessionCount / peak) * plotH : 0;
    const y = PAD_T + plotH - h;
    const fill = i === weeks.length - 1 ? accent : accentSoft;
    svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="2" fill="${fill}"><title>${deps.formatDate(b.key)} · ${b.sessionCount} ${labels.sessionSingular}${b.sessionCount > 1 ? 's' : ''}</title></rect>`;
  });

  svg += `<line x1="${PAD_L}" y1="${(PAD_T + plotH).toFixed(1)}" x2="${W - PAD_R}" y2="${(PAD_T + plotH).toFixed(1)}" stroke="${grid}" stroke-width="1"/>`;

  weeks.forEach((b, i) => {
    const cx = PAD_L + i * slotW + slotW / 2;
    svg += `<text x="${cx.toFixed(1)}" y="${(PAD_T + plotH + 24).toFixed(1)}" font-size="11" fill="${muted}" text-anchor="middle" font-family="var(--font-body, sans-serif)">${deps.formatDate(b.key)}</text>`;
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
