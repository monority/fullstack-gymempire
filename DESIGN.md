---
name: Gym Empire
description: A quiet, graphite training log for people who train in real gyms.
colors:
  graphite-ground: '#080b0f'
  graphite-surface: '#0d1218'
  graphite-raised: '#131a22'
  graphite-deep: '#1a232d'
  paper-ground: '#f5f7f5'
  paper-surface: '#ffffff'
  ink: '#f2f5f4'
  ink-muted: '#8c9898'
  amber-accent: 'hsl(30, 100%, 66%)'
  amber-accent-hover: 'hsl(30 92% 50%)'
  accent-foreground: '#1b1005'
  hairline-dark: 'hsl(0 0% 100% / 0.08)'
  hairline-strong-dark: 'hsl(0 0% 100% / 0.16)'
  hairline-light: '#cbd5cc'
  ink-on-paper: '#172018'
  success: '#22c55e'
  destructive: '#ef4444'
typography:
  display:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '4rem'
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: '-0.03em'
  metric:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '3.6rem'
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: '-0.03em'
  h1:
    fontFamily: 'Archivo, system-ui, sans-serif'
    fontSize: '2.8rem'
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: '-0.02em'
  h2:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '2.2rem'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.02em'
  h3:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '1.8rem'
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: '-0.01em'
  body-lg:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '1.6rem'
    fontWeight: 400
    lineHeight: 1.5
  small:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '1.2rem'
    fontWeight: 400
    lineHeight: 1.4
  body:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '1.4rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'Inter, system-ui, sans-serif'
    fontSize: '1.1rem'
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: '0.08em'
rounded:
  sm: '4px'
  md: '6px'
  lg: '10px'
  xl: '16px'
  pill: '999px'
spacing:
  s1: '4px'
  s2: '8px'
  s3: '12px'
  s4: '16px'
  s5: '20px'
  s6: '24px'
  s7: '28px'
  s8: '32px'
components:
  button-primary:
    backgroundColor: '{colors.amber-accent}'
    textColor: '{colors.accent-foreground}'
    rounded: '{rounded.sm}'
    padding: '0 16px'
    height: '44px'
  button-secondary:
    backgroundColor: 'transparent'
    textColor: '{colors.ink-muted}'
    rounded: '{rounded.sm}'
    padding: '0 12px'
    height: '44px'
  input:
    backgroundColor: '{colors.graphite-surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.sm}'
    padding: '8px 12px'
  card:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.xl}'
    padding: '24px'
  metric-bar:
    backgroundColor: '{colors.hairline-strong-dark}'
    rounded: '{rounded.sm}'
    height: '50px'
---

# Design System: Gym Empire

## Overview

**Creative North Star: "The Quiet Training Log"**

Gym Empire is a local-first training log for someone standing in a gym, sometimes distracted, often in a hurry. The interface behaves like an open notebook: one dominant object on the first screen — the session in front of you — and everything else arranged as quiet context around it. It does not perform. It does not celebrate itself. It tells you what to do, where you stand, and what you did last.

The world is graphite and hairlines. Surfaces are flat at rest; depth comes from scale, weight, spacing, and the occasional one-pixel seam. Colour is rationed to a single amber accent used for action and state, so that amber always means "this is the thing" or "this changed". The display face (Archivo) carries the few large moments — greeting, hero title, metric values — while Inter carries every label, control, and table. That contrast is the whole typographic system.

This is an Operate surface: familiarity is a feature. Standard navigation, standard controls, consistent affordances, and dense-but-legible data beat surprise. Delight is reserved for state changes, never page loads.

**Key Characteristics:**

- One dominant object per viewport; the next session leads the dashboard.
- Graphite ground, hairline seams, no decorative background, no shadows at rest.
- One amber accent, reserved for action, selection, and state.
- Two type voices with strict roles; no display face in labels or controls.
- Week-bar metrics instead of equal KPI tiles.

## Colors

The palette is restraint with a single signal: neutral graphite (or paper in light mode) plus one amber accent. Semantic colours exist but only describe state.

### Primary

- **Amber Accent** (`hsl(30, 100%, 66%)`): the only attention colour. Primary action, current selection, the hero's one-pixel filet, the current-day bar, and the goal ring. Its scarcity is what makes it legible.

### Neutral

- **Graphite Ground** (`#080b0f`): the page field in dark mode; the default because the use scene is a dim gym.
- **Graphite Surface / Raised** (`#0d1218` / `#131a22`): one step above the ground for panels and inputs.
- **Ink / Muted Ink** (`#f2f5f4` / `#8c9898`): primary and secondary text; both pass AA on graphite.
- **Paper Ground / Ink on Paper** (`#f5f7f5` / `#172018`): the light theme, with the same structure and only the values changed.
- **Hairline** (`hsl(0 0% 100% / 0.08)` dark, `#cbd5cc` light): the separator that replaces decoration.

### Named Rules

**The One Accent Rule.** Amber occupies a small fraction of any screen. It marks action, selection, or change — never atmosphere, never a whole panel. If two amber elements compete, one is wrong.

**The State-Colour Rule.** Success green, destructive red, warning amber-gold, and info blue appear only on status badges and state indicators. They are not available as decorative hues for data categories on the main canvas.

## Typography

**Display Font:** Archivo (with system sans fallback)
**Body Font:** Inter (with system sans fallback)

**Character:** Archivo is a sturdy, slightly condensed grotesk with enough character to carry a page on its own; Inter is the neutral workhorse that disappears into the task. Their widths and weight make the distinction visible without a second "decorative" face. Both are variable woff2 files served locally from `/fonts/` and precached by the service worker: the typography survives offline and makes no external request.

