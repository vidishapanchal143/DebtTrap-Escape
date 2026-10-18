import { estimateLoan } from '@/lib/loan-math';
import { calculateCryptoCollateralRisk } from '@/lib/crypto-loan-risk';

// Helper utilities
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Loan cost calculation */
export function calculateLoanCost(input: {
  principal: number;
  annualInterestRatePercent: number;
  tenureMonths: number;
  upfrontFees?: number;
}) {
  const estimate = estimateLoan(
    input.principal,
    input.annualInterestRatePercent,
    input.tenureMonths,
    input.upfrontFees ?? 0,
  );
  return {
    currency: 'INR',
    principal: roundMoney(input.principal),
    annualInterestRatePercent: input.annualInterestRatePercent,
    tenureMonths: input.tenureMonths,
    upfrontFees: input.upfrontFees === undefined ? null : roundMoney(input.upfrontFees),
    feesStatus: input.upfrontFees === undefined ? 'not_provided_excluded' : 'provided',
    monthlyEmi: roundMoney(estimate.emi),
    totalInterestEstimate: roundMoney(estimate.interestEstimate),
    totalInstallments: roundMoney(estimate.totalInstallments),
    estimatedTotalOutflowWithKnownFees: roundMoney(estimate.totalOutflowIncludingFee),
    assumptions: [
      'Monthly reducing-balance formula with equal monthly instalments.',
      'Only the supplied upfront fee is included; an omitted fee is unknown, not zero.',
      'Excludes unknown taxes, insurance, variable-rate changes, late fees and lender-specific rounding.',
      'This is an estimate, not an official APR or lender quote.',
    ],
  } as const;
}

/** Compare two loan offers */
export function compareLoanOffers(input: {
  principal: number;
  tenureMonths: number;
  offerAAnnualInterestRatePercent: number;
  offerAUpfrontFees?: number;
  offerBAnnualInterestRatePercent: number;
  offerBUpfrontFees?: number;
}) {
  const offerA = calculateLoanCost({
    principal: input.principal,
    annualInterestRatePercent: input.offerAAnnualInterestRatePercent,
    tenureMonths: input.tenureMonths,
    upfrontFees: input.offerAUpfrontFees,
  });
  const offerB = calculateLoanCost({
    principal: input.principal,
    annualInterestRatePercent: input.offerBAnnualInterestRatePercent,
    tenureMonths: input.tenureMonths,
    upfrontFees: input.offerBUpfrontFees,
  });

  const difference = roundMoney(Math.abs(offerA.estimatedTotalOutflowWithKnownFees - offerB.estimatedTotalOutflowWithKnownFees));
  const lowerKnownCostOffer = difference < 0.01 ? 'approximately_equal' : offerA.estimatedTotalOutflowWithKnownFees < offerB.estimatedTotalOutflowWithKnownFees ? 'A' : 'B';
  const allFeesKnown = input.offerAUpfrontFees !== undefined && input.offerBUpfrontFees !== undefined;

  return {
    currency: 'INR',
    samePrincipalAndTenureUsed: true,
    offerA,
    offerB,
    estimatedKnownOutflowDifference: difference,
    lowerKnownCostOffer,
    comparisonStatus: allFeesKnown ? 'all_supplied_upfront_fees_included' : 'provisional_unknown_upfront_fees_excluded',
    assumptions: [
      'Only supplied nominal rates and upfront fees are included; any omitted fee is unknown, not zero.',
      'Other fees, rate conditions, taxes, insurance and lender-specific terms may change the comparison.',
      'The lower estimated total cost does not automatically mean the offer is suitable or safer.',
    ],
  } as const;
}

