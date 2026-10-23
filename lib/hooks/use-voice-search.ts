"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechAlternative = { transcript: string; confidence: number };
type SpeechResult = { isFinal: boolean; length: number; [index: number]: SpeechAlternative };
type SpeechResultList = { length: number; [index: number]: SpeechResult };

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechResultList;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
  message?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type VoiceSearchOptions = {
  onResult: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
  lang?: string;
};

const ERROR_COPY: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser settings and try again.",
  "service-not-allowed": "Voice search is blocked by this browser.",
  "audio-capture": "No microphone was found. Check your device and try again.",
  "no-speech": "I didn't hear anything. Tap the microphone and speak a little closer.",
  network: "Voice search needs a network connection in this browser.",
  aborted: "",
};

export function useVoiceSearch({ onResult, onInterim, lang = "en-US" }: VoiceSearchOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const resultRef = useRef(onResult);
  const interimRef = useRef(onInterim);

  useEffect(() => {
    resultRef.current = onResult;
    interimRef.current = onInterim;
  }, [onResult, onInterim]);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    const timer = window.setTimeout(() => {
      setSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    }, 0);
    return () => {
      window.clearTimeout(timer);
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (listening) {
      stop();
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      setError("Voice search is not supported in this browser. You can still type your search.");
      return;
    }

    setError(null);
    const recognition = new Constructor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      const copy = ERROR_COPY[event.error];
      if (copy) setError(copy);
      setListening(false);
    };
    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) final += transcript;
        else interim += transcript;
      }
      if (interim) interimRef.current?.(interim.trim());
      if (final.trim()) {
        resultRef.current(final.trim());
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError("Voice search could not start. Try again in a moment.");
      setListening(false);
    }
  }, [lang, listening, stop]);

  return {
    supported,
    listening,
    error,
    start,
    stop,
    clearError: () => setError(null),
  };
}
