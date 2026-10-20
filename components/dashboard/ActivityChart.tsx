"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DailyActivity } from "@/lib/actions/dashboard.actions";

interface ActivityChartProps {
  data: DailyActivity[];
}

export const ActivityChart = ({ data }: ActivityChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-neutral-400">
        No recent study activity recorded.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="minutesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FE5933" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FE5933" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: "#737373", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E5E5" }}
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E5E5" }}
            unit="m"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DailyActivity;
                return (
                  <div className="rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-md">
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-neutral-300">
                      {item.minutes} minutes ({item.sessions} session
                      {item.sessions === 1 ? "" : "s"})
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="minutes"
            stroke="#FE5933"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#minutesGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityChart;
