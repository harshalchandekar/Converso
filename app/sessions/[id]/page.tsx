import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import RecapCard from "@/components/session/RecapCard";
import QuizCard from "@/components/session/QuizCard";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Session Recap`,
    description: `Review your AI-generated session summary, key learnings, and quiz for session ${id}.`,
    robots: { index: false, follow: false },
  };
}

export default async function SessionRecapPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_recaps")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) notFound();

  const recap: SessionRecap = {
    id: data.id,
    sessionId: data.session_id,
    userId: data.user_id,
    companionId: data.companion_id,
    subject: data.subject,
    topic: data.topic,
    summary: data.summary,
    keyLearnings: data.key_learnings as string[],
    quiz: data.quiz as QuizQuestion[],
    createdAt: data.created_at,
  };

  return (
    <main>
      {/* Back navigation */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href={`/companions/${recap.companionId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition"
        >
          ← Back to Companion
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Session Recap
        </h1>
        <p className="text-sm text-neutral-500 capitalize">
          {recap.subject} &mdash; {recap.topic} &bull;{" "}
          {new Date(recap.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Main content: Recap + Quiz stacked */}
      <div className="flex flex-col gap-6 pb-12">
        <RecapCard
          summary={recap.summary}
          keyLearnings={recap.keyLearnings}
          subject={recap.subject}
          topic={recap.topic}
        />
        <QuizCard quiz={recap.quiz} subject={recap.subject} />
      </div>
    </main>
  );
}
