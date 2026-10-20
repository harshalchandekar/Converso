"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { DashboardData } from "@/lib/actions/dashboard.actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import GoalProgressRing from "./GoalProgressRing";
import GoalForm from "./GoalForm";
import TimezoneSync from "./TimezoneSync";

// Dynamically load Recharts components with ssr: false for bundle optimization
const DynamicSubjectChart = dynamic(() => import("./SubjectChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});

const DynamicActivityChart = dynamic(() => import("./ActivityChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});

interface DashboardClientProps {
  data: DashboardData;
}

export const DashboardClient = ({ data }: DashboardClientProps) => {
  const hasActivity = data.totalSessionsCount > 0 || data.totalMinutesStudied > 0;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Background timezone detection sync */}
      <TimezoneSync currentTimezone={data.userTimezone} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Learning Dashboard
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track your conversational study progress, time streaks, and weekly goals.
          </p>
        </div>
        <Link
          href="/companions"
          className="inline-flex items-center justify-center rounded-xl bg-[#FE5933] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#e04825] transition self-start sm:self-auto"
        >
          Start a Session
        </Link>
      </div>

      {!hasActivity ? (
        <EmptyState
          title="No tutoring sessions yet"
          description="Pick a subject companion and have your first voice lesson to start building your streak and analytics."
          actionText="Explore Companions"
          actionHref="/companions"
          className="py-16"
        />
      ) : (
        <>
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Total Studied
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-neutral-900">
                  {data.totalMinutesStudied} <span className="text-sm font-normal text-neutral-500">min</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-neutral-500">
                Lifetime spoken lesson time
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Sessions This Week
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-neutral-900">
                  {data.sessionsThisWeek}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-neutral-500">
                {data.weeklyMinutesStudied} mins studied this week
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Day Streak
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-[#FE5933] flex items-center gap-1.5">
                  🔥 {data.currentStreak} <span className="text-sm font-normal text-neutral-500">{data.currentStreak === 1 ? "day" : "days"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-neutral-500">
                {data.currentStreak > 0 ? "Keep the momentum going!" : "Complete a lesson to start your streak."}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Weekly Goal
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-neutral-900">
                  {Math.round((data.weeklyMinutesStudied / Math.max(1, data.weeklyGoalMinutes)) * 100)}%
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-neutral-500">
                {data.weeklyMinutesStudied} / {data.weeklyGoalMinutes} mins target
              </CardContent>
            </Card>
          </div>

          {/* Goal Ring & Goal Setting Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Weekly Goal</CardTitle>
                <CardDescription>Progress toward your active target</CardDescription>
              </CardHeader>
              <CardContent className="py-2 flex flex-col items-center">
                <GoalProgressRing
                  currentMinutes={data.weeklyMinutesStudied}
                  goalMinutes={data.weeklyGoalMinutes}
                />
              </CardContent>
              <div className="p-6 pt-0 border-t border-neutral-100 mt-4">
                <p className="text-xs font-medium text-neutral-500 mb-2">Adjust Weekly Target</p>
                <GoalForm initialGoalMinutes={data.weeklyGoalMinutes} />
              </div>
            </Card>

            {/* Last 14 Days Activity Area Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Activity Trend (Last 14 Days)</CardTitle>
                <CardDescription>Daily minutes spent speaking with AI companions</CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicActivityChart data={data.activityLast14Days} />
              </CardContent>
            </Card>
          </div>

          {/* Subjects Breakdown & Recent Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Minutes by Subject</CardTitle>
                <CardDescription>Distribution of study time across academic topics</CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicSubjectChart data={data.subjectsBreakdown} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
                <CardDescription>Your latest conversation logs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col divide-y divide-neutral-100">
                  {data.recentSessions.map((session) => (
                    <div key={session.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-sm text-neutral-900">{session.companionName}</p>
                        <p className="text-xs text-neutral-500 capitalize">
                          {session.subject} • {session.topic}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md">
                          {session.durationMinutes} min
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardClient;
