
"use client";

import { useMemo, useState } from "react";

export default function CryptoLoanRiskAnalyzer() {
  const [collateral, setCollateral] = useState("2");
  const [ethPrice, setEthPrice] = useState("2500");
  const [loan, setLoan] = useState("2000");
  const [threshold, setThreshold] = useState("80");

  const result = useMemo(() => {
    const eth = Number(collateral);
    const price = Number(ethPrice);
    const debt = Number(loan);
    const limit = Number(threshold);

    if (
      !Number.isFinite(eth) ||
      !Number.isFinite(price) ||
      !Number.isFinite(debt) ||
      !Number.isFinite(limit) ||
      eth <= 0 ||
      price <= 0 ||
      debt <= 0 ||
      limit <= 0 ||
      limit > 100
    ) {
      return null;
    }

    const collateralValue = eth * price;
    const ltv = (debt / collateralValue) * 100;
    const liquidationPrice = debt / (eth * (limit / 100));
    const buffer = ((price - liquidationPrice) / price) * 100;

    let risk: "High" | "Medium" | "Lower";

    if (ltv >= limit) {
      risk = "High";
    } else if (ltv >= limit * 0.75) {
      risk = "Medium";
    } else {
      risk = "Lower";
    }

    return {
      collateralValue,
      ltv,
      liquidationPrice,
      buffer,
      risk,
      aboveThreshold: ltv >= limit,
    };
  }, [collateral, ethPrice, loan, threshold]);

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  const fieldClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-blue-500";

  return (
    <section className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm sm:p-7">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          DebtTrap Escape · Web3
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          Crypto Loan Risk Analyzer
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Estimate your collateral coverage, loan-to-value ratio and
          potential liquidation price.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          ETH collateral quantity
          <input
            className={fieldClass}
            type="number"
            min="0.000001"
            step="any"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value)}
          />
        </label>

        <label className="text-sm font-medium">
          ETH price (USD)
          <input
            className={fieldClass}
            type="number"
            min="0.01"
            step="any"
            value={ethPrice}
            onChange={(e) => setEthPrice(e.target.value)}
          />
        </label>

        <label className="text-sm font-medium">
          Loan amount (USDC)
          <input
            className={fieldClass}
            type="number"
            min="0.01"
            step="any"
            value={loan}
            onChange={(e) => setLoan(e.target.value)}
          />
        </label>

        <label className="text-sm font-medium">
          Assumed liquidation threshold (%)
          <input
            className={fieldClass}
            type="number"
            min="1"
            max="100"
            step="any"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Example inputs are illustrative, not live market prices or a
        verified protocol configuration.
      </p>

      {!result ? (
        <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          Enter positive numbers. The liquidation threshold must be
          greater than 0 and no more than 100.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Collateral value</p>
              <p className="mt-1 text-xl font-bold">
                {money(result.collateralValue)}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Loan-to-value (LTV)</p>
              <p className="mt-1 text-xl font-bold">
                {result.ltv.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Estimated liquidation price
              </p>
              <p className="mt-1 text-xl font-bold">
                {money(result.liquidationPrice)} / ETH
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Price drop to estimated threshold
              </p>
              <p className="mt-1 text-xl font-bold">
                {result.buffer.toFixed(2)}%
              </p>
            </div>
          </div>

          <div
            className={`mt-5 rounded-xl border p-4 ${
              result.risk === "High"
                ? "border-red-200 bg-red-50"
                : result.risk === "Medium"
                ? "border-amber-200 bg-amber-50"
                : "border-green-200 bg-green-50"
            }`}
          >
            <p className="font-bold">
              {result.aboveThreshold
                ? "Threshold reached or exceeded"
                : `${result.risk} estimated risk`}
            </p>
            <p className="mt-1 text-sm">
              {result.aboveThreshold
                ? "Your calculated LTV has reached or exceeded the assumed threshold. Check the actual protocol rules immediately."
                : result.risk === "Medium"
                ? "Your LTV is approaching the assumed threshold. A fall in collateral value could increase liquidation risk."
                : "Your current LTV is below the assumed warning range, but collateral price changes and protocol rules still matter."}
            </p>
          </div>
        </>
      )}

      <p className="mt-5 text-xs leading-5 text-gray-500">
        Educational estimate only. Assumes one collateral asset, a
        constant loan balance and the supplied threshold. Actual
        protocols may use different liquidation rules, fees and
        penalties. This tool does not fetch live prices or execute
        blockchain transactions.
      </p>
    </section>
  );
}
