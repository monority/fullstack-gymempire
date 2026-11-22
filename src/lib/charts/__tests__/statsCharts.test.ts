import { describe, expect, it } from 'vitest';
import type { WeekBucket } from '../../week-aggregation';
import type { MuscleVolumeSlice } from '../../volume-stats';
import {
  benchmarkBadge,
  renderBenchmarksTable,
  renderFrequencyChart,
  renderMuscleChart,
  renderTopExercises,
  renderVolumeChart,
  type StatsChartDeps,
  type StatsChartLabels,
} from '../statsCharts';

const labels: StatsChartLabels = {
  kg: 'kg',
  noData: 'Aucune donnee',
  volumeChart: 'Volume hebdomadaire',
  freqChart: 'Frequence des seances',
  volumeByMuscle: 'Rpartition du volume',
  total: 'Total',
  sessionSingular: 'seance',
  volumeEmpty: 'Aucune seance sur la periode',
  benchmarksEmpty: 'Terminez des seances',
  benchmarksColExercise: 'Exercice',
  benchmarksColYour1RM: 'Ton 1RM',
  benchmarksPctl50: '50e',
  benchmarksPctl75: '75e',
  benchmarksPctl90: '90e',
  benchmarksTitle: 'Benchmarks',
  benchmarksNoBands: 'Aucun repere',
};

// Deterministic deps : no DOM, no locale, no Date.now().
const deps: StatsChartDeps = {
  cssVar: (name) => `var(${name})`,
  cssVarAlpha: (name, alpha) => `var(${name})/${alpha}`,
  formatNumber: (n) => String(Math.round(n)),
  formatDate: (iso) => iso,
  trExercise: (name) => name,
  trMuscle: (name) => name,
};

function week(key: string, volume: number, sessionCount = 1): WeekBucket {
  return {
    start: new Date(`${key}T00:00:00`),
    key,
    volume,
    sessionCount,
    durationSum: 0,
    durationCount: 0,
  };
}

function slice(muscle: string, volume: number): MuscleVolumeSlice {
  return { id: muscle, muscle, volume, pct: 0 };
}

function expectCleanSvg(svg: string) {
  expect(svg).not.toMatch(/NaN|undefined|Infinity/);
}

describe('benchmarkBadge', () => {
  it('returns nothing below p50', () => {
    expect(benchmarkBadge(null)).toBe('');
    expect(benchmarkBadge('below-p25')).toBe('');
    expect(benchmarkBadge('p25-p50')).toBe('');
  });

  it('renders the percentile badge for p50 and above', () => {
    expect(benchmarkBadge('p50-p75')).toContain('50');
    expect(benchmarkBadge('p75-p90')).toContain('75');
    expect(benchmarkBadge('p90+')).toContain('90');
  });
});

describe('renderVolumeChart', () => {
  it('renders the localized empty state', () => {
    const html = renderVolumeChart([], labels, deps);
    expect(html).toContain(labels.noData);
    expect(html).not.toContain('<svg');
  });

  it('handles one zero-volume week without NaN', () => {
    const svg = renderVolumeChart([week('2026-11-15', 0, 0)], labels, deps);
    expectCleanSvg(svg);
    expect((svg.match(/<circle/g) ?? []).length).toBe(1);
    expect(svg).toContain('viewBox="0 0 1000 280"');
  });

  it('renders one point per week over 12 weeks', () => {
    const weeks = Array.from({ length: 12 }, (_, i) =>
      week(`2026-${String(i + 1).padStart(2, '0')}-01`, (i + 1) * 500)
    );
    const svg = renderVolumeChart(weeks, labels, deps);
    expectCleanSvg(svg);
    expect((svg.match(/<circle/g) ?? []).length).toBe(12);
    expect(svg).toContain(labels.volumeChart);
  });

  it('garde les libellés de dates dans le viewBox sans chevauchement', () => {
    const weeks = Array.from({ length: 12 }, (_, i) =>
      week(`2026-${String(i + 1).padStart(2, '0')}-01`, (i + 1) * 500)
    );
    const svg = renderVolumeChart(weeks, labels, deps);
    const labelsSvg = svg.match(/<text[^>]*text-anchor="[^"]+"[^>]*>2026-/g) ?? [];
    expect(labelsSvg).toHaveLength(6);
    expect(labelsSvg[0]).toContain('text-anchor="start"');
    expect(labelsSvg[labelsSvg.length - 1]).toContain('text-anchor="end"');
    expect(labelsSvg.filter((l) => l.includes('text-anchor="middle"'))).toHaveLength(4);
  });
});

