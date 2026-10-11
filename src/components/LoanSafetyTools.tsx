
"use client";

import { useMemo, useState } from "react";

export default function LoanSafetyTools() {
  const [a, setA] = useState({ amount: "100000", rate: "12", months: "24", fees: "2000" });
  const [b, setB] = useState({ amount: "100000", rate: "15", months: "24", fees: "1000" });

  const [flags, setFlags] = useState<string[]>([]);
  const warnings = [
    "Lender asks for an upfront payment to guarantee approval",
    "Loan terms or fees are hidden or unclear",
    "You are pressured to sign immediately",
    "Guaranteed approval regardless of eligibility",
    "Lender asks for an OTP, password, or wallet seed phrase",
    "Repayment penalties are not clearly explained",
  ];

  function calculate(v: typeof a) {
    const p = Number(v.amount);
    const annual = Number(v.rate);
    const months = Number(v.months);
    const fees = Number(v.fees);

    if (
      !Number.isFinite(p) || !Number.isFinite(annual) ||
      !Number.isFinite(months) || !Number.isFinite(fees) ||
      p <= 0 || annual < 0 || months <= 0 || fees < 0 ||
      !Number.isInteger(months)
    ) return null;

    const r = annual / 1200;
    const emi = r === 0
      ? p / months
      : p * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);

    return { emi, total: emi * months + fees, interest: emi * months - p, fees };
  }

  const first = useMemo(() => calculate(a), [a]);
  const second = useMemo(() => calculate(b), [b]);

  const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(n);

  function fields(
    label: string,
    value: typeof a,
    setValue: (v: typeof a) => void
  ) {
    const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900";
    return (
      <div className="rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 font-bold">{label}</h3>
        {([
          ["amount", "Loan amount (₹)"],
          ["rate", "Annual interest rate (%)"],
          ["months", "Repayment months"],
          ["fees", "Additional fees (₹)"],
        ] as const).map(([key, title]) => (
          <label key={key} className="mb-3 block text-sm">
            {title}
            <input
              className={inputClass}
              type="number"
              min="0"
              step="any"
              value={value[key]}
              onChange={(e) => setValue({ ...value, [key]: e.target.value })}
            />
          </label>
        ))}
        {(() => {
          const result = calculate(value);
          return result ? (
            <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
              <p>Monthly EMI: <strong>{money(result.emi)}</strong></p>
              <p>Total interest: <strong>{money(result.interest)}</strong></p>
              <p>Total cost including fees: <strong>{money(result.total)}</strong></p>
            </div>
          ) : <p className="text-sm text-red-600">Enter a positive loan amount, valid rate, whole repayment months, and non-negative fees.</p>;
        })()}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Tool 1</p>
        <h2 className="mb-2 text-2xl font-bold">Loan Offer Comparator</h2>
        <p className="mb-5 text-sm text-slate-600">
          Enter both offers to compare estimated EMI, interest and total repayment.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {fields("Offer A", a, setA)}
          {fields("Offer B", b, setB)}
        </div>
        {first && second && (
          <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-slate-800">
            {Math.abs(first.total - second.total) < 1
              ? "Both offers have approximately the same total cost."
              : `Offer ${first.total < second.total ? "A" : "B"} has the lower estimated total cost by ${money(Math.abs(first.total - second.total))}.`}
            <p className="mt-2 text-xs text-slate-600">
              Compare equivalent loan amounts and terms. Actual lender fees, taxes and APR may differ.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-700">Tool 2</p>
        <h2 className="mb-2 text-2xl font-bold">Loan Red-Flag Checker</h2>
        <p className="mb-4 text-sm text-slate-600">
          Select any warning signs present in the offer. This is a screening checklist, not proof of fraud.
        </p>
        <div className="space-y-3">
          {warnings.map((warning) => (
            <label key={warning} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={flags.includes(warning)}
                onChange={(e) => setFlags((old) =>
                  e.target.checked
                    ? [...old, warning]
                    : old.filter((item) => item !== warning)
                )}
              />
              <span>{warning}</span>
            </label>
          ))}
        </div>
        <div className={`mt-4 rounded-xl p-4 ${flags.length >= 3 ? "bg-rose-50" : flags.length > 0 ? "bg-amber-50" : "bg-emerald-50"}`}>
          <h3 className="font-bold">
            {flags.length >= 3 ? "Multiple warning signs selected" : flags.length > 0 ? "Warning signs identified" : "No warning signs selected"}
          </h3>
          <p className="mt-1 text-sm">
            {flags.length >= 3
              ? "Pause before paying or signing. Independently verify the lender and all terms."
              : flags.length > 0
              ? "Investigate each selected issue and request written clarification before proceeding."
              : "No boxes selected does not mean the offer is safe. Review the full agreement."}
          </p>
          {flags.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {flags.map((flag) => <li key={flag}>{flag}</li>)}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
