/**
 * Voice call duration and quota limits per subscription tier.
 * Daily limits follow a rolling 24-hour window.
 */

export type UserPlan = "free" | "pro";

export interface PlanLimits {
  dailySeconds: number;
  maxSessionSeconds: number;
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    dailySeconds: 15 * 60, // 15 minutes per day
    maxSessionSeconds: 8 * 60, // 8 minutes max per single session
  },
  pro: {
    dailySeconds: 60 * 60, // 60 minutes per day
    maxSessionSeconds: 20 * 60, // 20 minutes max per single session
  },
};

/** Minimum seconds required to initiate a call */
export const MIN_CALL_SECONDS = 30;

/** Grace period in seconds accepted on usage reporting to account for network latency */
export const USAGE_GRACE_PERIOD_SECONDS = 10;
