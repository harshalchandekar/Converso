"use client";

import { useEffect } from "react";
import { syncUserTimezone } from "@/lib/actions/dashboard.actions";

interface TimezoneSyncProps {
  currentTimezone: string;
}

export const TimezoneSync = ({ currentTimezone }: TimezoneSyncProps) => {
  useEffect(() => {
    try {
      const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (clientTz && clientTz !== currentTimezone) {
        syncUserTimezone(clientTz);
      }
    } catch (err) {
      console.error("Failed to detect client timezone:", err);
    }
  }, [currentTimezone]);

  return null;
};

export default TimezoneSync;
