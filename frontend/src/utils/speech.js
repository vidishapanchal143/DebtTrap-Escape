/**
 * Browser Speech Synthesis helpers.
 * Returns graceful fallback if voices unavailable.
 */

const langVoiceMap = {
  en: ['en-IN', 'en-US', 'en-GB'],
  hi: ['hi-IN'],
  gu: ['gu-IN'],
};

function findVoice(lang) {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefs = langVoiceMap[lang] || ['en-IN', 'en-US'];
  for (const pref of prefs) {
    const v = voices.find(v => v.lang.startsWith(pref.slice(0, 5)));
    if (v) return v;
  }
  return voices[0] || null;
}

export function speak(text, lang, onEnd, onError) {
  if (!window.speechSynthesis) {
    onError && onError('not_supported');
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voice = findVoice(lang);
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  } else {
    utter.lang = langVoiceMap[lang]?.[0] || 'en-IN';
  }
  utter.rate = 0.9;
  utter.onend = () => onEnd && onEnd();
  utter.onerror = () => onError && onError('error');
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

export function isSpeechSupported() {
  return !!window.speechSynthesis;
}
