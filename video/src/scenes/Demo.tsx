import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, radii } from "../styles";
import { Terminal } from "../components/Terminal";
import { Typewriter } from "../components/Typewriter";

type Props = { durationInFrames: number };

// Background tmux content (static-ish; we'll scroll into a matched line at the end).
const BG_LINES: string[] = [
  "$ pnpm dev",
  "[api]  ready on http://localhost:8080",
  "[web]  vite v5.4.1  ready in 312 ms",
  "[web]  ➜  Local:   http://localhost:5173/",
  "[api]  GET  /v2/sessions  200  18ms",
  "[api]  POST /v2/auth/login 401  4ms",
  "[api]  POST /v2/auth/login 500  9ms",
  "[api]  [error] uncaughtException: Error: secretOrPrivateKey must have a value",
  "[api]      at Object.module.exports [as sign] (jsonwebtoken/sign.js:107:20)",
  "[api]      at signToken (src/auth/jwt.ts:42:24)",
  "[api]      at processLogin (src/routes/auth.ts:88:18)",
  "[api]  [info]  restarting worker (pid 4128) ...",
  "[api]  [info]  worker up (pid 4131)",
  "[api]  GET  /healthz  200  1ms",
  "[api]  GET  /v2/sessions  200  12ms",
  "[web]  hmr update /src/pages/Login.tsx",
  "[api]  POST /v2/auth/login 200  22ms",
  "[api]  GET  /v2/me  200  3ms",
  "[api]  GET  /v2/orders?limit=50  200  41ms",
  "[api]  GET  /v2/orders/9af23  200  6ms",
  "[api]  PATCH /v2/orders/9af23 204  18ms",
  "[api]  GET  /v2/me  200  3ms",
  "[web]  hmr update /src/components/OrderRow.tsx",
];

const BG_LINE_H = 26;

type Result = {
  ts: string;
  pane: string;
  snippet: React.ReactNode;
  score: string;
};

const RESULTS: Result[] = [
  {
    ts: "yesterday 14:22",
    pane: "dev:api",
    snippet: (
      <>
        <span style={{ color: "#ff8a80" }}>[error]</span> fatal: jwt signing
        key missing — secretOrPrivateKey must have a value
      </>
    ),
    score: "0.91",
  },
  {
    ts: "yesterday 14:21",
    pane: "dev:api",
    snippet: (
      <>
        <span style={{ color: "#ffd180" }}>[warn]</span> JWT_SECRET not set,
        falling back to dev key (UNSAFE)
      </>
    ),
    score: "0.84",
  },
  {
    ts: "yesterday 11:08",
    pane: "tests:auth",
    snippet: (
      <>
        FAIL src/auth/jwt.spec.ts — expected 'secretOrPrivateKey must have a
        value'
      </>
    ),
    score: "0.79",
  },
  {
    ts: "2 days ago 09:51",
    pane: "prod:logs",
    snippet: (
      <>
        ERROR fatal: jwt signing key missing — see runbooks/auth.md
      </>
    ),
    score: "0.72",
  },
  {
    ts: "3 days ago 17:33",
    pane: "dev:api",
    snippet: (
      <>
        refactor(jwt): extract signing into module — read secret from env
      </>
    ),
    score: "0.61",
  },
];

