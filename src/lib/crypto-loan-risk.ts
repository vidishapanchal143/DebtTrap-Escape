export type CryptoCollateralRiskInput = {
  collateralQuantity: number;
  collateralPriceUsd: number;
  loanAmountUsdc: number;
  liquidationThresholdPercent: number;
};

export type CryptoCollateralRiskResult = {
  collateralValueUsd: number;
  loanToValuePercent: number;
  estimatedLiquidationPriceUsd: number;
  priceDropToThresholdPercent: number;
  risk: "High" | "Medium" | "Lower";
  thresholdReached: boolean;
  stressTests: Array<{
    assumedPriceDropPercent: number;
    stressedCollateralPriceUsd: number;
    stressedCollateralValueUsd: number;
    stressedLoanToValuePercent: number;
    assumedThresholdReached: boolean;
  }>;
  assumptions: string[];
};

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Deterministic estimate based only on user-supplied prices and protocol threshold.
 * It does not fetch live crypto prices or verify a lending protocol.
 */
export function calculateCryptoCollateralRisk(
  input: CryptoCollateralRiskInput,
): CryptoCollateralRiskResult {
  const values = [
    input.collateralQuantity,
    input.collateralPriceUsd,
    input.loanAmountUsdc,
    input.liquidationThresholdPercent,
  ];
  if (!values.every(Number.isFinite)) throw new Error("All crypto loan inputs must be finite numbers.");
  if (
    input.collateralQuantity <= 0 ||
    input.collateralPriceUsd <= 0 ||
    input.loanAmountUsdc <= 0 ||
    input.liquidationThresholdPercent <= 0 ||
    input.liquidationThresholdPercent > 100
  ) {
    throw new Error("Collateral quantity, price, and loan amount must be positive; the threshold must be above 0 and no more than 100%.");
  }

  const collateralValueUsd = input.collateralQuantity * input.collateralPriceUsd;
  const loanToValuePercent = (input.loanAmountUsdc / collateralValueUsd) * 100;
  const estimatedLiquidationPriceUsd = input.loanAmountUsdc /
    (input.collateralQuantity * (input.liquidationThresholdPercent / 100));
  const priceDropToThresholdPercent = ((input.collateralPriceUsd - estimatedLiquidationPriceUsd) /
    input.collateralPriceUsd) * 100;

  const risk: CryptoCollateralRiskResult["risk"] = loanToValuePercent >= input.liquidationThresholdPercent
    ? "High"
    : loanToValuePercent >= input.liquidationThresholdPercent * 0.75
      ? "Medium"
      : "Lower";

  const stressTests = [20, 40, 60].map((dropPercent) => {
    const stressedCollateralPriceUsd = input.collateralPriceUsd * (1 - dropPercent / 100);
    const stressedCollateralValueUsd = input.collateralQuantity * stressedCollateralPriceUsd;
    const stressedLoanToValuePercent = (input.loanAmountUsdc / stressedCollateralValueUsd) * 100;
    return {
      assumedPriceDropPercent: dropPercent,
      stressedCollateralPriceUsd: round(stressedCollateralPriceUsd),
      stressedCollateralValueUsd: round(stressedCollateralValueUsd),
      stressedLoanToValuePercent: round(stressedLoanToValuePercent),
      assumedThresholdReached: stressedLoanToValuePercent >= input.liquidationThresholdPercent,
    };
  });

  return {
    collateralValueUsd: round(collateralValueUsd),
    loanToValuePercent: round(loanToValuePercent),
    estimatedLiquidationPriceUsd: round(estimatedLiquidationPriceUsd),
    priceDropToThresholdPercent: round(priceDropToThresholdPercent),
    risk,
    thresholdReached: loanToValuePercent >= input.liquidationThresholdPercent,
    stressTests,
    assumptions: [
      "Uses only the supplied collateral price and liquidation threshold; no live price or protocol data is fetched.",
      "Treats 1 USDC as approximately 1 USD for this estimate.",
      "Assumes one collateral asset and a constant loan balance; real protocols may use different fees, thresholds, and liquidation mechanics.",
      "Stress-test price drops are illustrative scenarios, not forecasts.",
    ],
  };
}
