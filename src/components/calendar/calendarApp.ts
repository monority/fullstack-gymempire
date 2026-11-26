/**
 * logique Alpine du calendrier.
 * Aucun `new Date()` direct : le jour courant est injecté (tests deterministes).
 */

import { parseLocalDate } from '../../lib/date';
import type { Dictionary } from '../../i18n/types';
import { getSessions } from '../../lib/storage/sessions';
import type { Session } from '../../lib/storage/types';
import { formatDateLong, formatNumber } from '../../lib/format';
import { statusLabel, type StatusLabels } from '../../lib/session-utils';
import {
  buildMonthDays,
  assignSessions,
  formatISO,
  type CalendarDay,
} from '../../lib/calendar-grid';

export interface CalendarAppDeps {
  labels: Dictionary['calendrier'] & {
    status: StatusLabels;
    seanceSingular: string;
    seancePlural: string;
  };
  today(): Date;
  localizedPath(path: string): string;
}

export interface CalendarApp {
  currentYear: number;
  currentMonth: number;
  selectedDate: string;
  selectedSessions: Session[];
  allSessions: Session[];
  days: CalendarDay[];
  weekdays: string[];
  localizedPath: (path: string) => string;
  init(): void;
  calendarDays: CalendarDay[];
  loadMonth(): void;
  prevMonth(): void;
  nextMonth(): void;
  goToday(): void;
  selectDate(day: CalendarDay): void;
  dayAriaLabel(day: CalendarDay): string;
  monthName(): string;
  monthSessionCount: number;
  monthVolume: number;
  currentStreak: number;
  longestStreak: number;
  statusLabel(status: string): string;
  formatDate(iso: string): string;
  formatNumber(n: number): string;
}

export function createCalendarApp(deps: CalendarAppDeps): CalendarApp {
  const { labels, today, localizedPath } = deps;
  const now = today();

  return {
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth(),
    selectedDate: '',
    selectedSessions: [],
    allSessions: [],
    days: [],
    weekdays: labels.weekdays,
    localizedPath,

    init() {
      this.allSessions = getSessions();
      this.loadMonth();
    },

    get calendarDays() {
      return this.days;
    },

    loadMonth() {
      this.selectedDate = '';
      this.selectedSessions = [];
      const days = buildMonthDays(this.currentYear, this.currentMonth, today());
      this.days = assignSessions(days, this.allSessions);
    },

    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.loadMonth();
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.loadMonth();
    },
    goToday() {
      const current = today();
      this.currentYear = current.getFullYear();
      this.currentMonth = current.getMonth();
      this.loadMonth();
    },
    selectDate(day) {
      if (!day.isCurrentMonth) return;
      this.selectedDate = day.date;
      this.selectedSessions = day.sessions;
    },
    dayAriaLabel(day) {
      const date = this.formatDate(day.date);
      if (day.sessions.length === 0) return date;

      const statusCounts = new Map<string, number>();
      for (const session of day.sessions) {
        statusCounts.set(session.status, (statusCounts.get(session.status) ?? 0) + 1);
      }
      const statusSummary = Array.from(statusCounts.entries())
        .map(([status, count]) => `${count} ${this.statusLabel(status).toLowerCase()}`)
        .join(', ');
      const sessionLabel = day.sessions.length === 1 ? labels.seanceSingular : labels.seancePlural;
      return `${date} - ${day.sessions.length} ${sessionLabel}: ${statusSummary}`;
    },
    monthName() {
      return `${labels.monthNames[this.currentMonth]} ${this.currentYear}`;
    },

    get monthSessionCount() {
      return this.allSessions.filter((s) => {
        const d = parseLocalDate(s.date);
        return d.getFullYear() === this.currentYear && d.getMonth() === this.currentMonth;
      }).length;
    },
    get monthVolume() {
      let total = 0;
      for (const s of this.allSessions) {
        const d = parseLocalDate(s.date);
        if (d.getFullYear() !== this.currentYear || d.getMonth() !== this.currentMonth) {
          continue;
        }
        for (const ex of s.exercises) {
          for (const set of ex.sets) {
            if (set.completed) total += set.weight * set.reps;
          }
        }
      }
      return total;
    },
    get currentStreak() {
      if (this.allSessions.length === 0) return 0;
      const sessionDates = new Set(
        this.allSessions.filter((s) => s.status === 'completed').map((s) => s.date.substring(0, 10))
      );
      let streak = 0;
      const cursor = today();
      if (!sessionDates.has(formatISO(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
      }
      while (sessionDates.has(formatISO(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      return streak;
    },
    get longestStreak() {
      if (this.allSessions.length === 0) return 0;
      const dates = Array.from(
        new Set(this.allSessions.map((s) => s.date.substring(0, 10)))
      ).sort();
      let longest = 0;
      let run = 0;
      let prev: Date | null = null;
      for (const dStr of dates) {
        const d = new Date(dStr);
        if (prev) {
          const diff = Math.round((d.getTime() - prev.getTime()) / 86400000);
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        if (run > longest) longest = run;
        prev = d;
      }
      return longest;
    },

    statusLabel(status) {
      return statusLabel(status as 'completed' | 'in-progress' | 'planned', labels.status);
    },
    formatDate(iso) {
      return formatDateLong(iso);
    },
    formatNumber(n) {
      return formatNumber(n);
    },
  };
}
