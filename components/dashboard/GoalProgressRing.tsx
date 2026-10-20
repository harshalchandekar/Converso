"use client";

interface GoalProgressRingProps {
  currentMinutes: number;
  goalMinutes: number;
}

export const GoalProgressRing = ({
  currentMinutes,
  goalMinutes,
}: GoalProgressRingProps) => {
  const percentage = Math.min(100, Math.round((currentMinutes / Math.max(1, goalMinutes)) * 100));
  const strokeWidth = 10;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative size-36 flex items-center justify-center">
        <svg className="size-full -rotate-90" viewBox="0 0 128 128">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-neutral-100"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress stroke */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-[#FE5933] transition-all duration-700 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold tracking-tight text-neutral-900">
            {percentage}%
          </span>
          <span className="text-[11px] text-neutral-500 font-medium">
            of weekly goal
          </span>
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-neutral-600">
        <span className="font-semibold text-neutral-900">{currentMinutes}</span> of{" "}
        <span className="font-semibold text-neutral-900">{goalMinutes}</span> mins completed
      </div>
    </div>
  );
};

export default GoalProgressRing;