### Hierarchy

- **Display** (700, 4rem / 1.05 / −0.03em): the page greeting and the hero session title only. Never a kicker, never a label.
- **Metric** (700, 3.6rem / 1.05 / −0.03em, tabular numerals): metric values and the goal count. Data, set in the display voice.
- **Headline** (700, 2.8rem / 1.15 / −0.02em): section and empty-state titles on small screens.
- **Body** (400, 1.4rem / 1.5): descriptions, hints, table content. Keep prose near 65–75ch.
- **Label** (700, 1.1rem / 1.3 / +0.08em, uppercase): caption-like labels for metrics and metadata. Short only.

### Named Rules

**The No-Kicker Rule.** A heading carries its own weight. No small uppercase label is placed above it to make it feel important. Dates and context live in the top bar or beside the title, never as an eyebrow.

**The Display-Only Rule.** Archivo appears only at Display and Metric sizes. It is never used for buttons, inputs, table cells, or labels.

## Layout

A 12-column content area with a maximum width of 96rem sits beside a 22rem fixed sidebar; a 6.4rem top bar spans the remaining width. Page padding is 5.6rem on desktop, 3.2rem on tablet, and 1.6rem on mobile. The first viewport is composed as a 7/5 split: the next-session hero on the left, the weekly goal on the right; below it a three-column band of week-bar metrics; below that a 2/1 split of volume trend and recent sessions.

Responsive behaviour is structural, not fluid type: at 760px the hero and metric band collapse to one column, at 640px the top bar compacts and the hero stacks its action beneath the copy; titles step from 4rem to 2.8rem. Nothing important moves below the fold on mobile; the page simply stacks.

The spacing rhythm uses a 4px base (4, 8, 12, 16, 20, 24, 28, 32). Dense groups use 8–12px; major sections are divided by 24–40px of space or a single hairline. More space sits above a heading than below it.

## Elevation & Depth

Flat by default. Panels do not carry backgrounds, shadows, or decorative radii; they are separated by one-pixel hairlines or by space. A single overlay shadow exists for dialogs and the command palette, where a real layer change occurs. Focus is shown with a soft amber ring, not a colour change alone.

### Shadow Vocabulary

- **Overlay** (`0 24px 48px hsl(220 30% 2% / 0.45)` dark / `0 24px 48px hsl(0 0% 0% / 0.18)` light): dialogs and popovers only.

### Named Rules

**The Hairline Rule.** One pixel of border is enough. Anything thicker reads as a side-tab and is removed. If an element needs more presence, give it scale or weight, not a heavier edge.

## Shapes

Corners are quiet: 4px on small controls and badge-like chips, 6–10px on inputs and buttons, 16px on panels that genuinely need a container, and pills for small toggles and switches. The hero carries a single vertical amber filet exactly 1px wide; no other card uses an accent edge. Progress is drawn as a circular arc or a row of bars, never as a glassy ring with a glow.

## Components

### Buttons

- **Shape:** 4px radius, 44px minimum height.
- **Primary:** amber background, dark accent-foreground text, 16px horizontal padding. Hover deepens the amber; active drops 1px.
- **Secondary / Ghost:** transparent with a hairline border or no border, muted text, same height. Hover uses a subtle neutral wash.
- **Focus:** `var(--focus-ring)`; no outline removal without a replacement ring.

### Cards / Containers

- **Corner Style:** 16px when a panel needs a boundary; most dashboard sections are borderless.
- **Background:** transparent at rest; neutral wash only on hover of an interactive row.
- **Border:** one-pixel hairline. Shadow only for true overlays.

### Inputs / Fields

- **Style:** raised surface, 1px hairline border, 6px radius, 44px minimum height, visible label and hint.
- **Focus:** border shifts to amber and the focus ring appears.
- **Error / Disabled:** destructive border with `aria-invalid`; disabled reduces opacity and blocks pointer events.

### Week-Bar Metrics

- **Structure:** caption label, Archivo metric value with unit, seven day columns. The current day is amber; other days use a strong hairline tone.
- **Behaviour:** bar height is real weekly data; empty days keep a 6% floor so the week remains readable. Values use singular/plural units.

### Navigation

- **Style:** fixed sidebar with one-pixel separators; active item uses a subtle accent wash and a 1px amber filet.
- **Top bar:** 6.4rem, hairline bottom edge, compact on small screens; search, theme, and locale controls stay reachable.

### Weekly Goal

- **Style:** a 9rem SVG arc with a tabular percentage inside, plus a single short hint line. No duplicate progress bar.
- **State:** the arc fills with `--ease-out`; it turns success green only when the goal is reached.

## Do's and Don'ts

### Do:

- **Do** lead every screen with one dominant object and one primary action.
- **Do** use Archivo only for display and metric sizes; Inter for everything else.
- **Do** separate with hairlines and space, and keep surfaces flat.
- **Do** keep amber rare and meaningful; verify both themes with `pnpm check:contrast`.
- **Do** design the empty, loading, error, and singular/plural states before calling a screen finished.

### Don't:

- **Don't** place a kicker or eyebrow above a heading.
- **Don't** ship a row of equal icon-and-number KPI tiles on the dashboard; use week-bar metrics.
- **Don't** add gradients, glow, glass, decorative backgrounds, or shadows at rest.
- **Don't** use coloured icons as the default treatment for data; reserve colour for state.
- **Don't** animate a page load. Motion reports state changes only, with `--ease-out`.
- **Don't** invent claims, credentials, or data; label estimates honestly (for example `≈ 21 min`).
