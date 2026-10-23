// src/lib/sound-effects.ts
// Subtle, professional UI sound effects synthesized via the Web Audio API.
// Audio is strictly optional, disabled by default, and never auto-played on page load.

export type SoundEffectType =
  | "task_accepted"
  | "task_completed"
  | "warning"
  | "mic_start"
  | "mic_stop";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

export function playSoundEffect(type: SoundEffectType, isMuted: boolean): void {
  if (isMuted || typeof window === "undefined") return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (type) {
    case "task_accepted": {
      // Gentle rising chime: 520Hz -> 680Hz (soft sine wave, ~150ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
      break;
    }

    case "task_completed": {
      // Harmonic two-note completion chime: E5 (659Hz) -> A5 (880Hz)
      const note1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      note1.type = "sine";
      note1.frequency.setValueAtTime(659.25, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.07, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      note1.connect(gain1);
      gain1.connect(ctx.destination);
      note1.start(now);
      note1.stop(now + 0.19);

      const note2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      note2.type = "sine";
      note2.frequency.setValueAtTime(880, now + 0.09);

      gain2.gain.setValueAtTime(0.001, now + 0.09);
      gain2.gain.linearRampToValueAtTime(0.08, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      note2.connect(gain2);
      gain2.connect(ctx.destination);
      note2.start(now + 0.09);
      note2.stop(now + 0.33);
      break;
    }

    case "warning": {
      // Gentle double soft notification: 440Hz -> 350Hz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(350, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
      break;
    }

    case "mic_start": {
      // Soft high chirp: 400Hz -> 580Hz (80ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.07);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }

    case "mic_stop": {
      // Soft low chirp: 580Hz -> 400Hz (80ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.07);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }
  }
}
