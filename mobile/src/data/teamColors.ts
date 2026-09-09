// -----------------------------------------------------------------------------
// data/teamColors.ts — one accent color per MLB team, to color the game cards
// -----------------------------------------------------------------------------
// The MLB API doesn't give us team colors, so we keep a small map of the
// primary brand color of each of the current 30 teams. Any team we haven't
// listed falls back to a deterministic color based on its name (see at the end),
// so the UI never breaks.
// -----------------------------------------------------------------------------

const TEAM_COLORS: Record<string, string> = {
  // AL East
  Yankees: "#0C2340",
  "Red Sox": "#BD3039",
  "Blue Jays": "#134A8E",
  Rays: "#092C5C",
  Orioles: "#DF4601",
  // AL Central
  Guardians: "#E31937",
  Tigers: "#0C2340",
  "White Sox": "#C4CED4",
  Royals: "#004687",
  Twins: "#002B5C",
  // AL West
  Astros: "#EB6E1F",
  Rangers: "#003278",
  Mariners: "#0C2C56",
  Athletics: "#003831",
  Angels: "#BA0021",
  // NL East
  Braves: "#CE1141",
  Mets: "#002D72",
  Phillies: "#E81828",
  Nationals: "#AB0003",
  Marlins: "#00A3E0",
  // NL Central
  Cardinals: "#C41E3A",
  Cubs: "#0E3386",
  Brewers: "#FFC52F",
  Pirates: "#FDB827",
  Reds: "#C6011F",
  // NL West
  Dodgers: "#005A9C",
  Giants: "#FD5A1E",
  Padres: "#2F241D",
  Diamondbacks: "#A71930",
  Rockies: "#333366",
};

// A stable fallback color for any team missing from the map above.
// We turn the name into a hue with a tiny hash, so the same team always
// gets the same pleasant color (SATURATION/LIGHTNESS tuned for dark theme).
export function teamColor(teamName: string): string {
  const known = TEAM_COLORS[teamName];
  if (known) return known;

  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = (hash * 31 + teamName.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 45%)`;
}