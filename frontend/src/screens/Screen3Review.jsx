import React, { useState } from 'react';
import { formatINR, validateOffer } from '../utils/loanMath';

export default function Screen3Review({ t, offer, setOffer, onNext, sampleExample = false, onOfferEdit }) {
  const [errors, setErrors] = useState({});
  const tenureUnit = offer.tenureUnit || 'days';

  function handleChange(fieldKey, value) {
    setOffer(prev => ({ ...prev, [fieldKey]: value }));
    setErrors(prev => ({ ...prev, [fieldKey]: undefined }));
    onOfferEdit?.();
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
    onOfferEdit?.();
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
    onOfferEdit?.();
  }

  function validate() {
    const errs = validateOffer(offer, t);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleProceed() {
    if (validate()) onNext();
  }

  const field = (id, label, fieldKey, hint, prefix = '₹') => (
    <div className="form-group" key={id}>
      <label htmlFor={id} className="form-label">{label}</label>
      <div className={prefix ? 'form-input-prefix' : ''}>
        {prefix && <span className="prefix" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="number"
          min="0"
          step="any"
          value={offer[fieldKey] ?? ''}
          onChange={e => handleChange(fieldKey, e.target.value)}
          className={`form-input${errors[fieldKey] ? ' error' : ''}`}
          aria-invalid={!!errors[fieldKey]}
        />
      </div>
      {errors[fieldKey] && <p className="form-error" role="alert">{errors[fieldKey]}</p>}
    </div>
  );

  return (
    <div className="fade-in screen-review">
      <div className="screen-intro"><h1 className="card-title">{t.s3Title}</h1><p>{t.s3Subtitle}</p></div>
      <section className="review-workspace" aria-label={t.s3Title}>
      {sampleExample && <span className="sample-sticker review-sample">{t.sampleExample || 'Sample example'}</span>}
      <div className="offer-entry-grid">
        {field('amount-received', t.fieldAmountReceived, 'amountReceived')}
        {field('total-repayment', t.fieldTotalRepayment, 'totalRepayment')}

        {/* Tenure with Days / Months toggle */}
        <div className="form-group" key="tenure-days">
          <div className="tenure-label-row">
            <label htmlFor="tenure-days" className="form-label">
              {tenureUnit === 'months' ? `${t.unitMonths || 'Months'} (${t.fieldTenureDays})` : t.fieldTenureDays}
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
              aria-invalid={!!errors.tenureDays}
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
              aria-invalid={!!errors.tenureDays}
            />
          )}

          {errors.tenureDays ? (
            <p className="form-error" role="alert">{errors.tenureDays}</p>
          ) : (
            <p className="form-hint">
              {tenureUnit === 'months' && offer.tenureMonths
                ? `${offer.tenureMonths} ${t.unitMonths || 'months'} = ${Number(offer.tenureDays || 0).toLocaleString('en-IN')} ${t.unitDays || 'days'}`
                : tenureUnit === 'days' && Number(offer.tenureDays) >= 30
                ? `${offer.tenureDays} ${t.unitDays || 'days'} ≈ ${(Number(offer.tenureDays) / 30).toFixed(1)} ${t.unitMonths || 'months'}`
                : null}
            </p>
          )}
        </div>

        {field('interest-amt', t.fieldInterest, 'interest', null, '₹')}
        {field('fees-amt', t.fieldFees, 'fees', null, '₹')}
      </div>
      <div className="nav-row">
        <button className="btn btn-primary btn-full" onClick={handleProceed}>{t.calculateCost}</button>
      </div>
      </section>
    </div>
  );
}
