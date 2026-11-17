/**
 * Barrel re-export for the storage layer.
 * Legacy imports `from '.../lib/storage'` resolve to this index.
 * C3 will progressively migrate callers to the precise module.
 */

export * from './types';
export * from './defaults';
export * from './store';
export * from './guards';
export * from './exercises';
export * from './sessions';
export * from './settings';
export * from './body';
export * from './backup';
export * from './csv';
