import React from "react";
import { colors, fonts, radii } from "../styles";

type Props = {
  width?: number | string;
  height?: number | string;
  title?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
};

const TITLEBAR_H = 36;

export const Terminal: React.FC<Props> = ({
  width = 1500,
  height = 820,
  title = "user@machine: ~/work",
  children,
  style,
  bodyStyle,
}) => {
  return (
    <div
      style={{
        width,
        height,
        background: colors.surface,
        borderRadius: radii.lg,
        border: `1px solid ${colors.border}`,
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: TITLEBAR_H,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          background: colors.surfaceHi,
          borderBottom: `1px solid ${colors.border}`,
          gap: 8,
          flexShrink: 0,
        }}
      >
        <Dot color={colors.red} />
        <Dot color={colors.yellow} />
        <Dot color={colors.green} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontSize: 13,
            color: colors.textFaint,
            letterSpacing: 0.2,
            marginRight: 48, // counter-balance dots so title centers
          }}
        >
          {title}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          padding: "18px 22px",
          fontFamily: fonts.mono,
          fontSize: 18,
          color: colors.text,
          lineHeight: 1.5,
          position: "relative",
          overflow: "hidden",
          ...bodyStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div
    style={{
      width: 12,
      height: 12,
      borderRadius: "50%",
      background: color,
    }}
  />
);
