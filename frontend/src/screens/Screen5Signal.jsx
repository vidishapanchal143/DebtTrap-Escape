import React from 'react';
import { ArrowRight, AudioLines, CircleCheck, CircleHelp, CircleStop, ShieldCheck } from 'lucide-react';
import { speak, isSpeechSupported } from '../utils/speech';

export default function Screen5Signal({ t, result, lang = 'en', onNext, onDecline, sampleExample = false }) {
  const { costPercent = 0 } = result || {};
  let signal = t.signalLow;
  let level = 'low';
  if (costPercent >= 30) { signal = t.signalHigh; level = 'high'; }
  else if (costPercent >= 15) { signal = t.signalMedium; level = 'medium'; }
  const icon = level === 'high' ? <CircleStop size={28} /> : level === 'medium' ? <CircleHelp size={28} /> : <CircleCheck size={28} />;
  const reasonOne = (t.signalReasonOne || 'The extra cost is {pct}% of the amount you receive.').replace('{pct}', costPercent.toFixed(0));
  const reasonTwo = (t.signalReasonTwo || 'You would repay {repay} in {days} days.').replace('{repay}', `₹${Number(result?.repay || 0).toLocaleString('en-IN')}`).replace('{days}', result?.days || 0);
  const signalLine = level === 'high' ? t.signalDangerLine : level === 'medium' ? t.signalMediumLine : t.signalLowLine;
  const spokenText = `${signal}. ${reasonOne} ${reasonTwo} ${t.signalNotFault}`;

  return (
    <div className={`fade-in signal-screen signal-${level}`}>
      <section className="verdict-lead">
        <div className="screen-intro">
          <span className="screen-eyebrow"><ShieldCheck size={15} /> {t.costSignalEyebrow || 'A SIMPLE COST SIGNAL'}</span>
          <h1 className="card-title">{t.s5Title}</h1>
          <p>{t.signalIntro || 'A clear signal can help you pause and compare. It is here to inform, never to blame.'}</p>
        </div>
        <section className={`signal-box signal-${level}`} aria-live="polite">
          <div className={`signal-emblem ${level}`}>{icon}</div>
          <div className="signal-content">
            <span className="signal-label">{t.signalLabel || 'COST SIGNAL'}</span>
            <h2 className={`signal-title ${level}`}>{signal}</h2>
            <p className="signal-percent">{costPercent.toFixed(0)}% {t.extraCostPct}</p>
          </div>
          <p className="signal-kindness">{signalLine || t.signalNotFault}</p>
        </section>
      </section>
      <section className="verdict-details" aria-label={t.signalReasonHeading || 'Why this needs a closer look'}>
        {sampleExample && <span className="sample-sticker review-sample">{t.sampleExample || 'Sample example'}</span>}
        <h2>{t.signalReasonHeading || 'Why this needs a closer look'}</h2>
        <ol className="signal-reasons">
          <li><span className="reason-number">01</span><span>{reasonOne}</span></li>
          <li><span className="reason-number">02</span><span>{reasonTwo}</span></li>
        </ol>
        <p className="signal-disclaimer"><CircleHelp size={16} /> {t.signalDisclaimer || 'This signal compares listed cost with the amount received. Other loan terms are not checked.'}</p>
        {isSpeechSupported() && <button className="btn btn-ghost voice-button signal-listen" onClick={() => speak(spokenText, lang)} data-sfx="none" type="button"><AudioLines size={17} /> {t.speakExplanation}</button>}
        <div className="nav-row signal-nav">
          <button className="btn btn-primary btn-lg" onClick={onNext} data-sfx="advance" type="button">{t.nextSteps}<ArrowRight size={18} /></button>
          <button className="btn btn-decline btn-lg" onClick={onDecline} data-sfx="advance" type="button"><CircleStop size={18} /> {t.avoidBtn}</button>
        </div>
      </section>
    </div>
  );
}
