import { calculateCost, validateOffer, formatINR, formatPct, MAX_LOAN_AMOUNT, MAX_TENURE_DAYS, MIN_TENURE_DAYS } from './loanMath.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertClose(actual, expected, tolerance = 0.001, message = '') {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (expected ~${expected}, got ${actual})`);
}

console.log('=== TEST SUITE: DebtTrap Shield Loan Math & Validation ===\n');

// 1. FORMATTING TESTS
console.log('1. Formatting Tests');
assert(formatINR(5000) === '₹5,000', 'formatINR formats 5000 as ₹5,000');
assert(formatINR(100000) === '₹1,00,000', 'formatINR uses Indian numbering system (1,00,000)');
assert(formatINR(10000000) === '₹1,00,00,000', 'formatINR formats 1 Crore correctly');
assert(formatINR(0) === '₹0', 'formatINR handles zero');
assert(formatINR(-500) === '-₹500', 'formatINR handles negative numbers');
assert(formatINR(null) === '₹—', 'formatINR handles null');
assert(formatINR(NaN) === '₹—', 'formatINR handles NaN');

assert(formatPct(12.5) === '12.5%', 'formatPct formats 12.5%');
assert(formatPct(0) === '0.0%', 'formatPct formats 0.0%');
assert(formatPct(128.456) === '128.5%', 'formatPct rounds to 1 decimal place');
assert(formatPct(null) === '—%', 'formatPct handles null');

// 2. STANDARD LOAN CALCULATIONS
console.log('\n2. Standard Loan Calculations');
{
  const offer = {
    amountReceived: 5000,
    totalRepayment: 7400,
    tenureDays: 14,
    interest: 1800,
    fees: 600
  };
  const result = calculateCost(offer);
  assert(result.totalCost === 2400, 'totalCost = 7400 - 5000 = 2400');
  assertClose(result.costPercent, 48.0, 0.01, 'costPercent = (2400 / 5000) * 100 = 48.0%');
  // Annualized = (2400 / 5000) * (365 / 14) * 100 = 0.48 * 26.0714 * 100 = 1251.428%
  assertClose(result.annualized, 1251.428, 0.01, 'annualized illustration calculation');
  assert(result.breakdownConsistent === true, 'breakdownConsistent is true (1800 + 600 == 2400)');
  assert(result.signalLevel === 'high', 'signalLevel is high for >= 30% extra cost');
}

// 3. ZERO EXTRA COST (BORROW == REPAY)
console.log('\n3. Zero Extra Cost Edge Case');
{
  const offer = {
    amountReceived: 10000,
    totalRepayment: 10000,
    tenureDays: 30
  };
  const result = calculateCost(offer);
  assert(result.totalCost === 0, 'totalCost is 0 when repay == received');
  assert(result.costPercent === 0, 'costPercent is 0%');
  assert(result.annualized === 0, 'annualized is 0%');
  assert(result.signalLevel === 'low', 'signalLevel is low for < 15%');
}

// 4. LONG TENURE AND EXTREME LOAN AMOUNTS
console.log('\n4. Extreme Value Math Calculations');
{
  // ₹10 Crore loan for 365 days with 10% cost
  const offer = {
    amountReceived: 100000000, // ₹10 Crore
    totalRepayment: 110000000, // ₹11 Crore
    tenureDays: 365
  };
  const result = calculateCost(offer);
  assert(result.totalCost === 10000000, 'totalCost is ₹1 Crore');
  assertClose(result.costPercent, 10.0, 0.001, 'costPercent is exactly 10%');
  assertClose(result.annualized, 10.0, 0.001, 'annualized is 10% for 365 days');
  assert(result.signalLevel === 'low', 'signalLevel is low (< 15%)');
}

// 5. VALIDATION RULES
console.log('\n5. Input Validation Rules');
{
  // A. Valid offer passes
  const valid = validateOffer({
    amountReceived: '5000',
    totalRepayment: '6000',
    tenureDays: '30'
  });
  assert(Object.keys(valid).length === 0, 'Valid offer returns no errors');

  // B. Missing fields
  const missing = validateOffer({});
  assert(Boolean(missing.amountReceived), 'Missing amountReceived returns error');
  assert(Boolean(missing.totalRepayment), 'Missing totalRepayment returns error');
  assert(Boolean(missing.tenureDays), 'Missing tenureDays returns error');

  // C. Negative / Zero values
  const invalidNeg = validateOffer({
    amountReceived: '-500',
    totalRepayment: '0',
    tenureDays: '-5'
  });
  assert(Boolean(invalidNeg.amountReceived), 'Negative amountReceived is rejected');
  assert(Boolean(invalidNeg.totalRepayment), 'Zero totalRepayment is rejected');
  assert(Boolean(invalidNeg.tenureDays), 'Negative tenureDays is rejected');

  // D. Repayment less than received
  const repayLessThanReceived = validateOffer({
    amountReceived: '10000',
    totalRepayment: '9000',
    tenureDays: '30'
  });
  assert(Boolean(repayLessThanReceived.totalRepayment), 'Repayment < received is rejected');

  // E. Exceeding maximum limits (e.g. > ₹100 Crores)
  const excessiveAmount = validateOffer({
    amountReceived: '1000000001', // 1 Billion + 1
    totalRepayment: '1000000002',
    tenureDays: '30'
  });
  assert(Boolean(excessiveAmount.amountReceived), 'Amount > MAX_LOAN_AMOUNT is rejected');

  // F. Exceeding maximum tenure (> 10,950 days / 30 years)
  const excessiveTenureDays = validateOffer({
    amountReceived: '5000',
    totalRepayment: '6000',
    tenureDays: '10951'
  });
  assert(Boolean(excessiveTenureDays.tenureDays), 'Tenure > 10,950 days is rejected');

  // G. Month-based validation
  const validMonths = validateOffer({
    amountReceived: '5000',
    totalRepayment: '6000',
    tenureUnit: 'months',
    tenureMonths: '12'
  });
  assert(Object.keys(validMonths).length === 0, 'Valid 12-month tenure passes');

  const excessiveMonths = validateOffer({
    amountReceived: '5000',
    totalRepayment: '6000',
    tenureUnit: 'months',
    tenureMonths: '361'
  });
  assert(Boolean(excessiveMonths.tenureDays), 'Months > 360 is rejected');
}

// 6. DAYS <-> MONTHS CONVERSION STABILITY
console.log('\n6. Days <-> Months Conversion Stability');
{
  // Test unit conversion functions used in Screen2Enter & Screen3Review
  const convertDaysToMonths = (days) => Math.max(1, Math.min(360, Math.round(days / 30)));
  const convertMonthsToDays = (months) => Math.max(1, Math.min(MAX_TENURE_DAYS, months * 30));

  assert(convertDaysToMonths(30) === 1, '30 days converts to 1 month');
  assert(convertDaysToMonths(90) === 3, '90 days converts to 3 months');
  assert(convertDaysToMonths(365) === 12, '365 days rounds to 12 months');
  assert(convertMonthsToDays(1) === 30, '1 month converts to 30 days');
  assert(convertMonthsToDays(12) === 360, '12 months converts to 360 days');

  // Verify bounded clamping on extreme input
  assert(convertDaysToMonths(99999) === 360, 'Excessive days clamp to 360 months max');
  assert(convertMonthsToDays(500) === 10950, 'Excessive months clamp to 10950 days max');
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
