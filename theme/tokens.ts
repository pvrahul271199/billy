/**
 * Billy design tokens: the single source of truth for every colour.
 *
 * CSS gets these as variables in app/globals.css (keep the two in sync).
 * Non-CSS contexts (PDF, QR code, manifest, theme-color) import from here.
 * Components never use hex values directly.
 */
export const colors = {
  /** Midnight indigo: primary text, primary buttons, active icons. */
  ink: "#1E1B4B",
  /** Primary button hover / pressed. */
  inkHover: "#2D2A66",
  inkPress: "#14123A",
  /** Secondary indigo: soft highlights, focus rings, selected outlines. Not for text. */
  ink2: "#8B88C2",
  /** Editorial slate: secondary text, labels, captions. */
  soft: "#5F5C80",
  /** Muted lilac: inactive icons, placeholders, currency symbols. Not for body text. */
  faint: "#A9A7C4",
  /** Hairline dividers and borders. */
  line: "#E4E3F0",
  /** Chip, key and card surfaces. */
  tint: "#F5F5FA",
  /** Paper white app background. */
  bg: "#FFFFFF",
  /** Desktop canvas behind the phone chassis. */
  frame: "#EEEEF6",
  /** Paid / on track: deep indigo on a soft lilac wash (no green). */
  good: "#2D2A66",
  goodBg: "#E6E5F4",
  /** Caution / overdue / errors: roasted amber on soft peach. */
  warm: "#B45309",
  warmBg: "#FDF1E4",
} as const;

/** Chart and breakdown ramp: indigo shades only. */
export const categoryRamp = ["#1E1B4B", "#3A3786", "#4B47A0", "#6663B0", "#7E7BBF", "#9896CE", "#B5B3DA", "#D3D2EA"] as const;

/** Printed invoice: pure black on white, greys for secondary text. Not the app palette. */
export const print = {
  text: "#000000",
  secondary: "#404040",
  hairline: "#BFBFBF",
  paper: "#FFFFFF",
} as const;

export const radii = {
  phone: 40,
  sheet: 28,
  btn: 16,
  key: 14,
  note: 14,
} as const;

/** Phone chassis size on desktop. */
export const chassis = { width: 380, height: 780, breakpoint: 420 } as const;
