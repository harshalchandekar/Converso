"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSupabaseClient } from "../supabase";
import { computeStreak } from "../compute-streak";
import { getSubjectColor } from "../utils";
import { revalidatePath } from "next/cache";

const weeklyGoalSchema = z.object({
  weeklyGoalMinutes: z
    .number()
    .int()
    .min(10, "Minimum goal is 10 minutes")
    .max(600, "Maximum goal is 600 minutes (10 hours)"),
});

export interface SubjectBreakdown {
  subject: string;
  minutes: number;
  sessions: number;
  color: string;
}

export interface DailyActivity {
  date: string;
  label: string;
  minutes: number;
  sessions: number;
}

export interface DashboardData {
  totalMinutesStudied: number;
  sessionsThisWeek: number;
  totalSessionsCount: number;
  currentStreak: number;
  weeklyGoalMinutes: number;
  weeklyMinutesStudied: number;
  userTimezone: string;
  subjectsBreakdown: SubjectBreakdown[];
  activityLast14Days: DailyActivity[];
  recentSessions: Array<{
    id: string;
    companionId: string;
    companionName: string;
    subject: string;
    topic: string;
    createdAt: string;
    durationMinutes: number;
  }>;
}

/**
 * Fetches user settings (or creates default row if first time loading).
 */
export async function getUserSettings() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("weekly_goal_minutes, timezone")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return {
      weekly_goal_minutes: 60,
      timezone: "UTC",
    };
  }

  return data;
}

/**
 * Updates the weekly study goal in user_settings with Zod validation.
 */
export async function updateWeeklyGoal(weeklyGoalMinutes: number) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Please sign in to update your goal.");
  }

  const parsed = weeklyGoalSchema.safeParse({ weeklyGoalMinutes });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid goal minutes");
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      weekly_goal_minutes: parsed.data.weeklyGoalMinutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to update weekly goal:", error.message);
    throw new Error("Failed to save weekly goal.");
  }

  revalidatePath("/dashboard");
  return { success: true, weeklyGoalMinutes: parsed.data.weeklyGoalMinutes };
}

/**
 * Syncs the browser's resolved timezone to user_settings if not yet set or changed.
 */
export async function syncUserTimezone(timezone: string) {
  const { userId } = await auth();
  if (!userId || !timezone) return;

  const supabase = createSupabaseClient();
  await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      timezone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

/**
 * Aggregates all analytics in server queries for the dashboard.
 */
export async function getDashboardData(clientTimezone?: string): Promise<DashboardData> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Sign-in required for dashboard access.");
  }

  const supabase = createSupabaseClient();
  const userSettings = await getUserSettings();
  const activeTimezone = clientTimezone || userSettings?.timezone || "UTC";

  // 1. Fetch user's session history with joined companion details
  const { data: sessionRows, error: sessionErr } = await supabase
    .from("session_history")
    .select("id, companion_id, created_at, companions:companion_id(id, name, subject, topic, duration)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (sessionErr) {
    console.error("Error fetching session history for dashboard:", sessionErr.message);
  }

  // 2. Fetch all voice usage logs for exact recorded seconds
  const { data: usageRows, error: usageErr } = await supabase
    .from("voice_usage")
    .select("seconds, session_id, created_at")
    .eq("user_id", userId);

  if (usageErr) {
    console.error("Error fetching voice usage for dashboard:", usageErr.message);
  }

interface CompanionRecord {
  id?: string;
  name?: string;
  subject?: string;
  topic?: string;
  duration?: number;
}

interface SessionRecord {
  id: string;
  companion_id: string;
  created_at: string;
  companions?: CompanionRecord | null;
}

interface VoiceUsageRecord {
  seconds: number;
  session_id: string | null;
  created_at: string;
}

  const sessions: SessionRecord[] = (sessionRows as unknown as SessionRecord[]) || [];
  const usages: VoiceUsageRecord[] = (usageRows as unknown as VoiceUsageRecord[]) || [];

  // Calculate total seconds studied across all time
  const totalSeconds = usages.reduce(
    (sum: number, u: VoiceUsageRecord) => sum + (u.seconds || 0),
    0
  );
  // Fallback to estimated companion durations if voice_usage table is brand new
  const totalMinutesStudied = totalSeconds > 0
    ? Math.round(totalSeconds / 60)
    : sessions.reduce((sum: number, s: SessionRecord) => sum + (s.companions?.duration || 15), 0);

  // Calculate streak from session completion dates using computeStreak
  const sessionDates = sessions.map((s: SessionRecord) => new Date(s.created_at));
  const currentStreak = computeStreak(sessionDates, activeTimezone, new Date());

  // Calculate weekly start boundary (last 7 days or current week)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklySessions = sessions.filter(
    (s: SessionRecord) => new Date(s.created_at) >= startOfWeek
  );
  const sessionsThisWeek = weeklySessions.length;

  const weeklySeconds = usages
    .filter((u: VoiceUsageRecord) => new Date(u.created_at) >= startOfWeek)
    .reduce((sum: number, u: VoiceUsageRecord) => sum + (u.seconds || 0), 0);

  const weeklyMinutesStudied = weeklySeconds > 0
    ? Math.round(weeklySeconds / 60)
    : weeklySessions.reduce((sum: number, s: SessionRecord) => sum + (s.companions?.duration || 15), 0);

  // Minutes per subject aggregation
  const subjectMap = new Map<string, { minutes: number; sessions: number }>();
  for (const s of sessions) {
    const comp = s.companions;
    const sub = comp?.subject || "general";
    const existing = subjectMap.get(sub) || { minutes: 0, sessions: 0 };
    existing.sessions += 1;
    existing.minutes += comp?.duration || 15;
    subjectMap.set(sub, existing);
  }

  const subjectsBreakdown: SubjectBreakdown[] = Array.from(subjectMap.entries()).map(
    ([subject, stats]) => ({
      subject,
      minutes: stats.minutes,
      sessions: stats.sessions,
      color: getSubjectColor(subject) || "#FE5933",
    })
  );

  // Last 14 days activity aggregation
  const activityLast14Days: DailyActivity[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Count sessions and approximate minutes on this day
    const daySessions = sessions.filter(
      (s: SessionRecord) => s.created_at && s.created_at.startsWith(dateStr)
    );
    const dayUsages = usages.filter(
      (u: VoiceUsageRecord) => u.created_at && u.created_at.startsWith(dateStr)
    );

    const dayMinutes = dayUsages.length > 0
      ? Math.round(dayUsages.reduce((sum: number, u: VoiceUsageRecord) => sum + (u.seconds || 0), 0) / 60)
      : daySessions.reduce((sum: number, s: SessionRecord) => sum + (s.companions?.duration || 15), 0);

    activityLast14Days.push({
      date: dateStr,
      label,
      minutes: dayMinutes,
      sessions: daySessions.length,
    });
  }

  // Format recent sessions
  const recent = sessions.slice(0, 5).map((s: SessionRecord) => {
    const comp = s.companions;
    return {
      id: s.id,
      companionId: s.companion_id,
      companionName: comp?.name || "Tutor Session",
      subject: comp?.subject || "study",
      topic: comp?.topic || "General Topic",
      createdAt: s.created_at,
      durationMinutes: comp?.duration || 15,
    };
  });

  return {
    totalMinutesStudied,
    sessionsThisWeek,
    totalSessionsCount: sessions.length,
    currentStreak,
    weeklyGoalMinutes: userSettings?.weekly_goal_minutes || 60,
    weeklyMinutesStudied,
    userTimezone: activeTimezone,
    subjectsBreakdown,
    activityLast14Days,
    recentSessions: recent,
  };
}
