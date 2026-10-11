
"use client";

import { useState } from "react";

const checks = [
  "Interest rate and APR are clearly stated",
  "Processing fees and other charges are disclosed",
  "EMI amount and repayment dates are specified",
  "Late-payment penalties are explained",
  "Prepayment or foreclosure charges are disclosed",
  "Lender's legal name and contact details are provided",
  "Default, collection and collateral terms are understandable",
  "A copy of the final loan agreement is available",
];

export default function LoanDocumentChecklist() {
  const [checked, setChecked] = useState<string[]>([]);

  const progress = Math.round((checked.length / checks.length) * 100);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Tool 3 · Document Review
      </p>
      <h2 className="mt-1 text-2xl font-bold">
        Loan Agreement Checklist
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Review these important terms before accepting a loan.
        This checklist does not automatically read or verify uploaded documents.
      </p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {checked.length} of {checks.length} items reviewed · {progress}%
      </p>

      <div className="mt-4 space-y-3">
        {checks.map((item) => (
          <label
            key={item}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm"
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={checked.includes(item)}
              onChange={(e) =>
                setChecked((old) =>
                  e.target.checked
                    ? [...old, item]
                    : old.filter((value) => value !== item)
                )
              }
            />
            <span>{item}</span>
          </label>
        ))}
      </div>

      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        A completed checklist is not proof that a loan is safe or legally compliant.
        Ask the lender to clarify anything missing or unclear.
      </p>
    </section>
  );
}

