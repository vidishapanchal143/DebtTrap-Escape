import React, { useState } from 'react';
import { ArrowDownRight, ArrowRight, AudioLines, BadgeCheck, Check, CircleHelp, Eye, EyeOff, HandCoins, LockKeyhole, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { deleteAllAnalyses } from '../utils/storage';
import { formatINR } from '../utils/loanMath';

const LANGUAGES = [['en', 'English'], ['hi', 'हिन्दी'], ['gu', 'ગુજરાતી']];

export default function Screen1Welcome({ t, lang, setLang, largerText, setLargerText, highContrast, setHighContrast, soundPref, setSoundPref, onStart, onTryDemo, savedItems = [], setSavedItems, introFinished = true }) {
  const [selectedSlice, setSelectedSlice] = useState('extra');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [demoAmount, setDemoAmount] = useState(5000);
  const demoRepay = Math.round(demoAmount * 1.48);
  const demoExtra = demoRepay - demoAmount;
  const extraPercent = demoAmount ? Math.round((demoExtra / demoAmount) * 100) : 0;
  const receivedPercent = demoRepay ? (demoAmount / demoRepay) * 100 : 0;
  const selectedCopy = selectedSlice === 'extra'
    ? (t.welcomeCostNote || 'That is 48% extra on the amount received.').replace('48%', `${extraPercent}%`)
    : (t.welcomeReceivedNote || 'The amount shown is what reaches you. The rest is the cost of this 30-day loan.').replace('₹5,000', formatINR(demoAmount));

  const chooseSlice = (slice) => setSelectedSlice(slice);
  const tryCurrentSample = () => {
    const interest = Math.round(demoExtra * 0.75);
    onTryDemo({
      amountReceived: String(demoAmount),
      totalRepayment: String(demoRepay),
      tenureDays: '30',
      interest: String(interest),
      fees: String(demoExtra - interest),
    });
  };
  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteAllAnalyses();
    setSavedItems([]);
    setConfirmDelete(false);
  };

  return (
    <div className={`welcome-page fade-in ${introFinished ? 'is-revealed' : ''}`}>
      <section className="welcome-grid" aria-labelledby="welcome-headline">
        <div className="welcome-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />{t.welcomeEyebrow}</div>
          <h1 id="welcome-headline">{t.welcomeTitle}<span className="headline-sparkle"><Sparkles size={22} /></span></h1>
          <h2>{t.welcomePromise}</h2>
          <p className="welcome-lead">{t.welcomeLead}</p>
          <p className="welcome-for-whom">{t.welcomeForWhom}</p>

          <div className="welcome-hidden-costs" aria-label={t.welcomeChargesTitle}>
            <span>{t.welcomeChargesTitle}</span>
            <ul><li>{t.welcomeChargeFees}</li><li>{t.welcomeChargeInterest}</li><li>{t.welcomeChargeRepayment}</li></ul>
          </div>

          <div className="welcome-proof-row" aria-label={t.welcomeBenefitsLabel}>
            <span><BadgeCheck size={16} /> {t.welcomeBenefitFree}</span>
            <span><LockKeyhole size={15} /> {t.welcomeBenefitPrivate}</span>
            <span><AudioLines size={15} /> {t.welcomeBenefitVoice}</span>
          </div>

          <div className="welcome-actions">
            <button className="btn btn-primary btn-lg welcome-primary" onClick={onStart} id="start-btn" data-sfx="advance" type="button">
              <HandCoins size={19} /> {t.welcomeCta} <ArrowRight size={18} />
            </button>
            <button className="welcome-demo-link" onClick={tryCurrentSample} data-sfx="advance" type="button">
              {t.welcomeDemoCta} <ArrowDownRight size={16} />
            </button>
          </div>
          <p className="welcome-demo-foot"><Check size={14} /> {t.welcomeDemoFoot}</p>
        </div>

        <section className="offer-preview" aria-label={t.welcomeDemoTitle}>
          <div className="preview-orbit orbit-a" aria-hidden="true" />
          <div className="preview-orbit orbit-b" aria-hidden="true" />
          <div className="scan-toy" aria-hidden="true">
            <div className="toy-ticket"><span>OFFER</span><i /><i /><i /></div>
            <span className="toy-lens"><Search size={29} strokeWidth={2.2} /></span>
            <span className="toy-fee">₹?</span>
            <span className="toy-spark toy-spark-one" /><span className="toy-spark toy-spark-two" />
          </div>
          <div className="preview-card-head">

            <div><p className="preview-overline">{t.welcomeDemoTitle}</p><h2>{t.welcomeDemoSubtitle}</h2></div>
            <span className="preview-live"><span /> {t.welcomeSampleLabel || 'SAMPLE OFFER'}</span>
          </div>

          <div className="preview-amounts">
            <div className="preview-amount received"><span>{t.welcomeReceived}</span><strong>{formatINR(demoAmount)}</strong></div>
            <div className="preview-arrow"><ArrowRight size={19} /></div>
            <div className="preview-amount repay"><span>{t.welcomeRepay}</span><strong>{formatINR(demoRepay)}</strong></div>
          </div>

          <label className="demo-slider-label" htmlFor="demo-loan-amount"><span>{t.demoSliderLabel || 'Explore a sample amount'}</span><strong>{formatINR(demoAmount)}</strong></label>
          <input id="demo-loan-amount" className="demo-slider" type="range" min="5000" max="25000" step="1000" value={demoAmount} onChange={event => setDemoAmount(Number(event.target.value))} aria-label={t.demoSliderLabel || 'Explore a sample loan amount'} />
          <div className="demo-slider-ends"><span>₹5,000</span><span>₹25,000</span></div>

          <div className="preview-cost-block">
            <div className="preview-cost-head"><span>{t.welcomeExtra}</span><strong>+{formatINR(demoExtra)}</strong></div>
            <div className="preview-meter" role="group" aria-label={t.welcomeMeterLabel}>
              <button className={`meter-received${selectedSlice === 'received' ? ' selected' : ''}`} style={{ width: `${receivedPercent}%` }} onClick={() => chooseSlice('received')} aria-label={t.welcomeShowReceived} aria-pressed={selectedSlice === 'received'} type="button" />
              <button className={`meter-extra${selectedSlice === 'extra' ? ' selected' : ''}`} style={{ width: `${100 - receivedPercent}%` }} onClick={() => chooseSlice('extra')} aria-label={t.welcomeShowExtra} aria-pressed={selectedSlice === 'extra'} type="button" />
            </div>
            <div className="preview-legend"><button onClick={() => chooseSlice('received')} type="button"><i className="legend-received" />{t.welcomeReceived}</button><button onClick={() => chooseSlice('extra')} type="button"><i className="legend-extra" />{t.welcomeExtra}</button></div>
            <p className="preview-insight" aria-live="polite"><span className="insight-icon"><Eye size={15} /></span>{selectedCopy}</p>
          </div>

          <div className="preview-bottom-row"><span><span className="calendar-dot" /> {t.welcomeDays}</span><span className="preview-cost-pill">{extraPercent}% {t.welcomeCostPill?.replace('48% ', '') || 'extra cost'}</span></div>
          <button className="preview-try-btn" type="button" onClick={tryCurrentSample} data-sfx="advance">{t.welcomeSampleTip}<ArrowRight size={16} /></button>
        </section>
      </section>

      <section className="welcome-feature-strip" aria-label={t.welcomeWhyLabel}>
        <article className="welcome-feature"><div className="feature-icon teal"><LockKeyhole size={18} /></div><div><h3>{t.welcomeFeaturePrivacy}</h3><p>{t.welcomeFeaturePrivacyDetail}</p></div></article>
        <article className="welcome-feature"><div className="feature-icon blue"><Eye size={18} /></div><div><h3>{t.welcomeFeatureAccess}</h3><p>{t.welcomeFeatureAccessDetail}</p></div></article>
        <article className="welcome-feature"><div className="feature-icon amber"><CircleHelp size={18} /></div><div><h3>{t.welcomeFeatureAction}</h3><p>{t.welcomeFeatureActionDetail}</p></div></article>
      </section>

      <section className="welcome-controls" aria-label={t.welcomeSettingsTitle}>
        <div className="welcome-control-title"><span className="control-orb"><Sparkles size={17} /></span><div><p>{t.personalizeLabel || 'YOUR EXPERIENCE'}</p><h2>{t.welcomeSettingsTitle}</h2></div></div>
        <div className="welcome-control-group">
          <span className="preference-label">{t.welcomeLangLabel}</span>
          <div className="preference-options lang-options" role="group" aria-label={t.welcomeLangLabel}>
            {LANGUAGES.map(([code, label]) => <button key={code} className={`preference-chip${lang === code ? ' is-active' : ''}`} onClick={() => setLang(code)} aria-pressed={lang === code} type="button">{label}{lang === code && <Check size={14} />}</button>)}
          </div>
        </div>
        <div className="welcome-control-group">
          <span className="preference-label">{t.welcomeAccessibility}</span>
          <div className="preference-options">
            <button className={`preference-chip${largerText ? ' is-active' : ''}`} onClick={() => setLargerText(value => !value)} aria-pressed={largerText} type="button"><span>Aa</span>{t.btnLargerText}</button>
            <button className={`preference-chip${highContrast ? ' is-active' : ''}`} onClick={() => setHighContrast(value => !value)} aria-pressed={highContrast} type="button">{highContrast ? <Eye size={15} /> : <EyeOff size={15} />}{t.btnHighContrast}</button>
          </div>
        </div>
        <div className="welcome-control-group">
          <span className="preference-label">{t.welcomeSoundLabel || 'Sound'}</span>
          <div className="preference-options" role="group" aria-label={t.welcomeSoundLabel || 'Sound'}>
            <button className={`preference-chip${soundPref === 'on' ? ' is-active' : ''}`} onClick={() => setSoundPref('on')} aria-pressed={soundPref === 'on'} type="button">On</button>
            <button className={`preference-chip${soundPref === 'off' ? ' is-active' : ''}`} onClick={() => setSoundPref('off')} aria-pressed={soundPref === 'off'} type="button">Off</button>
          </div>
        </div>
      </section>

      {savedItems.length > 0 && (
        <details className="saved-analyses welcome-saved">
          <summary><span><ShieldCheck size={17} /> {t.savedHeader}</span><span className="saved-count">{savedItems.length}</span></summary>
          <div className="saved-list">
            {savedItems.map(item => <div className="saved-item" key={item.id}><div><strong>{formatINR(item.received)} <span>→</span> {formatINR(item.repay)}</strong><small>{new Date(item.savedAt).toLocaleDateString(lang === 'en' ? 'en-IN' : lang === 'hi' ? 'hi-IN' : 'gu-IN')}</small></div>{item.avoided && <span className="saved-avoided"><Check size={13} /> avoided</span>}</div>)}
            <button className="delete-saved-btn" onClick={handleDelete} type="button">{confirmDelete ? t.deleteAllConfirm : t.deleteAll}</button>
          </div>
        </details>
      )}
    </div>
  );
}