/** Affordability analysis */
export function assessAffordability(input: {
  monthlyTakeHomeIncome: number;
  monthlyEssentialExpenses: number;
  existingMonthlyEmis: number;
  newLoanEmi: number;
}) {
  const totalMonthlyEmis = input.existingMonthlyEmis + input.newLoanEmi;
  const remainingAfterExpensesAndEmis = input.monthlyTakeHomeIncome - input.monthlyEssentialExpenses - totalMonthlyEmis;
  const emiToIncomePercent = (totalMonthlyEmis / input.monthlyTakeHomeIncome) * 100;
  return {
    currency: 'INR',
    monthlyTakeHomeIncome: roundMoney(input.monthlyTakeHomeIncome),
    monthlyEssentialExpenses: roundMoney(input.monthlyEssentialExpenses),
    existingMonthlyEmis: roundMoney(input.existingMonthlyEmis),
    proposedLoanEmi: roundMoney(input.newLoanEmi),
    totalMonthlyEmis: roundMoney(totalMonthlyEmis),
    totalEmiToIncomePercent: roundMoney(emiToIncomePercent),
    remainingAfterExpensesAndAllEmis: roundMoney(remainingAfterExpensesAndEmis),
    cashFlowIndicator: remainingAfterExpensesAndEmis < 0 ? 'negative_using_reported_inputs' : 'non_negative_using_reported_inputs',
    limitations: [
      'This calculation relies on user-reported values and does not independently verify income or expenses.',
      'It excludes irregular costs, emergency savings, dependants, income volatility and unreported obligations.',
      "There is no universal ratio that guarantees a loan is affordable; this is not a loan approval or personal financial advice.",
    ],
  } as const;
}

/** Crypto‑collateral risk analysis */
export function analyzeCryptoCollateralRisk(input: {
  collateralQuantity: number;
  collateralPriceUsd: number;
  loanAmountUsdc: number;
  liquidationThresholdPercent: number;
}) {
  return calculateCryptoCollateralRisk(input);
}

