/**
 * Deterministic date formatting for client components that are server-rendered.
 *
 * `toLocaleString()` without arguments renders in the host's locale and time
 * zone, which differ between the Node server (UTC) and the visitor's browser.
 * That makes the server HTML and the client render disagree and triggers a
 * React hydration mismatch. Pinning the locale and zone keeps both sides
 * byte-identical; the zone is labelled so the value is never ambiguous.
 */
const FORMATTER = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${FORMATTER.format(date)} UTC`;
}
