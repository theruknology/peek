import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";
import { Terminal } from "../components/Terminal";

type Props = { durationInFrames: number };

const LINES: string[] = [
  "$ npm install",
  "npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported",
  "npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory",
  "npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported",
  "added 1284 packages, and audited 1285 packages in 23s",
  "",
  "$ npm run build",
  "> app@1.0.0 build",
  "> tsc -p . && vite build",
  "",
  "src/auth/jwt.ts:42:18 - error TS2345: Argument of type 'string | undefined'",
  "  is not assignable to parameter of type 'string'.",
  "    42   const token = jwt.sign(payload, process.env.JWT_SECRET, { ... })",
  "                                          ~~~~~~~~~~~~~~~~~~~~~",
  "src/auth/jwt.ts:71:9 - error TS2322: secretOrPrivateKey must have a value",
  "    at Object.module.exports [as sign] (/app/node_modules/jsonwebtoken/sign.js:107:20)",
  "    at signToken (/app/src/auth/jwt.ts:42:24)",
  "    at processLogin (/app/src/routes/auth.ts:88:18)",
  "    at async Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)",
  "",
  "$ docker compose up --build api",
  "[+] Building 41.2s (18/22)",
  " => [internal] load build definition from Dockerfile             0.0s",
  " => [internal] load .dockerignore                                0.0s",
  " => [api 1/8] FROM docker.io/library/node:20-alpine              0.0s",
  " => [api 2/8] WORKDIR /app                                       0.1s",
  " => [api 3/8] COPY package*.json ./                              0.0s",
  " => [api 4/8] RUN npm ci --omit=dev                             18.4s",
  " => [api 5/8] COPY . .                                           0.2s",
  " => [api 6/8] RUN npm run build                                  9.7s",
  "api-1  | > app@1.0.0 start",
  "api-1  | > node dist/server.js",
  "api-1  | [info] connecting to postgres at db:5432 ...",
  "api-1  | [info] connected. running migrations.",
  "api-1  | [info] migrations up-to-date (47 applied).",
  "api-1  | [info] listening on :8080",
  "api-1  | [warn] JWT_SECRET not set, falling back to dev key (UNSAFE)",
  "api-1  | [error] uncaughtException: Error: secretOrPrivateKey must have a value",
  "api-1  |     at Object.module.exports [as sign] (jsonwebtoken/sign.js:107:20)",
  "api-1  |     at signToken (src/auth/jwt.ts:42:24)",
  "api-1  | [error] process exited with code 1",
  "",
  "$ pnpm test --filter @app/api",
  "PASS  src/users/users.service.spec.ts (3.21s)",
  "PASS  src/orders/orders.controller.spec.ts (4.10s)",
  "FAIL  src/auth/jwt.spec.ts (5.92s)",
  "  ● JWT › sign() throws when secret missing",
  "      expected 'secretOrPrivateKey must have a value'",
  "      received 'jwt malformed'",
  "",
  "$ kubectl logs -n prod api-7c9d-x4qkv --tail=60",
  "[2026-05-09T14:22:01Z] INFO  starting server v1.42.0",
  "[2026-05-09T14:22:01Z] INFO  connected to redis://cache:6379",
  "[2026-05-09T14:22:01Z] WARN  JWT_SECRET not set; refusing to start",
  "[2026-05-09T14:22:01Z] ERROR fatal: jwt signing key missing — see runbooks/auth.md",
  "[2026-05-09T14:22:01Z] INFO  shutting down gracefully ...",
  "",
  "$ git log --oneline -n 8",
  "f1a3c2e fix(auth): read JWT_SECRET from secret manager",
  "9e7b14d chore: bump deps",
  "44ac019 feat(api): add /v2/sessions",
  "2b8d9aa refactor(jwt): extract signing into module",
  "c0e1f37 test(jwt): cover missing-secret branch",
  "7d44e88 ci: cache pnpm store",
  "5fa201b chore: pin node to 20.11",
  "31bb7c0 docs: update runbook for auth",
];

const LINE_H = 28;

export const Problem: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Scroll: fast, then freeze.
  // From frame 0 -> ~150 we scroll through ~all of LINES; then hold.
  const scrollEnd = 150;
  const totalScroll = LINES.length * LINE_H - 540;
  const scrolled = interpolate(frame, [10, scrollEnd], [0, totalScroll], {
    easing: Easing.bezier(0.22, 0.61, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Overlay text: "where did that error go?"
  const overlay = spring({
    frame: frame - 90,
    fps,
    config: { damping: 22, stiffness: 90, mass: 1 },
  });
  const overlayOp = interpolate(overlay, [0, 1], [0, 1]);
  const overlayY = interpolate(overlay, [0, 1], [12, 0]);

  // Vignette dim while overlay shows + after freeze.
  const dim = interpolate(frame, [88, 130], [0, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineColor = useMemo(
    () =>
      LINES.map((l) => {
        if (l.startsWith("$")) return colors.accent;
        if (l.includes("ERROR") || l.includes("error") || l.includes("FAIL"))
          return "#ff8a80";
        if (l.includes("WARN") || l.includes("warn")) return "#ffd180";
        if (l.startsWith("api-1") || l.startsWith("[2026"))
          return colors.textDim;
        return colors.text;
      }),
    []
  );

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
          <div
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              top: 18,
              transform: `translateY(${-scrolled}px)`,
              fontFamily: fonts.mono,
              fontSize: 18,
              lineHeight: `${LINE_H}px`,
              willChange: "transform",
            }}
          >
            {LINES.map((line, i) => (
              <div
                key={i}
                style={{
                  color: lineColor[i],
                  whiteSpace: "pre",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {line || " "}
              </div>
            ))}
          </div>

          {/* Top + bottom fade masks for depth */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 40,
              background: `linear-gradient(${colors.surface}, transparent)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 60,
              background: `linear-gradient(transparent, ${colors.surface})`,
              pointerEvents: "none",
            }}
          />

          {/* Dim overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000",
              opacity: dim,
              pointerEvents: "none",
            }}
          />

          {/* Centered question overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: overlayOp,
              transform: `translateY(${overlayY}px)`,
            }}
          >
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: 56,
                color: colors.text,
                fontWeight: 500,
                letterSpacing: 0.2,
                textShadow: "0 6px 30px rgba(0,0,0,0.6)",
              }}
            >
              where did that error go?
            </div>
          </div>
        </div>
      </Terminal>
    </AbsoluteFill>
  );
};
