// Lightweight per-user rate guard for narrative generation.
//
// Implementation is client-side (localStorage) — enough to prevent
// accidental spam from edit-revert-edit loops without adding a server
// KV dependency. A real production rollout will replace this with a
// server-side KV or D1 counter; the public API stays the same, so the
// swap is a one-file change.
//
// Rules applied at call time (whichever trips first wins):
//   - max 5 generations per 60s (burst)
//   - max 20 generations per 3600s (hour)

import { isBrowser, readKey, writeKey } from "@/services/storage";

const BURST_WINDOW_MS = 60_000;
const BURST_MAX = 5;
const HOUR_WINDOW_MS = 3_600_000;
const HOUR_MAX = 20;

type RateBucket = number[]; // array of unix-ms timestamps

export type RateGuardResult =
  | { allowed: true }
  | { allowed: false; reason: "burst" | "hour"; count: number; window_ms: number };

function loadBucket(userId: string): RateBucket {
  // Storage module owns user-scoping; we reuse its versioned key.
  if (!isBrowser()) return [];
  return readKey<RateBucket>("narrative_rate", userId) ?? [];
}

function saveBucket(userId: string, bucket: RateBucket): void {
  if (!isBrowser()) return;
  try {
    writeKey<RateBucket>("narrative_rate", bucket, userId);
  } catch {
    // Quota errors are not fatal — worst case the guard doesn't fire.
  }
}

function prune(bucket: RateBucket, now: number): RateBucket {
  return bucket.filter((t) => now - t <= HOUR_WINDOW_MS);
}

export function checkRate(userId: string, now: number = Date.now()): RateGuardResult {
  const bucket = prune(loadBucket(userId), now);
  const inBurstWindow = bucket.filter((t) => now - t <= BURST_WINDOW_MS);
  if (inBurstWindow.length >= BURST_MAX) {
    return {
      allowed: false,
      reason: "burst",
      count: inBurstWindow.length,
      window_ms: BURST_WINDOW_MS,
    };
  }
  if (bucket.length >= HOUR_MAX) {
    return { allowed: false, reason: "hour", count: bucket.length, window_ms: HOUR_WINDOW_MS };
  }
  return { allowed: true };
}

export function recordGeneration(userId: string, now: number = Date.now()): void {
  const bucket = prune(loadBucket(userId), now);
  bucket.push(now);
  saveBucket(userId, bucket);
}
