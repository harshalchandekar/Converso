"use client";

import { useState } from "react";
import { updateWeeklyGoal } from "@/lib/actions/dashboard.actions";

interface GoalFormProps {
  initialGoalMinutes: number;
}

export const GoalForm = ({ initialGoalMinutes }: GoalFormProps) => {
  const [goal, setGoal] = useState<number>(initialGoalMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (goal < 10 || goal > 600) {
      setMessage({ text: "Goal must be between 10 and 600 minutes.", error: true });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await updateWeeklyGoal(goal);
      setMessage({ text: "Weekly goal updated successfully!" });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to save goal.";
      setMessage({ text: errMsg, error: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={10}
          max={600}
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          className="w-24 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium focus:border-neutral-900 focus:outline-hidden"
          disabled={isSaving}
          required
        />
        <span className="text-xs text-neutral-500 font-medium">minutes / week</span>
        <button
          type="submit"
          disabled={isSaving}
          className="ml-auto rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Saving..." : "Update"}
        </button>
      </div>

      {message && (
        <p
          className={`text-xs ${
            message.error ? "text-red-600 font-medium" : "text-emerald-700 font-medium"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
};

export default GoalForm;
