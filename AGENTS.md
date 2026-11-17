# Project Conventions

## Alpine Componentization Rule

When a component is rendered dynamically by Alpine x-for/x-if/runtime state,
do not attempt to extract its markup into an Astro component.

Keep the runtime template in the Alpine-controlled .astro template.

Extract all reusable logic into TypeScript modules.

Use Astro components only for:

- static/build-time composition
- server-rendered UI
- reusable markup that does not depend on Alpine runtime iteration

Use Alpine components for:

- runtime repeated UI
- x-for generated elements
- local state
- interactions
- runtime DOM behavior

Use TypeScript modules for:

- business logic
- transformations
- validation
- formatting
- reusable functions
- constants
- types

### Pattern

```
src/components/builder/
  exerciseCard.ts    — Alpine component logic (state + methods)
  setTable.ts        — Alpine component logic
  exercisePicker.ts  — Alpine component logic
```

Template: inline in parent `.astro` with `x-data="componentName(args)"`.
Events: `$dispatch("builder:event-name", detail)` for parent communication.
Labels: via `window.__builderLabels` set during parent init.

## Quality Gates

- `pnpm check:strict` — astro check, fails on any hint (used in CI). Keep it at 0/0/0.
- `pnpm lint` — oxlint, 0 error required (`no-explicit-any` stays warn).
- `pnpm format` / `pnpm format:check` — Prettier, applied to files changed in the diff only (no global reformat).
- `pnpm check:colors` — no raw hex/rgb outside tokens and documented exceptions (print sheet, debug, UI specimens, `theme-color` meta).
- `pnpm check:contrast` — WCAG AA (≥ 4.5:1) on text/background token pairs in both themes.
- Before finishing a task, run: `pnpm test`, `pnpm check:strict`, `pnpm lint`, `pnpm check:colors`, `pnpm check:contrast`, `pnpm build`, `pnpm test:smoke`.

The refactor roadmap and task IDs live in [plan-execution.md](./plan-execution.md); reference the task ID (A1, C1, D3…) in commits and PRs.
