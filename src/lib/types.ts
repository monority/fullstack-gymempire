/**
 * Navigation types shared across AppLayout, AppShell, and Sidebar.
 */
export type NavLeaf = {
  label: string;
  href: string;
  icon?: string;
  active?: boolean;
  isChild?: boolean;
};
export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  children?: NavLeaf[];
  active?: boolean;
  parentActive?: boolean;
};
export type NavGroup = { label: string; items: NavItem[] };
export type NavTree = NavGroup[];

/** Unions métier — source unique (définies dans storage/types, ré-exportées ici). */
export type { SessionStatus, SessionMood, SetType, WeightUnit } from './storage/types';

/** Clés de registre pour les composants data-driven. */
export type ChartKind = 'volume' | 'muscle' | 'frequency' | 'topExercises' | 'benchmarks';
export type SettingSectionKind = 'profile' | 'units' | 'goals' | 'webdav' | 'danger';
