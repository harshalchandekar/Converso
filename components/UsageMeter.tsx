"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVoiceQuota, VoiceQuotaResponse } from "@/lib/actions/voice.actions";

export const UsageMeter = () => {
  const [quota, setQuota] = useState<VoiceQuotaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadQuota = async () => {
      try {
        const data = await getVoiceQuota();
        if (isMounted) {
          setQuota(data);
        }
      } catch (err) {
        console.error("Failed to load header usage meter quota:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadQuota();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !quota) {
    return (
      <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400 bg-neutral-100/80 px-3 py-1.5 rounded-full animate-pulse">
        <span className="w-16 h-3 bg-neutral-200 rounded"></span>
      </div>
    );
  }

  const usedMinutes = Math.floor(quota.usedSeconds / 60);
  const totalMinutes = Math.floor(quota.dailySeconds / 60);
  const percentUsed = Math.min(100, Math.round((quota.usedSeconds / quota.dailySeconds) * 100));
  const isNearLimit = quota.remainingSeconds < 180; // less than 3 minutes left

  return (
    <Link
      href="/subscription"
      title={`${quota.remainingSeconds}s remaining today (${quota.plan.toUpperCase()} plan). Click to manage.`}
      className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors shadow-2xs text-xs"
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`size-2 rounded-full ${
            quota.remainingSeconds <= 30
              ? "bg-red-500 animate-ping"
              : isNearLimit
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
        />
        <span className="font-medium text-neutral-700">
          {usedMinutes} of {totalMinutes} min used today
        </span>
      </div>

      <div className="w-12 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            quota.remainingSeconds <= 30
              ? "bg-red-500"
              : isNearLimit
              ? "bg-amber-500"
              : "bg-[#FE5933]"
          }`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>
    </Link>
  );
};

export default UsageMeter;