/** Red‑flag detection helpers */
function normalizeEvidence(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-IN')
    .replace(/[^\p{L}\p{N}\s₹%.-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function evidenceSupportsSignal(signal: string, quote: string): boolean {
  const text = normalizeEvidence(quote);
  const hasAny = (...terms: string[]) => terms.some(term => text.includes(term));
  switch (signal) {
    case 'upfront_payment_promised_to_guarantee_approval':
      return hasAny('upfront', 'advance payment', 'pay first', 'pay before approval') && /(guarantee.{0,35}approv|approv.{0,35}guarantee)/.test(text);
    case 'requested_otp_password_or_wallet_seed_phrase':
      return hasAny('otp', 'one time password', 'password', 'seed phrase', 'wallet seed', 'private key', 'wallet key');
    case 'fees_not_disclosed':
      return hasAny('fee', 'fees', 'charge', 'charges', 'cost') && /(hidden|unclear|unknown|not.{0,20}(disclos|mention|explain|tell|list|provided)|never.{0,20}(disclos|mention|explain)|wont.{0,20}(tell|disclos|explain)|wasn? t.{0,20}(told|explained)|not clear)/.test(text);
    case 'pressure_to_sign_immediately':
      return hasAny('sign', 'signing', 'agreement') && hasAny('now', 'immediately', 'right now', 'today', 'urgent', 'pressure', 'pressured', 'quickly', 'without reading');
    case 'guaranteed_approval_regardless_of_eligibility':
      return /(guarantee.{0,35}approv|approv.{0,35}guarantee)/.test(text) || hasAny('regardless of eligibility', 'no eligibility check');
    case 'late_penalty_unclear':
      return hasAny('late', 'penalty', 'penalties', 'default charge', 'late fee') && /(unclear|not.{0,20}(explain|disclos|state|mention|clear|know)|dont.{0,20}know|do not know|missing|unknown)/.test(text);
    case 'lender_identity_or_registration_unclear':
      return hasAny('lender', 'bank', 'loan app', 'company', 'legal name', 'registration', 'license', 'licence') && hasAny('unclear', 'unknown', "can't verify", 'cant verify', 'cannot verify', "can't find", 'cannot find', 'not registered', 'no registration', 'no legal name', 'no license', 'no licence', 'missing', 'not provided', 'not listed');
    default:
      return false;
  }
}

const SIGNAL_DETAILS: Record<string, { label: string; severity: 'high' | 'medium'; reason: string; nextStep: string }> = {
  upfront_payment_promised_to_guarantee_approval: {
    label: 'Upfront payment tied to guaranteed approval',
    severity: 'high',
    reason: 'A payment requested to guarantee loan approval is a serious warning sign. Legitimate fees should be documented and explained; a fee alone does not establish fraud.',
    nextStep: 'Do not pay based only on a promise. Independently verify the lender and request the fee and refund terms in writing.',
  },
  requested_otp_password_or_wallet_seed_phrase: {
    label: 'Request for an OTP, password, or wallet seed phrase',
    severity: 'high',
    reason: 'These credentials should not be shared with a lender or agent.',
    nextStep: 'Do not share the secret. If already shared, secure the relevant account or wallet immediately using its official recovery guidance.',
  },
  fees_not_disclosed: {
    label: 'Fees not clearly disclosed',
    severity: 'medium',
    reason: 'Unclear fees can make the actual borrowing cost materially different from the advertised rate.',
    nextStep: 'Request a written, itemized list of all mandatory fees before accepting the offer.',
  },
  pressure_to_sign_immediately: {
    label: 'Pressure to sign immediately',
    severity: 'medium',
    reason: 'Pressure can prevent a borrower from checking the agreement and comparing costs.',
    nextStep: 'Pause, read the complete agreement, and obtain independent clarification before signing.',
  },
  guaranteed_approval_regardless_of_eligibility: {
    label: 'Guaranteed approval regardless of eligibility',
    severity: 'medium',
    reason: 'A blanket approval promise without meaningful checks deserves independent verification.',
    nextStep: 'Verify the lender’s identity, eligibility criteria, and all fees using independently sourced contact details.',
  },
  late_penalty_unclear: {
    label: 'Late‑payment penalty unclear',
    severity: 'medium',
    reason: 'An unclear penalty makes the cost of late repayment difficult to estimate.',
    nextStep: 'Ask for the exact late fee, interest basis, grace period, and applicable clause in writing.',
  },
  lender_identity_or_registration_unclear: {
    label: 'Lender identity or registration unclear',
    severity: 'high',
    reason: 'The borrower cannot adequately verify the counterparty if its legal identity or relevant registration is unclear.',
    nextStep: 'Pause and independently verify the legal lender and its applicable registration before sharing documents or paying money.',
  },
};

/** Detect red‑flag signals */
export function detectLoanRedFlags(observations: Array<{ signal: string; evidenceQuote: string }>, message: string) {
  const normalizedMessage = normalizeEvidence(message);
  const verified: Array<{ signal: string; label: string; severity: 'high' | 'medium'; evidenceQuote: string; reason: string; nextStep: string }> = [];
  const rejected: string[] = [];

  for (const obs of observations) {
    const quote = normalizeEvidence(obs.evidenceQuote);
    if (quote.length < 8 || !normalizedMessage.includes(quote) || !evidenceSupportsSignal(obs.signal, obs.evidenceQuote)) {
      rejected.push(obs.signal);
      continue;
    }
    const details = SIGNAL_DETAILS[obs.signal];
    if (details) {
      verified.push({
        signal: obs.signal,
        label: details.label,
        severity: details.severity,
        evidenceQuote: obs.evidenceQuote,
        reason: details.reason,
        nextStep: details.nextStep,
      });
    }
  }

  return {
    verifiedFlags: verified,
    rejectedObservations: rejected,
    countVerified: verified.length,
    limitations: [
      'This screen only checks warning signs explicitly described and quoted from the current user message.',
      'A warning sign does not prove fraud or illegality; absence of flags does not prove an offer is safe.',
      'This tool has not read an uploaded agreement or independently verified a lender.',
    ],
  } as const;
}
