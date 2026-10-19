import React, { useEffect, useState } from 'react';
import { ArrowRight, AudioLines, CalendarDays, ChevronDown, CircleHelp, IndianRupee, Sparkles } from 'lucide-react';
import { formatINR } from '../utils/loanMath';
import { speak, isSpeechSupported } from '../utils/speech';

export default function Screen4Result({ t, lang = 'en', result, onNext, sampleExample = false }) {
  const [showDaily, setShowDaily] = useState(false);
  const [countedRepay, setCountedRepay] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? (result?.repay ?? 0) : 0);
  const [spokenRepay, setSpokenRepay] = useState('');

  useEffect(() => {
    if (!result) return undefined;
    const { repay } = result;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setCountedRepay(repay);
      setSpokenRepay(formatINR(repay));
      return undefined;
    }
    let frame;
    const start = performance.now();
    const duration = 1200;
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCountedRepay(Math.round(repay * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setSpokenRepay(formatINR(repay));
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [result?.repay]);

  if (!result || !result.received || result.received <= 0) {
    return (
      <div className="result-screen fade-in">
        <section className="result-story">
          <div className="screen-intro">
            <h1 className="card-title">{t.s4Title || 'True Cost Result'}</h1>
            <p className="alert alert-error">{t.errInvalidNumber || 'No valid loan data found. Please enter valid loan details.'}</p>
          </div>
          <div className="nav-row result-nav">
            <button className="btn btn-primary" onClick={() => onNext?.(2)} type="button">
              ← {t.s2Title || 'Enter loan offer'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const { received, repay, days, totalCost, costPercent, annualized, interest, fees, breakdownConsistent, receivedWidth = 0, extraWidth = 0 } = result;
  const dailyCost = days > 0 ? totalCost / days : totalCost;
  const safeReceivedWidth = Math.max(0, Math.min(100, receivedWidth));
  const safeExtraWidth = Math.max(0, Math.min(100 - safeReceivedWidth, extraWidth || (100 - safeReceivedWidth)));
  const spokenSummary = `${(t.repayInDays || 'You repay in {days} days').replace('{days}', days)}. ${formatINR(received)} ${t.receive}. ${formatINR(repay)} ${t.repay}. ${costPercent.toFixed(0)}% ${t.extraCostPct}.`;

  return (
    <div className="result-screen fade-in">
      <section className="result-story">
        <div className="screen-intro">
          <span className="screen-eyebrow"><Sparkles size={15} aria-hidden="true" /> {t.trueCostEyebrow || 'THE REAL NUMBERS'}</span>
          <h1 className="card-title">{t.s4Title}</h1>
          <p>{t.trueCostIntro || 'Here is what this offer means in plain numbers.'}</p>
        </div>

        <div className="result-amount-block" aria-label={`Total repayment after ${days} days`}>
          <p className="cost-caption">{(t.repayInDays || 'You repay in {days} days').replace('{days}', days)}</p>
          <strong className="cost-hero-amount" id="true-cost-number" aria-hidden="true">
            <span className="currency-glyph">₹</span>{formatINR(countedRepay).replace(/^₹/, '')}
          </strong>
          <span className="sr-only" aria-live="polite">{spokenRepay}</span>
        </div>

        <p className="result-serif-line">{t.resultSerifLine || 'What you receive is only part of what you pay back.'}</p>
        <p className="cost-hero-story">
          <strong>{formatINR(received)}</strong> {t.receive?.toLowerCase()} <span aria-hidden="true">→</span> <strong>{t.repay?.toLowerCase()}</strong> {t.inDays?.replace('{days}', days)}
        </p>

        <div className="result-story-actions">
          {isSpeechSupported() && (
            <button
              className="btn btn-ghost voice-button"
              onClick={() => speak(spokenSummary, lang)}
              data-sfx="none"
              type="button"
              aria-label={t.speakExplanation || 'Listen to explanation'}
            >
              <AudioLines size={18} aria-hidden="true" />
              <span>{t.speakExplanation}</span>
            </button>
          )}
        </div>

        <div className="nav-row result-nav">
          <button className="btn btn-primary btn-lg" onClick={onNext} data-sfx="advance" type="button">
            <span>{t.continueToSignal || t.signalHigh}</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="result-receipt" aria-label={t.receiptTitle || 'Cost breakdown receipt'}>
        <div className="receipt-heading">
          <div>
            <span className="receipt-kicker">{t.trueCostEyebrow || 'THE REAL NUMBERS'}</span>
            <h2>{t.receiptTitle || 'Your repayment receipt'}</h2>
          </div>
          <span className="cost-days-chip">
            <CalendarDays size={15} aria-hidden="true" />
            <span>
              {days} {t.daysLabel || 'days'}
              {days >= 30 ? ` (≈${(days / 30).toFixed(days % 30 === 0 ? 0 : 1)} ${t.unitMonths || 'mo'})` : ''}
            </span>
          </span>
        </div>

        {sampleExample && <span className="sample-sticker">{t.sampleExample || 'Sample example'}</span>}

        <div className="cost-visual-bar" role="img" aria-label={`${safeReceivedWidth.toFixed(0)} percent of repayment is the amount received, ${safeExtraWidth.toFixed(0)} percent is extra cost`}>
          <div className="cost-bar-track">
            <span className="cost-bar-received" style={{ width: `${safeReceivedWidth}%` }} />
            <span className="cost-bar-extra" style={{ width: `${safeExtraWidth}%` }} />
          </div>
          <div className="cost-bar-labels">
            <span>{t.receive}: {safeReceivedWidth.toFixed(0)}%</span>
            <span>{t.extraCost}: {safeExtraWidth.toFixed(0)}%</span>
          </div>
        </div>

        <div className="cost-sticker">
          <Sparkles size={15} aria-hidden="true" /> +{formatINR(totalCost)} {t.hiddenCostLabel || 'hidden'}
        </div>

        <p className="cost-plain-line">
          {(t.extraInDays || '{pct}% extra in {days} days.').replace('{pct}', costPercent.toFixed(0)).replace('{days}', days)}
        </p>

        <button
          className="daily-toggle"
          type="button"
          aria-pressed={showDaily}
          onClick={() => setShowDaily(value => !value)}
        >
          <span>{showDaily ? (t.showTotal || 'Hide daily detail') : (t.showDaily || 'See per day')}</span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>

        {showDaily && (
          <p className="daily-cost-note">
            {(t.dailyCostLine || 'About {amount} extra each day.').replace('{amount}', formatINR(dailyCost))}
          </p>
        )}

        <div className="result-metrics">
          <div>
            <span>{t.receive}</span>
            <strong>{formatINR(received)}</strong>
          </div>
          <div className="metric-highlight">
            <span>{t.extraCost}</span>
            <strong>{formatINR(totalCost)}</strong>
            <small>{costPercent.toFixed(0)}% {t.extraCostPct}</small>
          </div>
          <div>
            <span>{t.repay}</span>
            <strong>{formatINR(repay)}</strong>
          </div>
        </div>

        {(interest != null && fees != null) && (
          <details className="result-details">
            <summary>
              <span><CircleHelp size={17} aria-hidden="true" /> {t.breakdownTitle || 'See what makes up the cost'}</span>
              <ChevronDown size={17} className="details-chevron" aria-hidden="true" />
            </summary>
            <div className="breakdown-content">
              <div className="breakdown-detail-row">
                <span>{t.interestBreakdown}</span>
                <strong>{formatINR(interest)}</strong>
              </div>
              <div className="breakdown-detail-row">
                <span>{t.feesBreakdown}</span>
                <strong>{formatINR(fees)}</strong>
              </div>
              <p className={`breakdown-status${breakdownConsistent ? ' is-good' : ' is-note'}`}>
                {breakdownConsistent ? t.breakdownConsistent : t.breakdownMismatch}
              </p>
            </div>
          </details>
        )}

        {annualized != null && (
          <p className="annualized-note">
            <strong>{t.annualizedLabel}: {annualized.toFixed(1)}%</strong>
            <span>{t.annualizedDisclaimer}</span>
          </p>
        )}

        <div className="result-reassurance">
          <span className="reassurance-mark"><CircleHelp size={17} aria-hidden="true" /></span>
          <p>{t.resultNoJudgement || 'These are the numbers based on the details entered. Check the full terms with the lender.'}</p>
        </div>
      </section>
    </div>
  );
}
