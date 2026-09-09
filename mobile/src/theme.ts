// -----------------------------------------------------------------------------
// theme.ts — the app's colors, in one place
// -----------------------------------------------------------------------------
// Same dark-navy palette as the web app (index.css): navy background, slate
// cards, amber highlights, green for money, red for errors. Keeping them here
// means every screen and component uses the exact same values.
// -----------------------------------------------------------------------------

export const colors = {
  bg: "#0f172a", // page background (dark navy)
  card: "#1e293b", // cards / inputs
  cardBorder: "#334155",
  text: "#e2e8f0", // main text
  textMuted: "#94a3b8", // secondary text
  textDim: "#64748b", // faint labels
  primary: "#2563eb", // main button blue
  primaryDark: "#1e40af",
  ghost: "#334155", // secondary button fill
  hover: "#475569",
  amberText: "#fbbf24", // money-ish highlights & brand
  amberSoft: "rgba(245, 158, 11, 0.12)",
  green: "#34d399", // balance / wins / "to win"
  red: "#f87171", // errors
  inputBg: "#0f172a",
};