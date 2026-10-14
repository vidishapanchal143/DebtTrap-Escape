"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Coins, Gauge, ShieldCheck } from "lucide-react";
import { calculateCryptoCollateralRisk } from "@/lib/crypto-loan-risk";

export default function CryptoLoanRiskAnalyzer() {
  const [collateral, setCollateral] = useState("2");
  const [ethPrice, setEthPrice] = useState("2500");
  const [loan, setLoan] = useState("2000");
  const [threshold, setThreshold] = useState("80");

  const result = useMemo(() => {
    try {
      const estimate = calculateCryptoCollateralRisk({
        collateralQuantity: Number(collateral),
        collateralPriceUsd: Number(ethPrice),
        loanAmountUsdc: Number(loan),
        liquidationThresholdPercent: Number(threshold),
      });
      return {
        collateralValue: estimate.collateralValueUsd,
        ltv: estimate.loanToValuePercent,
        liquidationPrice: estimate.estimatedLiquidationPriceUsd,
        buffer: estimate.priceDropToThresholdPercent,
        risk: estimate.risk,
        aboveThreshold: estimate.thresholdReached,
      };
    } catch { return null; }
  }, [collateral, ethPrice, loan, threshold]);

  const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

  return (
    <section className="consumer-card crypto-risk-card">
      <div className="consumer-card-heading">
        <span className="consumer-icon"><Coins size={21}/></span>
        <div><p className="consumer-kicker">CRYPTO-COLLATERAL ESTIMATE</p><h3>Understand your liquidation exposure</h3><p className="consumer-description">Estimate how the loan compares with your collateral value and how a price drop could change the picture.</p></div>
      </div>

      <div className="risk-input-grid">
        <label className="loan-field">ETH collateral quantity<input type="number" min="0.000001" step="any" value={collateral} onChange={e => setCollateral(e.target.value)}/></label>
        <label className="loan-field">Assumed ETH price (USD)<input type="number" min="0.01" step="any" value={ethPrice} onChange={e => setEthPrice(e.target.value)}/></label>
        <label className="loan-field">Loan amount (USDC)<input type="number" min="0.01" step="any" value={loan} onChange={e => setLoan(e.target.value)}/></label>
        <label className="loan-field">Liquidation threshold (%)<input type="number" min="1" max="100" step="any" value={threshold} onChange={e => setThreshold(e.target.value)}/></label>
      </div>
      <p className="consumer-note"><Activity size={14}/> These are assumptions you enter—not live market prices or verified settings for a specific lending protocol.</p>

      {!result ? <p className="inline-validation">Enter positive quantities and prices. The liquidation threshold must be greater than 0 and no more than 100.</p> : <>
        <div className="risk-metric-grid">
          <div className="risk-metric"><span>Collateral value</span><strong>{money(result.collateralValue)}</strong><small>At the assumed price</small></div>
          <div className="risk-metric"><span>Loan-to-value</span><strong>{result.ltv.toFixed(2)}%</strong><small>Loan ÷ collateral value</small></div>
          <div className="risk-metric"><span>Estimated threshold price</span><strong>{money(result.liquidationPrice)}</strong><small>Per ETH, based on your threshold</small></div>
          <div className="risk-metric"><span>Price-drop buffer</span><strong>{result.buffer.toFixed(2)}%</strong><small>Estimated fall to the threshold</small></div>
        </div>
        <div className={`risk-outlook ${result.aboveThreshold ? "high" : result.risk.toLowerCase()}`}>
          <span className="risk-outlook-icon">{result.aboveThreshold || result.risk === "High" ? <AlertTriangle size={20}/> : <Gauge size={20}/>}</span>
          <div><strong>{result.aboveThreshold ? "The assumed threshold has been reached or exceeded" : `${result.risk} estimated risk under these assumptions`}</strong><p>{result.aboveThreshold ? "Check the actual protocol rules and collateral position urgently; this estimate cannot confirm platform liquidation status." : result.risk === "Medium" ? "The position is approaching the entered threshold. A decline in collateral value may increase liquidation risk." : "The current ratio is below the estimated warning range, but market moves and platform rules still matter."}</p></div>
        </div>
        <div className="stress-header"><span>Illustrative collateral price drops</span><span><ShieldCheck size={14}/> Scenario view</span></div>
        <div className="stress-scenarios">
          {[20, 40, 60].map(drop => {
            const stressedPrice = Number(ethPrice) * (1 - drop / 100);
            const stressedValue = Number(collateral) * stressedPrice;
            const stressedLtv = stressedValue > 0 ? Number(loan) / stressedValue * 100 : 0;
            const thresholdHit = stressedLtv >= Number(threshold);
            return <div className={`stress-scenario ${thresholdHit ? "threshold-hit" : ""}`} key={drop}><span className="stress-drop">−{drop}%</span><div><strong>{money(stressedPrice)} / ETH</strong><small>Estimated LTV: {stressedLtv.toFixed(1)}%</small></div><span className="stress-status">{thresholdHit ? "Threshold reached" : "Below threshold"}</span></div>;
          })}
        </div>
      </>}

      <p className="consumer-note risk-disclaimer">This is an educational estimate only. Actual protocols may use different collateral factors, liquidation rules, fees and penalties. Market prices are not updated automatically, and no blockchain transaction is performed.</p>
    </section>
  );
}
