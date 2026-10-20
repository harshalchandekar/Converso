"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SubjectBreakdown } from "@/lib/actions/dashboard.actions";

interface SubjectChartProps {
  data: SubjectBreakdown[];
}

export const SubjectChart = ({ data }: SubjectChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-neutral-400">
        No subject study time recorded yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
        >
          <XAxis
            dataKey="subject"
            tick={{ fill: "#737373", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E5E5" }}
            tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
          />
          <YAxis
            tick={{ fill: "#737373", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#E5E5E5" }}
            unit="m"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as SubjectBreakdown;
                return (
                  <div className="rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-md">
                    <p className="font-semibold capitalize">{item.subject}</p>
                    <p className="text-neutral-300">
                      {item.minutes} min ({item.sessions} session
                      {item.sessions === 1 ? "" : "s"})
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || "#FE5933"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubjectChart;
