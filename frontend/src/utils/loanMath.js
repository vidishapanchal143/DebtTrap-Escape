/**
 * DebtTrap Shield — Loan Math Engine
 * All calculations are deterministic local code. Never call Gemini for arithmetic.
 *
 * Formulas:
 *   totalCost    = totalRepayment - amountReceived
 *   costPercent  = (totalCost / amountReceived) * 100
 *   annualized   = (totalCost / amountReceived) * (365 / tenureDays) * 100
 *                  — simple illustration only, NOT official APR
 */

export const MAX_LOAN_AMOUNT = 1000000000; // ₹100 Crore / 1 Billion INR
export const MAX_TENURE_DAYS = 10950;      // 30 years (30 * 365)
export const MIN_TENURE_DAYS = 1;

/**
 * Format a number as Indian currency with ₹ symbol.
 * Uses en-IN locale for Indian grouping (e.g. 1,00,000).
 */
export function formatINR(amount) {
  if (amount == null || isNaN(amount)) return '₹—';
  const rounded = Math.round(Number(amount));
  if (rounded < 0) {
    return '-₹' + Math.abs(rounded).toLocaleString('en-IN');
  }
  return '₹' + rounded.toLocaleString('en-IN');
}

/**
 * Format a percentage to 1 decimal place.
 */
export function formatPct(pct) {
  if (pct == null || isNaN(pct)) return '—%';
  return Number(pct).toFixed(1) + '%';
}

/**
 * Validate offer input fields.
 * Returns an object { field: errorKey } for any invalid field.
 */
export function validateOffer(data, t = {}) {
  const errors = {};

  const rawReceived = data.amountReceived;
  const rawRepay = data.totalRepayment;
  const rawDays = data.tenureDays;

  // Amount Received
  if (rawReceived === undefined || rawReceived === null || String(rawReceived).trim() === '') {
    errors.amountReceived = t.errRequired || 'This field is required.';
  } else {
    const received = Number(rawReceived);
    if (isNaN(received) || !isFinite(received)) {
      errors.amountReceived = t.errInvalidNumber || 'Please enter a valid numeric value.';
    } else if (received <= 0) {
      errors.amountReceived = (t.errRequired ? t.errRequired + ' ' : '') + (t.errPositive || 'Must be a positive number.');
    } else if (received > MAX_LOAN_AMOUNT) {
      errors.amountReceived = t.errAmountMax || 'Amount exceeds valid loan limit (maximum ₹100 Crores). Please check the entered number.';
    }
  }

  // Total Repayment
  if (rawRepay === undefined || rawRepay === null || String(rawRepay).trim() === '') {
    errors.totalRepayment = t.errRequired || 'This field is required.';
  } else {
    const repay = Number(rawRepay);
    if (isNaN(repay) || !isFinite(repay)) {
      errors.totalRepayment = t.errInvalidNumber || 'Please enter a valid numeric value.';
    } else if (repay <= 0) {
      errors.totalRepayment = (t.errRequired ? t.errRequired + ' ' : '') + (t.errPositive || 'Must be a positive number.');
    } else if (repay > MAX_LOAN_AMOUNT) {
      errors.totalRepayment = t.errAmountMax || 'Total repayment exceeds valid loan limit (maximum ₹100 Crores). Please check the entered number.';
    } else if (!errors.amountReceived) {
      const received = Number(rawReceived);
      if (repay < received) {
        errors.totalRepayment = t.errRepayGtReceived || 'Total repayment must be at least as large as the amount received.';
      }
    }
  }

  // Tenure Days
  if (rawDays === undefined || rawDays === null || String(rawDays).trim() === '') {
    errors.tenureDays = t.errRequired || 'This field is required.';
  } else {
    const days = Number(rawDays);
    if (isNaN(days) || !isFinite(days)) {
      errors.tenureDays = t.errInvalidNumber || 'Please enter a valid numeric value.';
    } else if (days < MIN_TENURE_DAYS) {
      errors.tenureDays = t.errTenurePositive || 'Tenure must be at least 1 day.';
    } else if (days > MAX_TENURE_DAYS) {
      errors.tenureDays = t.errTenureMax || 'Tenure cannot exceed 10,950 days (30 years). If entered in months, please convert to days.';
    }
  }

  // Optional Interest
  if (data.interest != null && String(data.interest).trim() !== '') {
    const interest = Number(data.interest);
    if (isNaN(interest) || interest < 0) {
      errors.interest = t.errPositive || 'Must be a positive number.';
    }
  }

  // Optional Fees
  if (data.fees != null && String(data.fees).trim() !== '') {
    const fees = Number(data.fees);
    if (isNaN(fees) || fees < 0) {
      errors.fees = t.errPositive || 'Must be a positive number.';
    }
  }

  return errors;
}

/**
 * Calculate all cost metrics from confirmed offer data.
 * @param {object} offer - { amountReceived, totalRepayment, tenureDays, interest?, fees? }
 * @returns {object} result with all derived values
 */
export function calculateCost(offer) {
  const received = Math.max(0, Number(offer.amountReceived) || 0);
  const repay = Math.max(0, Number(offer.totalRepayment) || 0);
  const days = Math.max(1, Number(offer.tenureDays) || 1);
  const interest = offer.interest != null && String(offer.interest).trim() !== '' ? Number(offer.interest) : null;
  const fees = offer.fees != null && String(offer.fees).trim() !== '' ? Number(offer.fees) : null;

  // Extra cost = Total Repayment - Amount Received
  const totalCost = Math.max(0, repay - received);

  // Percentage on base amount received
  const costPercent = received > 0 ? (totalCost / received) * 100 : 0;

  // Simple annualized illustration — NOT official APR
  const annualized = received > 0 && days > 0
    ? (totalCost / received) * (365 / days) * 100
    : null;

  // Check breakdown consistency
  let breakdownConsistent = null;
  if (interest !== null && fees !== null && !isNaN(interest) && !isNaN(fees)) {
    const breakdownTotal = interest + fees;
    breakdownConsistent = Math.abs(breakdownTotal - totalCost) < 1.0;
  }

  // Signal level — transparent rule
  let signalLevel; // 'high' | 'medium' | 'low'
  if (costPercent >= 30) signalLevel = 'high';
  else if (costPercent >= 15) signalLevel = 'medium';
  else signalLevel = 'low';

  // Bar widths (received vs extra)
  let receivedWidth = 50;
  let extraWidth = 50;
  if (repay > 0) {
    receivedWidth = Math.max(5, Math.min(95, Math.round((received / repay) * 100)));
    extraWidth = 100 - receivedWidth;
  }

  return {
    received,
    repay,
    days,
    totalCost,
    costPercent,
    annualized,
    interest,
    fees,
    breakdownConsistent,
    signalLevel,
    receivedWidth,
    extraWidth,
  };
}

/**
 * Build the plain-language explanation text for a given result.
 */
export function buildExplanation(result, t) {
  const { received, repay, days, totalCost, costPercent, interest, fees } = result;
  const lines = [];

  lines.push(`${t.extraCost}: ${formatINR(totalCost)} ${t.inDays.replace('{days}', days)}.`);
  lines.push(`${formatPct(costPercent)} ${t.extraCostPct}.`);

  if (interest !== null && fees !== null) {
    lines.push(`${t.interestBreakdown}: ${formatINR(interest)}. ${t.feesBreakdown}: ${formatINR(fees)}.`);
  }

  return lines.join(' ');
}
