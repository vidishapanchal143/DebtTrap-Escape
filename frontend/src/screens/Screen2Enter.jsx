import React, { useState, useRef } from 'react';
import { Check, LockKeyhole, ScanSearch, Sparkles } from 'lucide-react';
import { validateOffer } from '../utils/loanMath';

const SAMPLE_OFFER = {
  amountReceived: '5000',
  totalRepayment: '7400',
  tenureDays: '30',
  tenureMonths: '1',
  tenureUnit: 'days',
  interest: '1800',
  fees: '600',
};

const MAX_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

export default function Screen2Enter({ t, offer, setOffer, imageFile, setImageFile, onNext, onGeminiExtract, geminiStatus, onSampleLoad, sampleExample = false }) {
  const [errors, setErrors] = useState({});
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const fileRef = useRef();

  const tenureUnit = offer.tenureUnit || 'days';
  const liveReceived = Number(offer.amountReceived) || 0;
  const liveRepay = Number(offer.totalRepayment) || 0;
  const liveDays = Number(offer.tenureDays) || 0;
  const liveExtra = Math.max(0, liveRepay - liveReceived);
  const livePercent = liveReceived > 0 ? (liveExtra / liveReceived) * 100 : 0;
  const liveBarReceived = liveRepay > 0 ? Math.min(100, (liveReceived / liveRepay) * 100) : 0;

  function handleChange(field, value) {
    setOffer(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSampleLoaded(false);
    onSampleLoad?.(false);
  }

  function handleTenureUnitChange(newUnit) {
    if (newUnit === tenureUnit) return;
    setErrors(prev => ({ ...prev, tenureDays: undefined, tenureMonths: undefined }));
    if (newUnit === 'months') {
      const currentDays = Number(offer.tenureDays) || 0;
      const calculatedMonths = currentDays > 0 ? Math.max(1, Math.round(currentDays / 30)) : '';
      setOffer(prev => ({
        ...prev,
        tenureUnit: 'months',
        tenureMonths: prev.tenureMonths || (calculatedMonths ? String(calculatedMonths) : ''),
        tenureDays: prev.tenureDays || (calculatedMonths ? String(calculatedMonths * 30) : '')
      }));
    } else {
      const currentMonths = Number(offer.tenureMonths) || 0;
      const calculatedDays = currentMonths > 0 ? Math.round(currentMonths * 30) : '';
      setOffer(prev => ({
        ...prev,
        tenureUnit: 'days',
        tenureDays: prev.tenureDays || (calculatedDays ? String(calculatedDays) : '')
      }));
    }
  }

  function handleMonthsChange(value) {
    const monthsNum = parseFloat(value);
    const convertedDays = !isNaN(monthsNum) && monthsNum > 0 ? String(Math.round(monthsNum * 30)) : '';
    setOffer(prev => ({
      ...prev,
      tenureMonths: value,
      tenureDays: convertedDays,
      tenureUnit: 'months'
    }));
    setErrors(prev => ({ ...prev, tenureDays: undefined }));
    setSampleLoaded(false);
    onSampleLoad?.(false);
  }

  function useSample() {
    setOffer(SAMPLE_OFFER);
    setSampleLoaded(true);
    onSampleLoad?.(true);
    setErrors({});
  }

  function handleFile(file) {
    if (!file) return;
    onSampleLoad?.(false);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: t.errImageType })); return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrors(prev => ({ ...prev, image: t.errImageSize })); return;
    }
    setErrors(prev => ({ ...prev, image: undefined }));
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function validate() {
    const errs = validateOffer(offer, t);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  function handleGeminiClick() {
    if (!imageFile) return;
    setShowConsent(true);
  }

  function handleConsentProceed() {
    setShowConsent(false);
    onGeminiExtract(imageFile);
  }

  const field = (id, label, fieldName, hint, prefix = '₹', required = true) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--danger-text)' }}> *</span>}
      </label>
      <div className={prefix ? 'form-input-prefix' : ''}>
        {prefix && <span className="prefix" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="number"
          min="0"
          step="any"
          value={offer[fieldName] ?? ''}
          onChange={e => handleChange(fieldName, e.target.value)}
          className={`form-input${errors[fieldName] ? ' error' : ''}`}
          aria-describedby={errors[fieldName] ? `${id}-err` : `${id}-hint`}
          aria-required={required}
          aria-invalid={!!errors[fieldName]}
        />
      </div>
      {errors[fieldName]
        ? <p id={`${id}-err`} className="form-error" role="alert"><InfoIcon />{errors[fieldName]}</p>
        : hint && <p id={`${id}-hint`} className="form-hint">{hint}</p>
      }
    </div>
  );

  return (
    <div className="fade-in screen-entry">
      <div className="screen-intro"><span className="screen-eyebrow"><ScanSearch size={16} aria-hidden="true" /> {t.flowLabel || 'YOUR LOAN CHECK'}</span><h1 className="card-title">{t.s2Title}</h1><p>{t.uploadHint}</p></div>
      {sampleExample && <span className="sample-sticker review-sample">{t.sampleExample || 'Sample example'}</span>}

      <section className="entry-workspace" aria-label={t.s2Title}>
      {/* Sample offer button */}
      <button className="sample-offer-btn" onClick={useSample} id="sample-offer-btn" data-sfx="complete" type="button">
        <Sparkles size={18} aria-hidden="true" /> {t.useSample}
      </button>
      {sampleLoaded && <p className="alert alert-info mt-sm" role="status">{t.sampleLoaded}</p>}

      <div className="divider" />

      {/* Main form fields */}
      <div className="offer-entry-grid">
        {field('amount-received', t.amountReceivedLabel, 'amountReceived', t.amountReceivedHint)}
        {field('total-repayment', t.totalRepaymentLabel, 'totalRepayment', t.totalRepaymentHint)}
        
        {/* Tenure with Days / Months toggle */}
        <div className="form-group">
          <div className="tenure-label-row">
            <label className="form-label" htmlFor="tenure-days">
              {tenureUnit === 'months' ? `${t.unitMonths || 'Months'} (${t.tenureDaysLabel})` : t.tenureDaysLabel}
              <span aria-hidden="true" style={{ color: 'var(--danger-text)' }}> *</span>
            </label>
            <div className="tenure-unit-toggle" role="group" aria-label="Tenure unit">
              <button
                type="button"
                className={`unit-toggle-btn ${tenureUnit === 'days' ? 'active' : ''}`}
                onClick={() => handleTenureUnitChange('days')}
              >
                {t.unitDays || 'Days'}
              </button>
              <button
                type="button"
                className={`unit-toggle-btn ${tenureUnit === 'months' ? 'active' : ''}`}
                onClick={() => handleTenureUnitChange('months')}
              >
                {t.unitMonths || 'Months'}
              </button>
            </div>
          </div>

          {tenureUnit === 'months' ? (
            <input
              id="tenure-days"
              type="number"
              min="1"
              max="360"
              step="any"
              value={offer.tenureMonths ?? ''}
              onChange={e => handleMonthsChange(e.target.value)}
              className={`form-input${errors.tenureDays ? ' error' : ''}`}
              aria-describedby={errors.tenureDays ? 'tenure-err' : 'tenure-hint'}
              aria-required={true}
              aria-invalid={!!errors.tenureDays}
              placeholder="e.g. 12"
            />
          ) : (
            <input
              id="tenure-days"
              type="number"
              min="1"
              max="10950"
              step="any"
              value={offer.tenureDays ?? ''}
              onChange={e => handleChange('tenureDays', e.target.value)}
              className={`form-input${errors.tenureDays ? ' error' : ''}`}
              aria-describedby={errors.tenureDays ? 'tenure-err' : 'tenure-hint'}
              aria-required={true}
              aria-invalid={!!errors.tenureDays}
              placeholder="e.g. 30"
            />
          )}

          {errors.tenureDays ? (
            <p id="tenure-err" className="form-error" role="alert"><InfoIcon />{errors.tenureDays}</p>
          ) : (
            <p id="tenure-hint" className="form-hint">
              {tenureUnit === 'months' && offer.tenureMonths
                ? `${offer.tenureMonths} ${t.unitMonths || 'months'} = ${Number(offer.tenureDays || 0).toLocaleString('en-IN')} ${t.unitDays || 'days'}`
                : tenureUnit === 'days' && Number(offer.tenureDays) >= 30
                ? `${offer.tenureDays} ${t.unitDays || 'days'} ≈ ${(Number(offer.tenureDays) / 30).toFixed(1)} ${t.unitMonths || 'months'}`
                : t.tenureDaysHint}
            </p>
          )}
        </div>
      </div>

      {(liveReceived > 0 || liveRepay > 0) && (
        <section className="live-estimate" aria-live="polite" aria-label={t.liveCheckTitle}>
          <div className="live-estimate-head">
            <div><span className="live-estimate-kicker">{t.liveCheckEyebrow}</span><h2>{t.liveCheckTitle}</h2></div>
            <span className="live-pulse"><i /> {t.liveUpdating}</span>
          </div>
          {liveReceived > 0 && liveRepay > 0 && liveRepay >= liveReceived ? (
            <>
              <div className="live-estimate-main"><div><span>{t.liveExtraLabel}</span><strong>₹{liveExtra.toLocaleString('en-IN')}</strong></div><p>{livePercent.toFixed(0)}% <span>{t.liveOfReceived}</span></p></div>
              <div className="live-cost-bar" role="img" aria-label={`${liveBarReceived.toFixed(0)} percent received, ${(100 - liveBarReceived).toFixed(0)} percent extra cost`}><span className="live-cost-received" style={{ width: `${liveBarReceived}%` }} /><span className="live-cost-extra" style={{ width: `${100 - liveBarReceived}%` }} /></div>
              <div className="live-estimate-foot"><span><i className="legend-received" /> {t.receive}: ₹{liveReceived.toLocaleString('en-IN')}</span><span><i className="legend-extra" /> {t.repay}: ₹{liveRepay.toLocaleString('en-IN')}</span>{liveDays > 0 && <span className="live-daily">≈ ₹{Math.round(liveExtra / liveDays).toLocaleString('en-IN')} {t.liveExtraPerDay}</span>}</div>
            </>
          ) : <p className="live-empty-hint">{t.liveCheckHint}</p>}
        </section>
      )}

      {/* Optional breakdown */}
      <details className="optional-breakdown">
        <summary className="form-label">
          {t.interestLabel.replace(' — optional', '')} / {t.feesLabel.replace(' — optional', '')} (optional)
        </summary>
        <div className="offer-entry-grid optional-fields">
          {field('interest-amt', t.interestLabel, 'interest', t.interestHint, '₹', false)}
          {field('fees-amt', t.feesLabel, 'fees', t.feesHint, '₹', false)}
        </div>
        <p className="alert alert-warn mt-sm"><InfoIcon /> {t.breakdownNote}</p>
      </details>

      <div className="divider" />

      {/* Image upload */}
      <div className="form-group upload-form">
        <label className="form-label" htmlFor="offer-upload">{t.uploadLabel}</label>
        <div
          className={`image-upload-zone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
          aria-label={t.uploadLabel}
        >
          {imagePreviewUrl ? (
            <>
              <img src={imagePreviewUrl} alt="Loan offer preview" className="image-preview" />
              <div className="image-preview-actions">
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} type="button">{t.uploadChange}</button>
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreviewUrl(null); }} type="button">{t.uploadRemove}</button>
              </div>
            </>
          ) : (
            <div className="upload-prompt">
              <span className="upload-icon-sticker"><UploadIcon /></span>
              <p>{t.uploadHint}</p>
              <strong>{t.uploadLabel}</strong>
            </div>
          )}
        </div>
        <input id="offer-upload" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleFile(e.target.files[0])} className="sr-only" tabIndex={-1} />
        {errors.image && <p className="form-error" role="alert"><InfoIcon />{errors.image}</p>}
      </div>

      {/* Gemini / manual choice */}
      {imageFile && !showConsent && (
        <div className="upload-actions">
          <button className="btn btn-navy" onClick={handleGeminiClick} type="button" id="read-gemini-btn" disabled={geminiStatus === 'loading'}>
            {geminiStatus === 'loading' ? <><ScanSearch size={18} /> Reading…</> : <><Sparkles size={18} /> {t.readWithGemini}</>}
          </button>
          <button className="btn btn-ghost" onClick={() => { setImageFile(null); setImagePreviewUrl(null); }} type="button">{t.enterManually}</button>
        </div>
      )}

      {geminiStatus === 'loading' && (
        <section className="reading-progress" aria-live="polite" aria-busy="true">
          <h2><ScanSearch size={18} aria-hidden="true" /> {t.readingTitle || 'Reading your offer'}</h2>
          <ul>
            <li><Check size={17} aria-hidden="true" /> {t.readingReceived || 'Image received with your permission'}</li>
            <li><ScanSearch size={17} aria-hidden="true" /> {t.readingAmount || 'Looking for the amount and repayment'}</li>
            <li><span aria-hidden="true">3</span> {t.readingFees || 'Checking dates and any listed fees'}</li>
          </ul>
        </section>
      )}

      {/* Gemini consent modal */}
      {showConsent && (
        <div className="gemini-consent-box fade-in" role="dialog" aria-labelledby="consent-title" aria-modal="true">
          <div className="gemini-consent-title" id="consent-title"><LockKeyhole size={20} aria-hidden="true" /> {t.geminiConsentTitle}</div>
          <p className="gemini-consent-notice">{t.geminiConsentNotice}</p>
          <div className="consent-actions">
            <button className="btn btn-primary" onClick={handleConsentProceed} id="consent-proceed-btn">{t.geminiConsentProceed}</button>
            <button className="btn btn-ghost" onClick={() => setShowConsent(false)}>{t.geminiConsentCancel}</button>
          </div>
        </div>
      )}

      {/* Gemini error */}
      {geminiStatus?.startsWith('error:') && (
        <p className="alert alert-error mt-md" role="alert">{geminiStatus.slice(6)}</p>
      )}

      <div className="nav-row">
        <button className="btn btn-primary btn-full" onClick={handleNext} id="next-review-btn">{t.nextReview} →</button>
      </div>
      </section>
    </div>
  );
}