export const Demo: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase markers (relative to this Sequence start; total = 360 frames = 12s)
  //   0   – 18    overlay slides up
  //   18  – 120   typewriter query
  //   90  – 240   results stagger in
  //   250 – 270   row 1 highlights
  //   275 – 290   "Enter" hint flashes
  //   290 – 320   overlay slides down + bg scrolls to matched line w/ accent flash
  //   320 – 360   hold matched-line highlight, then fade out

  const fadeIn = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Overlay slide
  const overlayIn = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 90, mass: 1.0 },
  });
  const overlayOut = spring({
    frame: frame - 290,
    fps,
    config: { damping: 22, stiffness: 110, mass: 0.9 },
  });
  const overlayProgress =
    frame < 290
      ? interpolate(overlayIn, [0, 1], [0, 1])
      : interpolate(overlayOut, [0, 1], [1, 0]);

  // Background scroll: small ambient drift early; then jump-scroll to matched line.
  const ambient = interpolate(frame, [0, 90], [0, 18], {
    easing: Easing.linear,
    extrapolateRight: "clamp",
  });
  // Matched line is BG_LINES index 7 ("[error] uncaughtException ...").
  // We want it centered around y ~ 380 inside the body; start with topY = 24.
  const matchedIdx = 7;
  const bgBodyHeight = 720; // approximate visible body height
  const targetTop = bgBodyHeight / 2 - BG_LINE_H * matchedIdx - BG_LINE_H / 2;
  // We need to translate the lines container so matched line lands center.
  // Initial translateY = 0 means lines start at top. Final translateY < 0 to scroll up.
  const finalTranslate = -(BG_LINE_H * matchedIdx - bgBodyHeight / 2 + 200);
  const scrollY = interpolate(
    frame,
    [285, 320],
    [-ambient, finalTranslate],
    {
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Matched-line accent flash (post-jump)
  const matchHighlight = interpolate(
    frame,
    [318, 332, 360],
    [0, 1, 0.55],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Selected row index in results (highlight row 0 by default; could move w/ time)
  const selectedIdx = 0;

  // Typewriter starts at frame ~22
  const queryStart = 22;
  const query = "that error about jwt signing yesterday";

  // Enter-hint flashes at frame 275 ish
  const enterOp = interpolate(frame, [270, 278, 288], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <Terminal title="user@machine: ~/work — tmux: dev" bodyStyle={{ padding: 0 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Background tmux content */}
          <div
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              top: 18,
              transform: `translateY(${frame < 285 ? -ambient : scrollY}px)`,
              fontFamily: fonts.mono,
              fontSize: 17,
              lineHeight: `${BG_LINE_H}px`,
              color: colors.textDim,
              willChange: "transform",
            }}
          >
            {BG_LINES.map((line, i) => {
              const isMatched = i === matchedIdx;
              return (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    color: line.startsWith("$")
                      ? colors.accent
                      : line.includes("error") || line.includes("[error]")
                        ? "#ff8a80"
                        : line.includes("warn")
                          ? "#ffd180"
                          : colors.textDim,
                    whiteSpace: "pre",
                    paddingLeft: 6,
                  }}
                >
                  {isMatched && (
                    <div
                      style={{
                        position: "absolute",
                        left: -6,
                        right: -6,
                        top: 0,
                        bottom: 0,
                        background: colors.accentDim,
                        opacity: matchHighlight,
                        borderLeft: `3px solid ${colors.accent}`,
                        borderRadius: 2,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  <span style={{ position: "relative" }}>{line}</span>
                </div>
              );
            })}
          </div>

          {/* Dim background while overlay is up */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000",
              opacity: 0.55 * overlayProgress,
              pointerEvents: "none",
            }}
          />

          {/* peek overlay panel */}
          <Overlay
            progress={overlayProgress}
            queryStart={queryStart}
            query={query}
            selectedIdx={selectedIdx}
            frame={frame}
            enterOp={enterOp}
          />
        </div>
      </Terminal>
    </AbsoluteFill>
  );
};

type OverlayProps = {
  progress: number;
  queryStart: number;
  query: string;
  selectedIdx: number;
  frame: number;
  enterOp: number;
};

const Overlay: React.FC<OverlayProps> = ({
  progress,
  queryStart,
  query,
  selectedIdx,
  frame,
  enterOp,
}) => {
  // Slide up from bottom: translateY 100% -> 0
  const translateY = interpolate(progress, [0, 1], [120, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        bottom: 36,
        opacity: progress,
        transform: `translateY(${translateY}px)`,
        background: "rgba(14, 14, 18, 0.96)",
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(167,139,250,0.08) inset",
        backdropFilter: "blur(6px)",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 22px",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            color: colors.accent,
            background: colors.accentDim,
            padding: "3px 10px",
            borderRadius: 999,
            letterSpacing: 0.6,
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          peek
        </div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 22,
            color: colors.text,
            flex: 1,
          }}
        >
          <span style={{ color: colors.textFaint, marginRight: 10 }}>›</span>
          <Typewriter
            text={query}
            startFrame={queryStart}
            cps={2.0}
            caret
            caretColor={colors.accent}
          />
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            color: colors.textFaint,
            letterSpacing: 0.4,
          }}
        >
          5 results · 142 ms
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: "10px 0" }}>
        {RESULTS.map((r, i) => (
          <ResultRow
            key={i}
            r={r}
            index={i}
            selected={i === selectedIdx}
            frame={frame}
          />
        ))}
      </div>

      {/* Footer hints */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 22px",
          borderTop: `1px solid ${colors.border}`,
          fontFamily: fonts.sans,
          fontSize: 13,
          color: colors.textFaint,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", gap: 22 }}>
          <Hint k="↑↓" label="navigate" />
          <Hint k="enter" label="jump" highlight={enterOp} />
          <Hint k="esc" label="close" />
        </div>
        <div style={{ color: colors.textFaint }}>100% local · embeddings: bge-small</div>
      </div>
    </div>
  );
};

