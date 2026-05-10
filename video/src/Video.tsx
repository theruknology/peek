import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { colors } from "./styles";
import { TitleCard } from "./scenes/TitleCard";
import { Problem } from "./scenes/Problem";
import { Hotkey } from "./scenes/Hotkey";
import { Demo } from "./scenes/Demo";
import { Pillars } from "./scenes/Pillars";
import { Outro } from "./scenes/Outro";

// Scene plan (30fps):
//   0   – 120  (0  – 4s)   Title card
//   120 – 330  (4  – 11s)  Problem
//   330 – 420  (11 – 14s)  Hotkey
//   420 – 780  (14 – 26s)  Demo (TUI overlay)
//   780 – 960  (26 – 32s)  Pillars
//   960 – 1200 (32 – 40s)  Outro / CTA

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <Sequence from={0} durationInFrames={120} name="Title">
        <TitleCard durationInFrames={120} />
      </Sequence>

      <Sequence from={120} durationInFrames={210} name="Problem">
        <Problem durationInFrames={210} />
      </Sequence>

      <Sequence from={330} durationInFrames={90} name="Hotkey">
        <Hotkey durationInFrames={90} />
      </Sequence>

      <Sequence from={420} durationInFrames={360} name="Demo">
        <Demo durationInFrames={360} />
      </Sequence>

      <Sequence from={780} durationInFrames={180} name="Pillars">
        <Pillars durationInFrames={180} />
      </Sequence>

      <Sequence from={960} durationInFrames={240} name="Outro">
        <Outro durationInFrames={240} />
      </Sequence>
    </AbsoluteFill>
  );
};
