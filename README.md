# Anatomy Motion Explorer

A mobile-first, installable **Progressive Web App** for exploring human anatomy
and how muscles create movement. Built for hobby massage practitioners,
anatomy enthusiasts and beginners learning how muscles produce motion.

This repository currently contains the **elbow prototype** — the smallest
slice that proves selection, information display, animation and mobile
performance work before more anatomy is added. It covers the biceps brachii,
triceps brachii, humerus, radius and ulna, plus elbow flexion and extension.

> This application provides general educational information about human anatomy.
> It is not medical advice, a diagnostic tool, or a replacement for guidance
> from a qualified healthcare professional.

## Quick start

Requirements: Node.js 18+ and npm.

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build (http://localhost:4173)
```

Quality gates:

```bash
npm run typecheck  # TypeScript, no emit
npm run lint       # ESLint
npm run test       # Vitest unit + component tests
npm run test:e2e   # Playwright end-to-end (needs a build first)
```

> Note: `npm run test:e2e` downloads Playwright browsers on first run
> (`npx playwright install`). The unit/component suite (`npm run test`) needs
> no browser download.

## Architecture

The app is a static single-page PWA. There is **no backend** — all content
ships as typed data files and everything runs in the browser.

```
index.html
src/
  main.tsx              app entry
  App.tsx               layout + WebGL fallback + dev-only /admin route
  index.css            mobile-first styles (desktop 3-column at >=900px)
  types/anatomy.ts      AnatomicalStructure + AnimationClip content model
  data/structures.ts    MVP content (elbow) with per-entry sources
  store/useStore.ts      Zustand app state (selection, layers, language, anim)
  lib/
    search.ts            EN/Latin/alias search (accent- & case-insensitive)
    webgl.ts             WebGL capability check
  hooks/useReducedMotion.ts   syncs prefers-reduced-motion into state
  components/
    Viewer.tsx           React Three Fiber <Canvas>, camera rig, reset
    ArmModel.tsx         placeholder primitive arm + flexion/extension anim
    SelectablePart.tsx   selection, hover, highlight (glow + scale)
    SearchBar.tsx  InfoPanel.tsx  AnimationControls.tsx
    LayerControls.tsx  LanguageToggle.tsx  Disclaimer.tsx  WebGLFallback.tsx
  admin/ContentEditor.tsx   DEV-ONLY content editor (JSON export)
e2e/smoke.spec.ts        Playwright smoke tests
```

**Separation of content and rendering.** Anatomical facts live only in
`src/data` and `src/types`. Rendering code references structures by stable
`id`, never by display name, so English/Latin labels can change without
touching logic. Each 3D part carries `modelNodeNames`, so today's primitive
meshes can later be swapped for named nodes in a GLB file without changing the
UI, selection or data model.

**State.** A single Zustand store holds selection, layer visibility, skin
opacity, language, and the elbow animation angle. The 3D scene reads the angle
each frame; UI controls write it. This keeps the renderer stateless and makes
behaviour unit-testable without a canvas.

**Placeholder geometry.** The arm is built from cylinders and capsules. This
avoids any licensing risk and keeps the download tiny while the interface,
selection system and animation controls are proven. See the asset rules below.

### Dev-only content editor

Run `npm run dev` and open `/admin`. The editor lets the project owner edit
names, descriptions, functions and sources, mark content reviewed, and export
the dataset as `structures.json` to commit back into the repo. It is code-split
and gated behind `import.meta.env.DEV`, so it is **never included in a
production build**. There is no public write API and no authentication — add
authentication before ever exposing editing publicly.

## Accessibility

Large (44px+) touch targets; keyboard-focusable non-3D controls with visible
focus rings; selection indicated by **both** a colour glow **and** a scale bump
(colour is never the only cue); a movement text alternative for every
animation; `prefers-reduced-motion` support (movements jump to their end pose
instead of tweening); a reset-view button; a loading state; and a WebGL-
unavailable fallback screen.

## Asset licensing

No proprietary assets and no copied UI, text or 3D models from ZygoteBody,
Complete Anatomy or any other commercial product are included. The 3D model is
100% original placeholder geometry generated at runtime. See
[`ASSET_REGISTER.md`](./ASSET_REGISTER.md).

## Content sources

Anatomical descriptions are original prose summarising established,
non-copyrightable anatomical facts. Each structure records its reference
sources in `src/data/structures.ts` (and is shown in the info panel). Content
is marked `reviewed: false` until checked by the project owner; review status
is tracked in the data files through Git.

## Roadmap / what remains

This is a prototype. Not yet implemented: the remaining MVP muscles
(deltoid, pectoralis major, trapezius, lats, abs, glutes, quads, hamstrings,
gastrocnemius, soleus), nerves and fascia layers, a full-body GLB model with
Draco/Meshopt compression and level-of-detail, lazy-loading of layers, and a
measured mobile-performance pass (target ~30 FPS, initial download < ~15 MB).
The loading architecture (`Suspense`, named nodes, category layers) is already
in place for GLB replacement.
