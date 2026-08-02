"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calculateWpm,
  detectFillerWords,
  type WordTimestamp,
  type AudioSample,
} from "@/lib/speech-metrics";
import { computeRms, detectPitch } from "@/lib/audio-analysis";
import { createSpeechSession } from "@/services/speech";

export type SpeechSessionStatus =
  | "idle"
  | "requesting-permission"
  | "connecting"
  | "recording"
  | "submitting"
  | "error";

const ANALYSIS_INTERVAL_MS = 150;
// Assumed baseline speaking rate used only to estimate how long a just-
// finalized chunk of speech probably took, so its words can be spread
// across a plausible time window. The browser's Speech Recognition API
// gives us a finished phrase, not word-level timestamps — this is a
// reasonable approximation, not a measurement. See docs/architecture.md.
const ASSUMED_WORDS_PER_SECOND = 2.5;
const FALLBACK_WORD_CONFIDENCE = 0.85;

// Minimal ambient types for the (non-standardized, WebKit-prefixed) Web
// Speech API — not part of TypeScript's default DOM lib.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechSession(mode: string, promptText?: string) {
  const router = useRouter();

  const [status, setStatus] = useState<SpeechSessionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [interimText, setInterimText] = useState("");
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveFillerCount, setLiveFillerCount] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldBeRecordingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastChunkEndMsRef = useRef(0);
  const finalWordsRef = useRef<WordTimestamp[]>([]);
  const pitchSamplesRef = useRef<AudioSample[]>([]);
  const volumeSamplesRef = useRef<AudioSample[]>([]);

  const cleanup = useCallback(() => {
    shouldBeRecordingRef.current = false;

    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    analysisIntervalRef.current = null;
    timerIntervalRef.current = null;

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }
    recognitionRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    setErrorMessage(null);
    finalWordsRef.current = [];
    pitchSamplesRef.current = [];
    volumeSamplesRef.current = [];
    lastChunkEndMsRef.current = 0;
    setInterimText("");
    setLiveWpm(0);
    setLiveFillerCount(0);
    setElapsedSeconds(0);

    const RecognitionCtor = getSpeechRecognitionConstructor();
    if (!RecognitionCtor) {
      setStatus("error");
      setErrorMessage(
        "Live speech recognition isn't supported in this browser — try Chrome or Edge.",
      );
      return;
    }

    try {
      setStatus("requesting-permission");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      setStatus("connecting");
      startTimeRef.current = Date.now();
      shouldBeRecordingRef.current = true;

      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const alt = result[0];
          if (!alt) continue;

          if (result.isFinal) {
            const words = alt.transcript.trim().split(/\s+/).filter(Boolean);
            if (words.length === 0) continue;

            const nowMs = Date.now() - startTimeRef.current;
            const estimatedDurationMs = (words.length / ASSUMED_WORDS_PER_SECOND) * 1000;
            const chunkStartMs = Math.max(lastChunkEndMsRef.current, nowMs - estimatedDurationMs);
            const chunkEndMs = nowMs;
            const span = chunkEndMs - chunkStartMs;
            const confidence = alt.confidence || FALLBACK_WORD_CONFIDENCE;

            const wordTimestamps: WordTimestamp[] = words.map((word, idx) => ({
              word,
              startMs: Math.round(chunkStartMs + (idx / words.length) * span),
              endMs: Math.round(chunkStartMs + ((idx + 1) / words.length) * span),
              confidence,
            }));

            finalWordsRef.current = [...finalWordsRef.current, ...wordTimestamps];
            lastChunkEndMsRef.current = chunkEndMs;
            setInterimText("");

            const elapsed = nowMs / 1000;
            setLiveWpm(calculateWpm(finalWordsRef.current, elapsed));
            setLiveFillerCount(detectFillerWords(finalWordsRef.current).length);
          } else {
            setInterimText(alt.transcript);
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        shouldBeRecordingRef.current = false;
        cleanup();
        setStatus("error");
        setErrorMessage(
          event.error === "not-allowed"
            ? "Microphone access was denied."
            : `Speech recognition error: ${event.error}`,
        );
      };

      // Some browsers end recognition after a pause even with continuous=true.
      // Restart automatically as long as the user hasn't clicked stop.
      recognition.onend = () => {
        if (shouldBeRecordingRef.current) recognition.start();
      };

      recognition.start();
      recognitionRef.current = recognition;

      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const timeDomainBuffer = new Float32Array(analyser.fftSize);

      analysisIntervalRef.current = setInterval(() => {
        analyser.getFloatTimeDomainData(timeDomainBuffer);
        const atMs = Date.now() - startTimeRef.current;
        volumeSamplesRef.current.push({ atMs, value: computeRms(timeDomainBuffer) });
        const pitch = detectPitch(timeDomainBuffer, audioContext.sampleRate);
        if (pitch > 0) pitchSamplesRef.current.push({ atMs, value: pitch });
      }, ANALYSIS_INTERVAL_MS);

      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      setStatus("recording");
    } catch (err) {
      cleanup();
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Couldn't start the recording session.",
      );
    }
  }, [cleanup]);

  const stop = useCallback(async () => {
    // Lock the UI immediately so a second click can't fire a concurrent
    // stop() while we're waiting below (the recording button stays visible/
    // enabled until status changes).
    setStatus("submitting");

    // Calling recognition.stop() doesn't finalize instantly — the browser
    // still needs to deliver one last onresult for whatever was mid-phrase
    // when the user clicked stop. Reading finalWordsRef before that arrives
    // silently drops the tail of the recording (often most of it, if the
    // user never paused). Wait for onend (fires after final results are
    // delivered) before touching finalWordsRef, with a timeout as a safety
    // net in case onend never fires for some reason.
    shouldBeRecordingRef.current = false;
    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = finish;
        recognition.stop();
      } else {
        finish();
      }
      setTimeout(finish, 1500);
    });

    const durationSeconds = Math.max(1, (Date.now() - startTimeRef.current) / 1000);

    // Fallback: some browsers can end a session without ever finalizing a
    // result (e.g. stopped almost immediately after starting). Rather than
    // silently submitting "no speech detected" when the user was clearly
    // seen talking (interim text existed), spread the last interim text
    // evenly across the recording as a last-resort estimate.
    if (finalWordsRef.current.length === 0 && interimText.trim()) {
      const words = interimText.trim().split(/\s+/).filter(Boolean);
      const spanMs = Math.max(1, Date.now() - startTimeRef.current);
      finalWordsRef.current = words.map((word, idx) => ({
        word,
        startMs: Math.round((idx / words.length) * spanMs),
        endMs: Math.round(((idx + 1) / words.length) * spanMs),
        confidence: FALLBACK_WORD_CONFIDENCE,
      }));
    }

    cleanup();

    try {
      const transcript = finalWordsRef.current.map((w) => w.word).join(" ");
      const { session } = await createSpeechSession({
        mode,
        promptText,
        transcript: transcript || "(no speech detected)",
        durationSeconds,
        wordTimestamps: finalWordsRef.current,
        pitchSamples: pitchSamplesRef.current,
        volumeSamples: volumeSamplesRef.current,
      });
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Couldn't save your session.",
      );
    }
  }, [cleanup, interimText, mode, promptText, router]);

  return {
    status,
    errorMessage,
    elapsedSeconds,
    liveTranscript: [finalWordsRef.current.map((w) => w.word).join(" "), interimText]
      .filter(Boolean)
      .join(" "),
    liveWpm,
    liveFillerCount,
    start,
    stop,
  };
}