const Hint: React.FC<{ k: string; label: string; highlight?: number }> = ({
  k,
  label,
  highlight = 0,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span
      style={{
        fontFamily: fonts.mono,
        fontSize: 12,
        color: colors.text,
        background: highlight > 0 ? colors.accent : "rgba(255,255,255,0.06)",
        border: `1px solid ${highlight > 0 ? colors.accent : colors.border}`,
        padding: "2px 8px",
        borderRadius: 4,
        boxShadow:
          highlight > 0
            ? `0 0 ${20 * highlight}px ${colors.accentGlow}`
            : "none",
      }}
    >
      {k}
    </span>
    <span>{label}</span>
  </div>
);

const ResultRow: React.FC<{
  r: Result;
  index: number;
  selected: boolean;
  frame: number;
}> = ({ r, index, selected, frame }) => {
  const fps = 30;
  // Stagger in: each row springs in starting at frame 90 + 12*index
  const appear = spring({
    frame: frame - (90 + index * 12),
    fps,
    config: { damping: 20, stiffness: 130, mass: 0.7 },
  });
  const op = interpolate(appear, [0, 1], [0, 1]);
  const tx = interpolate(appear, [0, 1], [16, 0]);

  // Selected highlight intensifies after row appears
  const selOp = selected
    ? interpolate(frame, [240, 258], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "180px 130px 1fr 70px",
        gap: 18,
        alignItems: "center",
        padding: "10px 22px",
        opacity: op,
        transform: `translateX(${tx}px)`,
        fontFamily: fonts.mono,
        fontSize: 17,
        color: colors.text,
      }}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            top: 4,
            bottom: 4,
            background: colors.accentDim,
            borderLeft: `3px solid ${colors.accent}`,
            borderRadius: 4,
            opacity: selOp,
            pointerEvents: "none",
          }}
        />
      )}
      <span
        style={{
          color: colors.textDim,
          fontSize: 14,
          position: "relative",
        }}
      >
        {r.ts}
      </span>
      <span
        style={{
          color: colors.accent,
          fontSize: 14,
          position: "relative",
        }}
      >
        {r.pane}
      </span>
      <span
        style={{
          position: "relative",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {r.snippet}
      </span>
      <span
        style={{
          color: colors.textFaint,
          fontSize: 13,
          textAlign: "right",
          position: "relative",
        }}
      >
        {r.score}
      </span>
    </div>
  );
};
