import React, { useState } from 'react';
import { ArrowRight, AudioLines, Check, Clipboard, HeartHandshake, ShieldAlert, ShieldCheck } from 'lucide-react';
import { speak, isSpeechSupported } from '../utils/speech';

export default function Screen7Harassment({ t, lang = 'en', onProceed }) {
  const [needsHelp, setNeedsHelp] = useState(null);
  const [draft, setDraft] = useState(() => t.draftDefault);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopyDraft = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(draft);
      else {
        const el = document.createElement('textarea');
        el.value = draft;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        const success = document.execCommand('copy');
        document.body.removeChild(el);
        if (!success) throw new Error('Copy failed');
      }
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopyError(true);
      setCopied(false);
    }
  };

  return (
    <div className="fade-in harassment-screen">
      <div className="screen-intro">
        <span className="screen-eyebrow"><HeartHandshake size={15} /> {t.supportEyebrow || 'SUPPORT WITHOUT JUDGEMENT'}</span>
        <h1 className="card-title">{t.s7Title}</h1>
        <p>{t.supportIntro || 'You can get help at your own pace. Nothing here contacts anyone for you.'}</p>
      </div>
      <section className="support-workspace" aria-label={t.s7Title}>

      <section className="support-question-card">
        <div className="support-question-icon"><ShieldAlert size={23} /></div>
        <div><p className="support-question-label">{t.supportCheckLabel || 'A QUICK CHECK-IN'}</p><h2>{t.harassQuestion}</h2></div>
        {isSpeechSupported() && <button className="voice-icon-button" onClick={() => speak(t.harassQuestion, lang)} aria-label={t.speakExplanation} data-sfx="none" type="button"><AudioLines size={18} /></button>}
      </section>

      <div className="support-choice-grid" role="group" aria-label={t.harassQuestion}>
        <button className={`support-choice${needsHelp === true ? ' is-selected' : ''}`} onClick={() => setNeedsHelp(true)} aria-pressed={needsHelp === true} type="button"><span className="choice-indicator">{needsHelp === true ? <Check size={16} /> : <ShieldAlert size={16} />}</span><span><strong>{t.harassYes}</strong><small>{t.supportYesHint || 'Show me practical support'}</small></span><ArrowRight size={16} /></button>
        <button className={`support-choice${needsHelp === false ? ' is-selected' : ''}`} onClick={() => setNeedsHelp(false)} aria-pressed={needsHelp === false} type="button"><span className="choice-indicator safe"><Check size={16} /></span><span><strong>{t.harassNo}</strong><small>{t.supportNoHint || 'Continue to my summary'}</small></span><ArrowRight size={16} /></button>
      </div>

      {needsHelp === true && (
        <section className="help-kit fade-in">
          <div className="emergency-notice"><ShieldAlert size={18} /><p>{t.harassEmergency}<br /><strong>{t.youAreNotAlone || 'You deserve to feel safe. This is not your fault.'}</strong></p></div>
          <div className="draft-card">
            <div className="draft-card-heading"><div><h2>{t.draftTitle}</h2><p>{t.draftNote}</p></div><span className="local-only-chip"><ShieldCheck size={13} /> {t.localOnly || 'Stays on this device'}</span></div>
            <label htmlFor="complaint-draft" className="sr-only">{t.draftTitle}</label>
            <textarea id="complaint-draft" value={draft} onChange={event => setDraft(event.target.value)} className="complaint-draft-area" rows={9} />
            <div className="draft-controls"><button className="btn btn-primary" onClick={handleCopyDraft} data-sfx="complete" type="button">{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? t.copySuccess : t.copyDraft}</button>{copyError && <p className="copy-inline-error" role="alert">{t.copyError}</p>}</div>
          </div>
        </section>
      )}

      {needsHelp === false && <div className="support-safe-message fade-in"><HeartHandshake size={20} /><p>{t.supportSafeMessage || 'Thanks for checking in. You can review your loan summary now.'}</p></div>}

      <div className="nav-row support-nav">
        <button className="btn btn-primary btn-lg" onClick={onProceed} data-sfx="advance" type="button">{needsHelp === true ? (t.continueSummary || 'Continue to summary') : (t.continueSummary || 'Continue to summary')} <ArrowRight size={18} /></button>
        {needsHelp === null && <p className="support-skip-note">{t.supportOptional || 'This step is optional. Continue whenever you are ready.'}</p>}
      </div>
      </section>
    </div>
  );
}
