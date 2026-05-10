# peek — intro video

A 40-second 1080p Remotion video introducing `peek` (Cmd-K for tmux scrollback).

## Requirements

- Node 18+
- npm

## Install

```bash
npm install
```

## Live preview (Remotion Studio)

```bash
npm run start
```

Open http://localhost:3000 and pick the `Video` composition.

## Render to MP4

```bash
npm run render
```

Output: `out/peek-intro.mp4` (1920x1080, 30fps, ~40s, h264).

## Composition

- `Video` — id used by render. 1200 frames @ 30fps = 40s.

## Structure

```
src/
  index.ts           registerRoot
  Root.tsx           Composition declaration
  Video.tsx          Sequence orchestration
  styles.ts          color + font tokens (single source of truth)
  components/
    Terminal.tsx     reusable terminal chrome
    Key.tsx          keycap with press animation
    Typewriter.tsx   frame-based char-by-char type-on
  scenes/
    TitleCard.tsx    0  – 4s
    Problem.tsx      4  – 11s
    Hotkey.tsx       11 – 14s
    Demo.tsx         14 – 26s
    Pillars.tsx      26 – 32s
    Outro.tsx        32 – 40s
```

## Notes

- All animation is frame-based via `useCurrentFrame()` + `spring()` / `interpolate()`.
- No `setTimeout`, no `requestAnimationFrame`.
- Single accent color `#a78bfa`. Mono = JetBrains Mono w/ system fallback.
