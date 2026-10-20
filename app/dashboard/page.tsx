import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/actions/dashboard.actions";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Learning Dashboard",
  description: "View your AI tutoring study streaks, subject breakdowns, and weekly goal progress.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const dashboardData = await getDashboardData();

  return (
    <main>
      <DashboardClient data={dashboardData} />
    </main>
  );
}
