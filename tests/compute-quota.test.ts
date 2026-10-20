import { describe, it, expect } from "vitest";
import { computeQuota } from "@/lib/compute-quota";
import { PLAN_LIMITS, MIN_CALL_SECONDS } from "@/lib/limits";

describe("computeQuota — free plan", () => {
  const FREE_DAILY = PLAN_LIMITS.free.dailySeconds;   // 900s
  const FREE_SESSION = PLAN_LIMITS.free.maxSessionSeconds; // 480s

  it("returns full quota when no usage", () => {
    const result = computeQuota("free", 0);
    expect(result.plan).toBe("free");
    expect(result.dailySeconds).toBe(FREE_DAILY);
    expect(result.usedSeconds).toBe(0);
    expect(result.remainingSeconds).toBe(FREE_DAILY);
    expect(result.maxSessionSeconds).toBe(FREE_SESSION);
    expect(result.allowed).toBe(true);
  });

  it("allows call when remaining >= MIN_CALL_SECONDS", () => {
    // Used all but exactly MIN_CALL_SECONDS
    const result = computeQuota("free", FREE_DAILY - MIN_CALL_SECONDS);
    expect(result.allowed).toBe(true);
    expect(result.remainingSeconds).toBe(MIN_CALL_SECONDS);
    // session capped by remaining
    expect(result.maxSessionSeconds).toBe(MIN_CALL_SECONDS);
  });

  it("blocks call when remaining < MIN_CALL_SECONDS", () => {
    const result = computeQuota("free", FREE_DAILY - MIN_CALL_SECONDS + 1);
    expect(result.allowed).toBe(false);
    expect(result.maxSessionSeconds).toBe(0);
  });

  it("blocks call when quota fully exhausted", () => {
    const result = computeQuota("free", FREE_DAILY);
    expect(result.allowed).toBe(false);
    expect(result.remainingSeconds).toBe(0);
    expect(result.maxSessionSeconds).toBe(0);
  });

  it("does not go negative on over-usage", () => {
    const result = computeQuota("free", FREE_DAILY + 500);
    expect(result.remainingSeconds).toBe(0);
    expect(result.usedSeconds).toBe(FREE_DAILY + 500);
    expect(result.allowed).toBe(false);
  });

  it("clamps maxSessionSeconds to min(session limit, remaining)", () => {
    // Remaining is less than the session cap
    const result = computeQuota("free", FREE_DAILY - 100);
    expect(result.maxSessionSeconds).toBeLessThanOrEqual(FREE_SESSION);
    expect(result.maxSessionSeconds).toBe(100);
  });

  it("floors fractional seconds on usedSeconds", () => {
    const result = computeQuota("free", 60.9);
    expect(result.usedSeconds).toBe(60);
  });
});

describe("computeQuota — pro plan", () => {
  const PRO_DAILY = PLAN_LIMITS.pro.dailySeconds;    // 3600s
  const PRO_SESSION = PLAN_LIMITS.pro.maxSessionSeconds; // 1200s

  it("returns full quota when no usage", () => {
    const result = computeQuota("pro", 0);
    expect(result.plan).toBe("pro");
    expect(result.dailySeconds).toBe(PRO_DAILY);
    expect(result.maxSessionSeconds).toBe(PRO_SESSION);
    expect(result.allowed).toBe(true);
  });

  it("still blocks when pro quota is fully used", () => {
    const result = computeQuota("pro", PRO_DAILY);
    expect(result.allowed).toBe(false);
  });
});

describe("computeQuota — edge cases", () => {
  it("falls back to free plan for unknown plan string", () => {
    // @ts-expect-error testing invalid input
    const result = computeQuota("enterprise", 0);
    expect(result.plan).toBe("enterprise");
    // limits should fall back to free tier values
    expect(result.dailySeconds).toBe(PLAN_LIMITS.free.dailySeconds);
  });
});
