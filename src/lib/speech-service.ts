// src/lib/speech-service.ts
// Real Speech Recognition (Speech-to-Text) and Speech Synthesis (Text-to-Speech)
// using standard browser Web Speech APIs with graceful error handling and fallbacks.

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultItem;
    isFinal?: boolean;
  };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as IWindowSpeechRecognition;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.speechSynthesis !== "undefined";
}

export interface SpeechRecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string) => void;
  onEnd: () => void;
  lang?: string;
}

export interface SpeechRecognitionController {
  stop: () => void;
  abort: () => void;
}

/**
 * Initiates real browser speech recognition with streaming interim results.
 */
export function startSpeechRecognition(
  callbacks: SpeechRecognitionCallbacks
): SpeechRecognitionController | null {
  if (!isSpeechRecognitionSupported()) {
    callbacks.onError("Speech recognition is not supported in this browser. Please use keyboard input.");
    return null;
  }

  const win = window as IWindowSpeechRecognition;
  const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!SpeechRecognitionClass) {
    callbacks.onError("Speech recognition constructor unavailable.");
    return null;
  }

  try {
    const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = callbacks.lang || "en-IN"; // Default to English (India), supports Hinglish

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item && item[0]) {
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }
      }

      const text = finalTranscript || interimTranscript;
      callbacks.onResult(text, Boolean(finalTranscript));
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      let errorMsg = "Speech recognition error occurred.";
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          errorMsg = "Microphone access was denied. Please allow microphone permissions in your browser.";
          break;
        case "no-speech":
          errorMsg = "No speech detected. Please try speaking again.";
          break;
        case "audio-capture":
          errorMsg = "No microphone hardware was detected or microphone is currently busy.";
          break;
        case "network":
          errorMsg = "Network error occurred during speech processing.";
          break;
        case "aborted":
          // User or system intentionally cancelled
          callbacks.onEnd();
          return;
        default:
          errorMsg = `Voice recognition error: ${event.error || "unknown"}`;
      }
      callbacks.onError(errorMsg);
    };

    recognition.onend = () => {
      callbacks.onEnd();
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore already stopped errors
        }
      },
      abort: () => {
        try {
          recognition.abort();
        } catch {
          // ignore already aborted errors
        }
      },
    };
  } catch {
    callbacks.onError("Failed to initialize speech recognition engine.");
    return null;
  }
}

/**
 * Strips markdown symbols, code brackets, tables, bullet markers,
 * and tech noise so TTS reads natural, comfortable conversational sentences.
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return "";

  return raw
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove headers (# Header)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove blockquotes (> quote)
    .replace(/^>\s+/gm, "")
    // Remove bullet points / table pipes
    .replace(/^[-*•+]\s+/gm, "")
    .replace(/\|/g, " ")
    // Remove bold / italics
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Clean up multiple spaces and empty lines
    .replace(/\n\s*\n/g, ". ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface SpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Speaks visible answer text aloud using standard window.speechSynthesis.
 */
export function speakText(
  text: string,
  options?: SpeechSynthesisOptions
): boolean {
  if (!isSpeechSynthesisSupported()) {
    if (options?.onError) {
      options.onError("Speech synthesis is not supported on this browser.");
    }
    return false;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return false;

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options?.lang || "en-US";
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick best available natural voice matching language
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          (v.lang.startsWith("en") || v.lang.startsWith("hi")) &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("Siri") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel"))
      );
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    utterance.onstart = () => {
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      if (options?.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    if (options?.onError) options.onError(err);
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

export interface FemaleVoiceDetectionResult {
  voice: SpeechSynthesisVoice | null;
  voiceName: string | null;
  isFemale: boolean;
  isNatural: boolean;
  reason?: string;
}

/**
 * Robustly retrieves available SpeechSynthesis voices, handling both
 * immediate cache and asynchronous `voiceschanged` event delivery.
 */
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      resolve(immediate);
      return;
    }

    let resolved = false;
    const onVoicesChanged = () => {
      if (resolved) return;
      resolved = true;
      try {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      } catch {
        // ignore
      }
      resolve(window.speechSynthesis.getVoices() || []);
    };

    try {
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    } catch {
      // ignore
    }

    // Timeout fallback after 350ms if voiceschanged doesn't fire
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(window.speechSynthesis.getVoices() || []);
      }
    }, 350);
  });
}

/**
 * Selects the best natural-sounding English female voice from available browser voices.
 * Strictly avoids male voices and avoids robotic fallbacks.
 */
