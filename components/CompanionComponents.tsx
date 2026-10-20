'use client';

import { cn, configureAssistant, getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import soundwaves from "@/constants/soundwaves.json";
import { addToSessionHistory } from "@/lib/actions/companion.actions";
import { recordVoiceUsage } from "@/lib/actions/voice.actions";
import { generateSessionRecap } from "@/lib/actions/recap.actions";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

export interface TranscriptItem {
    role: "user" | "assistant";
    text: string;
}

const CompanionComponent = ({
    companionId,
    subject,
    topic,
    name,
    userName,
    userImage,
    style,
    voice,
    initialQuota,
}: CompanionComponentProps) => {

    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [endReason, setEndReason] = useState<string | null>(null);
    // Recap state: null = not generated, string = recap ID, 'error' = failed silently
    const [recapId, setRecapId] = useState<string | null>(null);
    const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);

    // Track transcripts for AI session recap
    const transcriptsRef = useRef<TranscriptItem[]>([]);

    // Guardrail: Session countdown timer
    const maxSessionSecs = initialQuota?.maxSessionSeconds && initialQuota.maxSessionSeconds > 0
        ? initialQuota.maxSessionSeconds
        : 480; // 8 minutes default

    const [secondsRemaining, setSecondsRemaining] = useState<number>(maxSessionSecs);
    const callStartTimeRef = useRef<number | null>(null);
    const hasRecordedUsageRef = useRef<boolean>(false);
    const lottieRef = useRef<LottieRefCurrentProps>(null);

    const isQuotaBlocked = initialQuota && !initialQuota.allowed;

    useEffect(() => {
        if (lottieRef) {
            if (isSpeaking) {
                lottieRef.current?.play();
            } else {
                lottieRef.current?.stop();
            }
        }
    }, [isSpeaking, lottieRef]);

    // Record usage safely once when session concludes
    const finalizeCallUsage = useCallback(async () => {
        if (hasRecordedUsageRef.current) return;
        hasRecordedUsageRef.current = true;

        let elapsedSeconds = 0;
        if (callStartTimeRef.current) {
            elapsedSeconds = Math.max(1, Math.round((Date.now() - callStartTimeRef.current) / 1000));
        }

        // Capture transcript snapshot before async operations
        const transcriptSnapshot = [...transcriptsRef.current];

        try {
            if (elapsedSeconds > 0) {
                await recordVoiceUsage({
                    sessionId: companionId,
                    seconds: elapsedSeconds,
                });
            }
            await addToSessionHistory(companionId);
        } catch (err) {
            console.error("Error finalizing call usage:", err);
        }

        // Generate AI recap in background (non-blocking — won't affect session save)
        if (transcriptSnapshot.length >= 4) {
            setIsGeneratingRecap(true);
            generateSessionRecap({
                companionId,
                subject,
                topic,
                transcript: transcriptSnapshot,
            })
                .then((recap) => {
                    if (recap?.id) setRecapId(recap.id);
                })
                .catch(() => { /* silently ignore */ })
                .finally(() => setIsGeneratingRecap(false));
        }
    }, [companionId, subject, topic]);

    // Active session countdown timer
    useEffect(() => {
        if (callStatus !== CallStatus.ACTIVE) return;

        const timer = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // End call when session limit or daily quota is reached
                    setEndReason("Session time limit reached. Great work!");
                    vapi.stop();
                    setCallStatus(CallStatus.FINISHED);
                    finalizeCallUsage();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [callStatus, finalizeCallUsage]);

    useEffect(() => {
        const onCallStart = () => {
            setCallStatus(CallStatus.ACTIVE);
            callStartTimeRef.current = Date.now();
            hasRecordedUsageRef.current = false;
            setEndReason(null);
        };

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            finalizeCallUsage();
        };

        const onMessage = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const role = message.role === 'assistant' ? 'assistant' : 'user';
                const text = message.transcript;
                
                // Keep transcript store for AI recap
                transcriptsRef.current.push({ role, text });

                const newMessage = { role: message.role, content: text };
                setMessages((prev) => [newMessage, ...prev]);
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => console.error('Vapi Error:', error);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
        };
    }, [companionId, finalizeCallUsage]);

    const toggleMicrophone = () => {
        const isMutedNow = vapi.isMuted();
        vapi.setMuted(!isMutedNow);
        setIsMuted(!isMutedNow);
    };

    const handleCall = async () => {
        if (isQuotaBlocked) return;

        setCallStatus(CallStatus.CONNECTING);
        setSecondsRemaining(maxSessionSecs);

        const assistantOverrides = {
            variableValues: { subject, topic, style },
            clientMessages: ["transcript"],
            serverMessages: [],
        };

        // Pass maxSessionSecs to configureAssistant for Vapi-side telephony termination guardrail
        // @ts-expect-error - assistantOverrides type mismatch with Vapi SDK overload
        vapi.start(configureAssistant(voice, style, maxSessionSecs), assistantOverrides);
    };

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
        finalizeCallUsage();
    };

    // Format remaining time in mm:ss
    const formatTime = (totalSecs: number) => {
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <section className="flex flex-col gap-4">
            {/* Friendly Quota Alert if Daily Quota Exceeded */}
            {isQuotaBlocked && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <p className="font-semibold text-sm">Daily Voice Quota Limit Reached</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            You have used your daily voice minutes allowance. Your quota resets {initialQuota?.resetsAtFormatted || "soon"}.
                        </p>
                    </div>
                    <Link
                        href="/subscription"
                        className="text-xs font-semibold bg-[#FE5933] text-white px-3.5 py-2 rounded-lg hover:bg-[#e04825] transition shrink-0"
                    >
                        Upgrade to Pro
                    </Link>
                </div>
            )}

            {/* End reason banner if session concluded due to timer */}
            {endReason && (
                <div className="bg-neutral-100 border border-neutral-300 rounded-xl p-3 text-neutral-800 text-xs font-medium">
                    ⏱️ {endReason}
                </div>
            )}

            {/* View Recap button — appears after session finishes */}
            {callStatus === CallStatus.FINISHED && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex-1">
                        <p className="font-semibold text-sm text-neutral-900">Session Complete 🎉</p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {isGeneratingRecap
                                ? "Generating your AI recap and quiz..."
                                : recapId
                                ? "Your recap is ready — review key learnings and test yourself!"
                                : transcriptsRef.current.length < 4
                                ? "Talk more in your next session to unlock AI recaps!"
                                : "Recap generation failed — try again next session."}
                        </p>
                    </div>
                    {recapId && !isGeneratingRecap && (
                        <Link
                            href={`/sessions/${recapId}`}
                            className="shrink-0 inline-flex items-center gap-2 bg-[#FE5933] hover:bg-[#e04825] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
                        >
                            View Recap &amp; Quiz →
                        </Link>
                    )}
                    {isGeneratingRecap && (
                        <div className="shrink-0 flex items-center gap-2 text-xs text-neutral-500 bg-white border border-neutral-200 px-4 py-2.5 rounded-lg">
                            <span className="size-3 rounded-full bg-[#FE5933] animate-pulse" />
                            Generating...
                        </div>
                    )}
                </div>
            )}

            <section className="flex gap-8 max-sm:flex-col">
                <div className="companion-section relative">
                    {/* Live countdown timer indicator */}
                    <div className="absolute top-3 right-3 bg-neutral-900/80 text-white text-xs px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 backdrop-blur-xs">
                        <span className={`size-2 rounded-full ${callStatus === CallStatus.ACTIVE ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'}`} />
                        <span>{formatTime(secondsRemaining)}</span>
                    </div>

                    <div
                        className="companion-avatar"
                        style={{ backgroundColor: getSubjectColor(subject) }}
                    >
                        <div
                            className={cn(
                                'absolute transition-opacity duration-1000',
                                callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                            )}
                        >
                            <Image
                                src={`/icons/${subject}.svg`}
                                alt={subject}
                                width={150}
                                height={150}
                                className="max-sm:w-fit"
                            />
                        </div>
                        <div
                            className={cn(
                                'absolute transition-opacity duration-1000',
                                callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0'
                            )}
                        >
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                className="companion-lottie"
                            />
                        </div>
                    </div>
                    <p className="font-bold text-2xl">{name}</p>
                </div>

                <div className="user-section">
                    <div className="user-avatar">
                        <Image
                            src={userImage}
                            alt={userName}
                            width={130}
                            height={130}
                            className="rounded-lg object-cover"
                        />
                        <p className="font-bold text-2xl">{userName}</p>
                    </div>

                    <button
                        className="btn-mic"
                        onClick={toggleMicrophone}
                        disabled={callStatus !== CallStatus.ACTIVE}
                        type="button"
                    >
                        <Image
                            src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'}
                            alt="mic"
                            width={36}
                            height={36}
                        />
                        <p className="max-sm:hidden">
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
                        </p>
                    </button>

                    <button
                        className={cn(
                            'rounded-lg py-2 cursor-pointer transition-colors w-full text-white font-medium text-sm',
                            callStatus === CallStatus.ACTIVE
                                ? 'bg-red-700 hover:bg-red-800'
                                : isQuotaBlocked
                                ? 'bg-neutral-400 cursor-not-allowed'
                                : 'bg-primary hover:opacity-90',
                            callStatus === CallStatus.CONNECTING && 'animate-pulse'
                        )}
                        disabled={isQuotaBlocked && callStatus !== CallStatus.ACTIVE}
                        onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        type="button"
                    >
                        {callStatus === CallStatus.ACTIVE
                            ? 'End Session'
                            : callStatus === CallStatus.CONNECTING
                            ? 'Connecting...'
                            : isQuotaBlocked
                            ? 'Daily Quota Reached'
                            : 'Start Session'}
                    </button>
                </div>
            </section>

            <section className="transcript">
                <div className="transcript-message no-scrollbar">
                    {messages.length === 0 ? (
                        <p className="text-sm text-neutral-400 italic text-center py-4">
                            {callStatus === CallStatus.ACTIVE
                                ? "Start speaking to begin your lesson..."
                                : "Click 'Start Session' to begin speaking with your AI tutor."}
                        </p>
                    ) : (
                        messages.map((message, index) => {
                            if (message.role === 'assistant') {
                                return (
                                    <p key={index} className="max-sm:text-sm">
                                        <span className="font-semibold text-neutral-900">
                                            {name.split(' ')[0].replace(/[.,]/g, '')}:
                                        </span>{' '}
                                        {message.content}
                                    </p>
                                );
                            } else {
                                return (
                                    <p key={index} className="text-primary max-sm:text-sm">
                                        <span className="font-semibold">{userName}:</span> {message.content}
                                    </p>
                                );
                            }
                        })
                    )}
                </div>
                <div className="transcript-fade" />
            </section>
        </section>
    );
};

export default CompanionComponent;