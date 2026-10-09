export type LoanEstimate = {
  emi: number;
  netDisbursedIfFeeDeducted: number;
  totalInstallments: number;
  interestEstimate: number;
  totalOutflowIncludingFee: number;
};

/**
 * EMI estimate using monthly reducing-balance interest.
 * Assumes equal monthly instalments; it is not a lender quote or APR calculation.
 */
export function estimateLoan(
  principal: number,
  annualRatePercent: number,
  months: number,
  upfrontFee = 0
): LoanEstimate {
  if (![principal, annualRatePercent, months, upfrontFee].every(Number.isFinite)) {
    throw new Error("All loan inputs must be finite numbers.");
  }
  if (principal < 0 || annualRatePercent < 0 || upfrontFee < 0 || months <= 0) {
    throw new Error("Principal, rate, and fee must be non-negative; months must be positive.");
  }
  const monthlyRate = annualRatePercent / 1200;
  const emi = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
      (Math.pow(1 + monthlyRate, months) - 1);
  const totalInstallments = emi * months;
  return {
    emi,
    netDisbursedIfFeeDeducted: Math.max(0, principal - upfrontFee),
    totalInstallments,
    interestEstimate: Math.max(0, totalInstallments - principal),
    totalOutflowIncludingFee: totalInstallments + upfrontFee
  };
}