describe('renderMuscleChart', () => {
  it('renders the localized empty state', () => {
    const html = renderMuscleChart([], labels, deps);
    expect(html).toContain(labels.volumeEmpty);
    expect(html).not.toContain('<svg');
  });

  it('clamps the gap to zero for a single family', () => {
    const html = renderMuscleChart([slice('Pectoraux', 1000)], labels, deps);
    expectCleanSvg(html);
    expect((html.match(/<circle/g) ?? []).length).toBe(1);
    expect(html).toContain('stroke-dasharray="628.32 0.00"');
    expect((html.match(/stats__legend-row/g) ?? []).length).toBe(1);
  });

  it('draws one arc and one legend row per family', () => {
    const html = renderMuscleChart(
      [slice('Pectoraux', 500), slice('Dos', 300), slice('Cuisses', 200)],
      labels,
      deps
    );
    expectCleanSvg(html);
    expect((html.match(/<circle/g) ?? []).length).toBe(3);
    expect((html.match(/stats__legend-row/g) ?? []).length).toBe(3);
  });

  it('escapes untrusted muscle names', () => {
    const html = renderMuscleChart([slice('<script>', 100)], labels, deps);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('renderFrequencyChart', () => {
  it('renders the localized empty state', () => {
    const html = renderFrequencyChart([], labels, deps);
    expect(html).toContain(labels.noData);
    expect(html).not.toContain('<svg');
  });

  it('handles all-zero weeks without NaN', () => {
    const weeks = Array.from({ length: 8 }, (_, i) => week(`2026-11-${i + 1}`, 0, 0));
    const svg = renderFrequencyChart(weeks, labels, deps);
    expectCleanSvg(svg);
    expect((svg.match(/<rect/g) ?? []).length).toBe(8);
    expect(svg).toContain('height="0.0"');
  });

  it('renders one bar per week with a current-week accent', () => {
    const weeks = Array.from({ length: 8 }, (_, i) => week(`2026-11-${i + 1}`, 0, i));
    const svg = renderFrequencyChart(weeks, labels, deps);
    expectCleanSvg(svg);
    expect((svg.match(/<rect/g) ?? []).length).toBe(8);
    expect(svg).toContain(labels.freqChart);
  });
});

describe('renderTopExercises', () => {
  it('renders the localized empty state', () => {
    expect(renderTopExercises([], labels, deps)).toContain(labels.noData);
  });

  it('scales bars against the first row', () => {
    const html = renderTopExercises(
      [
        { exerciseId: '1', name: 'Squat', muscle: 'Cuisses', volume: 1000 },
        { exerciseId: '2', name: 'Bench', muscle: 'Pectoraux', volume: 500 },
      ],
      labels,
      deps
    );
    expect(html).toContain('width: 100.0%');
    expect(html).toContain('width: 50.0%');
    expect((html.match(/stats__top-row/g) ?? []).length).toBe(2);
  });
});

describe('renderBenchmarksTable', () => {
  it('asks for completed sessions first', () => {
    const html = renderBenchmarksTable([], false, labels, deps);
    expect(html).toContain(labels.benchmarksEmpty);
    expect(html).not.toContain('<table');
  });

  it('renders bands, badges and the missing-values legend', () => {
    const html = renderBenchmarksTable(
      [
        {
          exercise: 'Squat',
          userValue: 120,
          band: 'p90+',
          p50: 80,
          p75: 100,
          p90: 110,
        },
        {
          exercise: 'Bench',
          userValue: null,
          band: null,
          p50: 60,
          p75: 80,
          p90: 90,
        },
      ],
      true,
      labels,
      deps
    );
    expect(html).toContain(labels.benchmarksNoBands);
    expect(html).toContain('stats__bench-row--top');
    expect(html).toContain('stats__bench-badge');
    expect(html).toContain('—');
    expectCleanSvg(html);
  });
});
