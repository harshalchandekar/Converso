import { PLAN_LIMITS, MIN_CALL_SECONDS, UserPlan } from "./limits";

export interface QuotaCalculation {
  plan: UserPlan;
  dailySeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
  maxSessionSeconds: number;
  allowed: boolean;
}

/**
 * Computes remaining voice quota and max session seconds for a user.
 * Pure function with zero I/O for deterministic testing.
 *
 * @param plan - 'free' or 'pro' tier
 * @param usedSecondsLast24h - Cumulative seconds used in rolling 24-hour window
 */
export function computeQuota(
  plan: UserPlan,
  usedSecondsLast24h: number
): QuotaCalculation {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const sanitizedUsed = Math.max(0, Math.floor(usedSecondsLast24h));
  const remainingSeconds = Math.max(0, limits.dailySeconds - sanitizedUsed);

  // User can start a call only if they have at least MIN_CALL_SECONDS (30s) available
  const allowed = remainingSeconds >= MIN_CALL_SECONDS;

  // The upcoming session is capped by the smaller of the plan's single-session limit and remaining daily allowance
  const effectiveMaxSession = allowed
    ? Math.min(limits.maxSessionSeconds, remainingSeconds)
    : 0;

  return {
    plan,
    dailySeconds: limits.dailySeconds,
    usedSeconds: sanitizedUsed,
    remainingSeconds,
    maxSessionSeconds: effectiveMaxSession,
    allowed,
  };
}
