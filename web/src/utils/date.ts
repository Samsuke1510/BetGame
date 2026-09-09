// -----------------------------------------------------------------------------
// utils/date.ts — helper for showing MLB game times to the user
// -----------------------------------------------------------------------------
// The MLB API sends game start times as UTC (e.g. "2026-09-09T17:10:00Z").
// The user is in France, so we convert that instant into PARIS time
// (Europe/Paris) — the browser's Intl API handles the conversion for us,
// including summer/winter time changes.

// Turn a stored game time (ISO string) into "HH:MM" in Paris time for display.
export function formatGameTime(gameTime: string): string {
  if (!gameTime) return ""; // games fetched before this feature have no time yet

  const date = new Date(gameTime); // parse the UTC instant

  // en-GB gives a clean "18:10" style; the timeZone does the Paris conversion.
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return time;
}

// Format the calendar date (e.g. "2026-09-09") as a friendly weekday, e.g. "Wed 9 Sep".
export function formatGameDate(gameDate: string): string {
  if (!gameDate) return "";
  // Build a local Date from the date parts so time zones can't shift the day.
  const [y, m, d] = gameDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}