// A small, consistent audio signature for confirming deliberate actions.
// The context is created only after a user gesture; no audio file or API is needed.
let audioContext;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function note(ctx, frequency, startAt, duration, peak = 0.035, type = 'sine') {
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  envelope.gain.setValueAtTime(0.0001, startAt);
  envelope.gain.exponentialRampToValueAtTime(peak, startAt + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(envelope);
  envelope.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.01);
}

export function playSound(name = 'click') {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime + 0.004;

    // Every cue shares a warm, rounded timbre: a tiny tick, a rising transition,
    // or a calm three-note resolution. It confirms progress without startling.
    if (name === 'advance' || name === 'next') {
      note(ctx, 440, now, 0.075, 0.04);
      note(ctx, 587.33, now + 0.055, 0.105, 0.035);
    } else if (name === 'complete') {
      note(ctx, 523.25, now, 0.12, 0.036);
      note(ctx, 659.25, now + 0.055, 0.14, 0.033);
      note(ctx, 783.99, now + 0.11, 0.18, 0.028);
    } else if (name === 'error') {
      note(ctx, 246.94, now, 0.11, 0.035, 'triangle');
    } else {
      note(ctx, 493.88, now, 0.055, 0.04);
      note(ctx, 659.25, now + 0.022, 0.07, 0.025);
    }
  } catch {
    // Audio is progressive enhancement; actions still work if the browser blocks it.
  }
}
