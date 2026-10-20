"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseClient } from "@/lib/supabase";

// ── Zod schema for Gemini response validation ───────────────────────
const quizQuestionSchema = z.object({
  question: z.string().min(5),
  options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(5),
});

const recapSchema = z.object({
  summary: z.string().min(10),
  keyLearnings: z.array(z.string().min(5)).length(3),
  quiz: z.array(quizQuestionSchema).length(3),
});

// ── Gemini client (singleton-safe with lazy init) ──────────────────
let _ai: GoogleGenAI | null = null;
function getAI() {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set in .env.local");
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

// ── Build the prompt ───────────────────────────────────────────────
function buildRecapPrompt(
  subject: string,
  topic: string,
  transcript: Array<{ role: string; text: string }>
): string {
  const dialogue = transcript
    .map((t) => `${t.role === "assistant" ? "Tutor" : "Student"}: ${t.text}`)
    .join("\n");

  return `You are an educational assistant. Below is a voice tutoring session transcript about "${topic}" in "${subject}".

TRANSCRIPT:
${dialogue}

Your task:
1. Write a 2–3 sentence SUMMARY of what was covered.
2. Extract exactly 3 KEY LEARNINGS as short, punchy bullet points (each under 20 words).
3. Write exactly 3 MULTIPLE CHOICE QUIZ questions to test retention. Each must have 4 answer options, 1 correct answer (0-indexed), and a short explanation.

Respond ONLY with valid JSON in this exact shape — no markdown, no extra text:
{
  "summary": "...",
  "keyLearnings": ["...", "...", "..."],
  "quiz": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}`;
}

// ── Main server action ─────────────────────────────────────────────
export interface GenerateRecapInput {
  companionId: string;
  subject: string;
  topic: string;
  transcript: Array<{ role: string; text: string }>;
  sessionHistoryId?: string; // the ID returned from addToSessionHistory if available
}

export async function generateSessionRecap(
  input: GenerateRecapInput
): Promise<SessionRecap | null> {
  const { userId } = await auth();
  if (!userId) return null;

  // Need at least 4 transcript lines to generate a meaningful recap
  if (!input.transcript || input.transcript.length < 4) return null;

  try {
    const ai = getAI();
    const prompt = buildRecapPrompt(input.subject, input.topic, input.transcript);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const rawText = response.text?.trim() ?? "";

    // Strip markdown fences if Gemini wraps the JSON anyway
    const jsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(jsonText);
    const validated = recapSchema.parse(parsed);

    // Save to Supabase
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("session_recaps")
      .insert({
        session_id: input.sessionHistoryId ?? null,
        user_id: userId,
        companion_id: input.companionId,
        subject: input.subject,
        topic: input.topic,
        summary: validated.summary,
        key_learnings: validated.keyLearnings,
        quiz: validated.quiz,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to save session recap:", error?.message);
      return null;
    }

    return {
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
  } catch (err) {
    console.error("generateSessionRecap failed:", err);
    return null; // Graceful fallback — session still saves normally
  }
}

// ── Fetch a single recap by session history ID ─────────────────────
export async function getSessionRecap(
  sessionId: string
): Promise<SessionRecap | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_recaps")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
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
}

// ── Fetch all recaps for the current user (for history page) ───────
export async function getUserRecaps(): Promise<SessionRecap[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("session_recaps")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    companionId: row.companion_id,
    subject: row.subject,
    topic: row.topic,
    summary: row.summary,
    keyLearnings: row.key_learnings as string[],
    quiz: row.quiz as QuizQuestion[],
    createdAt: row.created_at,
  }));
}