export function findBestEnglishFemaleVoice(voices: SpeechSynthesisVoice[]): FemaleVoiceDetectionResult {
  if (!voices || voices.length === 0) {
    return {
      voice: null,
      voiceName: null,
      isFemale: false,
      isNatural: false,
      reason: "No SpeechSynthesis voices are installed or exposed by the browser environment.",
    };
  }

  // Known female identifiers in voice names
  const femaleKeywords = [
    "jenny",
    "aria",
    "sonia",
    "samantha",
    "victoria",
    "karen",
    "zira",
    "serena",
    "fiona",
    "tessa",
    "moira",
    "ava",
    "allison",
    "susan",
    "stephanie",
    "veena",
    "neerja",
    "swara",
    "heera",
    "hazel",
    "catherine",
    "clara",
    "emma",
    "olivia",
    "sofia",
    "mia",
    "female",
    "woman",
  ];

  // Explicit male identifiers to reject
  const maleKeywords = [
    "david",
    "mark",
    "george",
    "guy",
    "ravi",
    "prabhat",
    "daniel",
    "alex",
    "fred",
    "bruce",
    "junior",
    "ralph",
    "albert",
    "tom",
    "oliver",
    "male",
    "man",
  ];

  // Filter English voices
  const englishVoices = voices.filter((v) => {
    const lang = (v.lang || "").toLowerCase();
    return lang.startsWith("en");
  });

  if (englishVoices.length === 0) {
    return {
      voice: null,
      voiceName: null,
      isFemale: false,
      isNatural: false,
      reason: "No English voices are installed in the browser SpeechSynthesis engine.",
    };
  }

  const isMale = (name: string) => {
    const lower = name.toLowerCase();
    return maleKeywords.some((m) => lower.includes(m));
  };

  const isFemale = (name: string) => {
    const lower = name.toLowerCase();
    if (isMale(name)) return false;
    if (femaleKeywords.some((f) => lower.includes(f))) return true;
    if (lower === "google us english" || lower === "google uk english female") return true;
    return false;
  };

  // Tier 1: Natural / Online high-fidelity English female voices (e.g. Edge Natural, Chrome Google)
  const tier1 = englishVoices.find(
    (v) =>
      isFemale(v.name) &&
      (v.name.includes("Natural") ||
        v.name.includes("Online") ||
        v.name.includes("Jenny") ||
        v.name.includes("Aria") ||
        v.name.includes("Sonia") ||
        v.name.includes("Google"))
  );
  if (tier1) {
    return {
      voice: tier1,
      voiceName: tier1.name,
      isFemale: true,
      isNatural: true,
    };
  }

  // Tier 2: Standard desktop English female voices (e.g. Microsoft Zira, Samantha, Victoria, Karen)
  const tier2 = englishVoices.find((v) => isFemale(v.name));
  if (tier2) {
    return {
      voice: tier2,
      voiceName: tier2.name,
      isFemale: true,
      isNatural: tier2.name.includes("Zira") || tier2.name.includes("Samantha"),
    };
  }

  // No suitable English female voice found. Never fall back to a male voice!
  return {
    voice: null,
    voiceName: null,
    isFemale: false,
    isNatural: false,
    reason: `English voices are present (${englishVoices.map((v) => v.name).join(", ")}), but none match verified female characteristics.`,
  };
}

export interface WelcomeVoiceOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export interface WelcomeVoiceResult {
  played: boolean;
  voiceName: string | null;
  isFemale: boolean;
  error?: string;
  autoplayBlocked?: boolean;
}

/**
 * Plays the opening spoken welcome: "Welcome to DebtTrap Escape."
 * using the best available natural English female voice.
 */
export async function playWelcomeVoice(
  options?: WelcomeVoiceOptions
): Promise<WelcomeVoiceResult> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return {
      played: false,
      voiceName: null,
      isFemale: false,
      error: "Speech synthesis API unavailable in this browser environment.",
    };
  }

  // Stop any ongoing speech
  stopSpeaking();

  const voices = await getAvailableVoices();
  const detection = findBestEnglishFemaleVoice(voices);

  if (!detection.voice) {
    return {
      played: false,
      voiceName: null,
      isFemale: false,
      error: detection.reason || "No suitable natural English female voice available.",
    };
  }

  try {
    const utterance = new SpeechSynthesisUtterance("Welcome to DebtTrap Escape.");
    utterance.voice = detection.voice;
    utterance.lang = detection.voice.lang || "en-US";
    utterance.pitch = 1.05; // Warm, natural female pitch
    utterance.rate = 0.96; // Elegant, measured cadence

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      options?.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);

    return {
      played: true,
      voiceName: detection.voiceName,
      isFemale: true,
    };
  } catch (err) {
    return {
      played: false,
      voiceName: detection.voiceName,
      isFemale: true,
      error: err instanceof Error ? err.message : "Speech playback failed.",
      autoplayBlocked: true,
    };
  }
}
