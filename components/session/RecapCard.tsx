import { getSubjectColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RecapCardProps {
  summary: string;
  keyLearnings: string[];
  subject: string;
  topic: string;
}

export const RecapCard = ({ summary, keyLearnings, subject, topic }: RecapCardProps) => {
  const accentColor = getSubjectColor(subject) || "#FFF0EA";

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      {/* Colored subject header strip */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ backgroundColor: accentColor }}
      >
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-700 bg-white/60 rounded-full px-3 py-1">
          {subject}
        </span>
        <span className="text-sm font-semibold text-neutral-800 truncate">{topic}</span>
      </div>

      {/* Summary */}
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="text-base font-semibold text-neutral-900 flex items-center gap-2">
          📋 Session Summary
        </CardTitle>
        <CardDescription className="text-sm text-neutral-700 leading-relaxed mt-1">
          {summary}
        </CardDescription>
      </CardHeader>

      {/* Key Learnings */}
      <CardContent className="pt-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
          🔑 Key Learnings
        </p>
        <ul className="flex flex-col gap-3">
          {keyLearnings.map((learning, i) => (
            <li
              key={i}
              className="flex items-start gap-3 bg-neutral-50 rounded-xl px-4 py-3 text-sm text-neutral-800 font-medium border border-neutral-100"
            >
              <span
                className="shrink-0 size-6 rounded-full flex items-center justify-center text-xs font-bold text-neutral-700"
                style={{ backgroundColor: accentColor }}
              >
                {i + 1}
              </span>
              {learning}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default RecapCard;
