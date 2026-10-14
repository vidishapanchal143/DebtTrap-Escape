"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, Scale, ShieldAlert } from "lucide-react";
import { estimateLoan } from "@/lib/loan-math";

type Offer = { amount: string; rate: string; months: string; fees: string };

export default function LoanSafetyTools() {
  const [a, setA] = useState<Offer>({ amount: "100000", rate: "12", months: "24", fees: "2000" });
  const [b, setB] = useState<Offer>({ amount: "100000", rate: "15", months: "24", fees: "1000" });
  const [flags, setFlags] = useState<string[]>([]);
  const warnings = [
    "An upfront payment is requested in exchange for guaranteed approval",
    "Loan terms or fees are hidden or unclear",
    "You are pressured to sign immediately",
    "Approval is guaranteed regardless of eligibility",
    "An OTP, password or wallet recovery phrase is requested",
    "Late-payment or early-closure penalties are not clearly explained",
  ];

  function calculate(v: Offer) {
    const principal = Number(v.amount);
    const annual = Number(v.rate);
    const months = Number(v.months);
    const fees = Number(v.fees);
    if (!Number.isFinite(principal) || !Number.isFinite(annual) || !Number.isFinite(months) || !Number.isFinite(fees) || principal <= 0 || annual < 0 || months <= 0 || fees < 0 || !Number.isInteger(months) || months > 600) return null;
    const estimate = estimateLoan(principal, annual, months, fees);
    return { emi: estimate.emi, total: estimate.totalOutflowIncludingFee, interest: estimate.interestEstimate, fees };
  }

  const first = calculate(a);
  const second = calculate(b);
  const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  function fields(label: string, value: Offer, setValue: (v: Offer) => void, side: "a" | "b") {
    return (
      <div className="offer-input-card">
        <div className="offer-card-title"><span className={`offer-letter ${side}`}>{side.toUpperCase()}</span><div><h3>{label}</h3><p>Enter the terms exactly as offered.</p></div></div>
        <div className="offer-form-grid">
          {([ ["amount", "Loan amount (₹)"], ["rate", "Annual interest (%)"], ["months", "Repayment months"], ["fees", "Known upfront fees (₹)"] ] as const).map(([key, title]) => (
            <label key={key} className="loan-field">{title}<input type="number" min="0" step="any" value={value[key]} onChange={e => setValue({ ...value, [key]: e.target.value })} /></label>
          ))}
        </div>
        {(() => {
          const result = calculate(value);
          return result ? <div className="offer-mini-results"><div><span>Monthly EMI</span><strong>{money(result.emi)}</strong></div><div><span>Total estimated cost</span><strong>{money(result.total)}</strong></div></div> : <p className="inline-validation">Enter a positive loan amount, a valid rate, whole months (up to 600), and non-negative fees.</p>;
        })()}
      </div>
    );
  }

  return (
    <div className="loan-safety-stack">
      <section className="consumer-card compare-card">
        <div className="consumer-card-heading">
          <span className="consumer-icon"><Scale size={21} /></span>
          <div><p className="consumer-kicker">COST COMPARISON</p><h3>Compare two loan offers</h3><p className="consumer-description">Compare the same amount and repayment period to see how rates and known fees change the estimated cost.</p></div>
        </div>
        <div className="offer-grid">{fields("Offer A", a, setA, "a")}{fields("Offer B", b, setB, "b")}</div>
        {first && second && (
          <div className={`comparison-summary ${Math.abs(first.total - second.total) < 1 ? "even" : ""}`}>
            <span className="summary-icon"><CheckCircle2 size={21}/></span>
            <div className="summary-copy">
              <strong>{Math.abs(first.total - second.total) < 1 ? "The estimated total costs are very similar" : `Offer ${first.total < second.total ? "A" : "B"} has the lower estimated total cost`}</strong>
              <p>{Math.abs(first.total - second.total) < 1 ? "Based on the values entered, there is no meaningful difference in total cost." : `Estimated difference: ${money(Math.abs(first.total - second.total))} over the stated term.`} Compare the final written terms before deciding.</p>
            </div>
          </div>
        )}
        <p className="consumer-note">Estimates exclude charges you have not entered. Different loan amounts or tenures are not a like-for-like comparison.</p>
      </section>

      <section className="consumer-card warning-card">
        <div className="consumer-card-heading">
          <span className="consumer-icon warning"><ShieldAlert size={21} /></span>
          <div><p className="consumer-kicker">OFFER CHECK</p><h3>Warning signs worth checking</h3><p className="consumer-description">Select anything that applies to the offer or lender interaction. A warning sign is a reason to pause and verify—not proof of fraud by itself.</p></div>
        </div>
        <div className="warning-options">
          {warnings.map(warning => <label key={warning} className="warning-option"><input type="checkbox" checked={flags.includes(warning)} onChange={e => setFlags(old => e.target.checked ? [...old, warning] : old.filter(item => item !== warning))}/><span>{warning}</span><ArrowRight className="warning-arrow" size={15}/></label>)}
        </div>
        <div className={`warning-summary ${flags.length >= 3 ? "high" : flags.length > 0 ? "medium" : "clear"}`}>
          <div className="warning-summary-icon"><CircleAlert size={19}/></div>
          <div><strong>{flags.length >= 3 ? "Several warning signs selected" : flags.length > 0 ? `${flags.length} item${flags.length === 1 ? "" : "s"} to investigate` : "No warning signs selected"}</strong><p>{flags.length >= 3 ? "Pause before paying or signing. Independently verify the lender and ask for complete written terms." : flags.length > 0 ? "Ask for written clarification and independently verify each concern before proceeding." : "Nothing selected does not establish that an offer is safe. Review the complete agreement and verify the lender."}</p></div>
        </div>
        {flags.length > 0 && <ul className="selected-warning-list">{flags.map(flag => <li key={flag}>{flag}</li>)}</ul>}
      </section>
    </div>
  );
}
