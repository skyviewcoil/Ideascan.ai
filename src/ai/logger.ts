// Tiny structured logger. Emits one JSON line per event to the console,
// so both the Cloudflare Worker log stream (`wrangler tail`) and browser
// devtools yield greppable output.
//
// Rules:
//   - Never log raw answers or AI responses — only metadata.
//   - Numeric fields are preferred over strings where meaningful
//     (durations in ms, counts, booleans).
//   - One event per log call; no multi-line payloads.

export type LogLevel = "info" | "warn" | "error";

export type NarrativeEvent =
  | "narrate.start"
  | "narrate.fallback"
  | "narrate.slice_failure"
  | "narrate.complete"
  | "narrate.rate_limited"
  | "report.cache_hit"
  | "report.cache_miss";

type Fields = Record<string, unknown>;

export function log(level: LogLevel, event: NarrativeEvent | string, fields: Fields = {}): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  // JSON.stringify catches thrown values that are non-serializable and
  // still produces output. We don't want a log call to throw.
  let line: string;
  try {
    line = JSON.stringify(entry);
  } catch {
    line = JSON.stringify({ ts: entry.ts, level, event, error: "unserializable_fields" });
  }
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
