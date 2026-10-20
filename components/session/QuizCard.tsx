"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuizCardProps {
  quiz: QuizQuestion[];
  subject: string;
}

type AnswerState = "unanswered" | "correct" | "wrong";

export const QuizCard = ({ quiz, subject }: QuizCardProps) => {
  const [selected, setSelected] = useState<(number | null)[]>(
    () => new Array(quiz.length).fill(null)
  );
  const [revealed, setRevealed] = useState<boolean[]>(
    () => new Array(quiz.length).fill(false)
  );
  const [showAll, setShowAll] = useState(false);

  const score = quiz.reduce((acc, q, i) => {
    return revealed[i] && selected[i] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  const allAnswered = revealed.every(Boolean);

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (revealed[qIdx]) return; // can't change after reveal
    setSelected((prev) => {
      const copy = [...prev];
      copy[qIdx] = optIdx;
      return copy;
    });
  };

  const handleReveal = (qIdx: number) => {
    if (selected[qIdx] === null) return; // must pick first
    setRevealed((prev) => {
      const copy = [...prev];
      copy[qIdx] = true;
      return copy;
    });
  };

  const getOptionState = (qIdx: number, optIdx: number): AnswerState => {
    if (!revealed[qIdx]) return "unanswered";
    if (optIdx === quiz[qIdx].correctIndex) return "correct";
    if (optIdx === selected[qIdx]) return "wrong";
    return "unanswered";
  };

  const optionLabel = ["A", "B", "C", "D"];

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-neutral-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            🧠 Quick Quiz
          </CardTitle>
          {allAnswered && (
            <span
              className={cn(
                "text-sm font-bold px-3 py-1 rounded-full",
                score === quiz.length
                  ? "bg-emerald-400 text-emerald-900"
                  : score >= quiz.length / 2
                  ? "bg-amber-400 text-amber-900"
                  : "bg-red-400 text-red-900"
              )}
            >
              {score}/{quiz.length} correct
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-0.5">
          Select an answer then click Check to reveal.
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-5 pb-6">
        {quiz.map((q, qIdx) => (
          <div key={qIdx} className="flex flex-col gap-3">
            {/* Question */}
            <p className="text-sm font-semibold text-neutral-900 leading-snug">
              <span className="text-[#FE5933] font-bold mr-1.5">Q{qIdx + 1}.</span>
              {q.question}
            </p>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, optIdx) => {
                const state = getOptionState(qIdx, optIdx);
                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={revealed[qIdx]}
                    onClick={() => handleSelect(qIdx, optIdx)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all",
                      // default
                      state === "unanswered" &&
                        selected[qIdx] === optIdx &&
                        "border-[#FE5933] bg-orange-50 text-[#FE5933]",
                      state === "unanswered" &&
                        selected[qIdx] !== optIdx &&
                        "border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-700",
                      // revealed
                      state === "correct" &&
                        "border-emerald-500 bg-emerald-50 text-emerald-800",
                      state === "wrong" &&
                        "border-red-400 bg-red-50 text-red-700"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 size-6 rounded-full flex items-center justify-center text-xs font-bold border",
                        state === "correct"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : state === "wrong"
                          ? "bg-red-500 text-white border-red-500"
                          : selected[qIdx] === optIdx
                          ? "bg-[#FE5933] text-white border-[#FE5933]"
                          : "border-neutral-300 text-neutral-500"
                      )}
                    >
                      {optionLabel[optIdx]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Check button / explanation */}
            {!revealed[qIdx] ? (
              <button
                type="button"
                disabled={selected[qIdx] === null}
                onClick={() => handleReveal(qIdx)}
                className="self-start text-xs font-semibold bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
            ) : (
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-xs leading-relaxed border",
                  selected[qIdx] === q.correctIndex
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                )}
              >
                <span className="font-semibold mr-1">
                  {selected[qIdx] === q.correctIndex ? "✅ Correct!" : "❌ Incorrect."}
                </span>
                {q.explanation}
              </div>
            )}
          </div>
        ))}

        {/* Final score banner */}
        {allAnswered && (
          <div
            className={cn(
              "rounded-2xl p-5 text-center border-2",
              score === quiz.length
                ? "bg-emerald-50 border-emerald-200"
                : score >= quiz.length / 2
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            )}
          >
            <p className="text-2xl font-extrabold text-neutral-900">
              {score === quiz.length
                ? "🎉 Perfect score!"
                : score >= quiz.length / 2
                ? "👍 Good effort!"
                : "📚 Keep studying!"}
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              You got {score} out of {quiz.length} questions right.
              {score < quiz.length && " Review the explanations above and try another session!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizCard;
