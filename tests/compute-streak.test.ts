import { describe, it, expect } from "vitest";
import { computeStreak } from "@/lib/compute-streak";

const TZ = "UTC";

// Helper: returns a Date set to N days ago (relative to a fixed reference)
function daysAgo(n: number, ref: Date): Date {
  return new Date(ref.getTime() - n * 24 * 60 * 60 * 1000);
}

describe("computeStreak", () => {
  const today = new Date("2024-06-15T10:00:00Z");

  it("returns 0 when no sessions exist", () => {
    expect(computeStreak([], TZ, today)).toBe(0);
  });

  it("returns 1 when only today has a session", () => {
    expect(computeStreak([today], TZ, today)).toBe(1);
  });

  it("returns 1 when only yesterday has a session (streak not broken)", () => {
    const yesterday = daysAgo(1, today);
    expect(computeStreak([yesterday], TZ, today)).toBe(1);
  });

  it("returns 0 when last session was 2+ days ago (streak lapsed)", () => {
    const twoDaysAgo = daysAgo(2, today);
    expect(computeStreak([twoDaysAgo], TZ, today)).toBe(0);
  });

  it("counts consecutive days correctly (today + yesterday + 2 days ago)", () => {
    const dates = [today, daysAgo(1, today), daysAgo(2, today)];
    expect(computeStreak(dates, TZ, today)).toBe(3);
  });

  it("stops streak at a gap (today + 2 days ago, missing yesterday)", () => {
    const dates = [today, daysAgo(2, today)];
    expect(computeStreak(dates, TZ, today)).toBe(1);
  });

  it("ignores duplicate dates for the same calendar day", () => {
    const morning = new Date("2024-06-15T06:00:00Z");
    const evening = new Date("2024-06-15T20:00:00Z");
    expect(computeStreak([morning, evening], TZ, today)).toBe(1);
  });

  it("handles a 7-day perfect streak", () => {
    const dates = Array.from({ length: 7 }, (_, i) => daysAgo(i, today));
    expect(computeStreak(dates, TZ, today)).toBe(7);
  });

  it("correctly handles timezone shift (IST = UTC+5:30)", () => {
    // A session at 23:00 UTC is the NEXT calendar day in IST
    const lateUtc = new Date("2024-06-14T23:00:00Z"); // 06-15 04:30 IST
    const result = computeStreak([lateUtc], "Asia/Kolkata", today);
    // In IST this is 2024-06-15, so streak = 1
    expect(result).toBe(1);
  });

  it("returns 0 when passed invalid/NaN dates", () => {
    expect(computeStreak([new Date("invalid")], TZ, today)).toBe(0);
  });

  it("handles empty array gracefully", () => {
    expect(computeStreak([], TZ, today)).toBe(0);
  });
});
