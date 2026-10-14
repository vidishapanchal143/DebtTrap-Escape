"use client";

import { useState } from "react";
import { Check, ClipboardCheck, CircleHelp } from "lucide-react";

const checks = [
  "Interest rate and APR are clearly stated",
  "Processing fees and other charges are disclosed",
  "EMI amount and repayment dates are specified",
  "Late-payment penalties are explained",
  "Prepayment or foreclosure charges are disclosed",
  "The lender's legal name and contact details are provided",
  "Default, collection and collateral terms are understandable",
  "You can keep a copy of the final loan agreement",
];

export default function LoanDocumentChecklist() {
  const [checked, setChecked] = useState<string[]>([]);
  const progress = Math.round((checked.length / checks.length) * 100);

  return (
    <section className="consumer-card document-checklist-card">
      <div className="consumer-card-heading">
        <span className="consumer-icon"><ClipboardCheck size={21}/></span>
        <div><p className="consumer-kicker">BEFORE YOU SIGN</p><h3>Loan agreement checklist</h3><p className="consumer-description">Use this checklist while reading the actual agreement. Mark each term only after you have found and understood it.</p></div>
      </div>
      <div className="checklist-progress-head"><span>{checked.length} of {checks.length} reviewed</span><strong>{progress}%</strong></div>
      <div className="checklist-progress-track"><div style={{ width: `${progress}%` }}/></div>
      <div className="agreement-checks">
        {checks.map((item, index) => {
          const isChecked = checked.includes(item);
          return <label key={item} className={`agreement-check ${isChecked ? "checked" : ""}`}><span className="agreement-check-index">{String(index + 1).padStart(2, "0")}</span><span className="agreement-check-text">{item}</span><span className="agreement-check-control">{isChecked && <Check size={15}/>}</span><input type="checkbox" className="agreement-hidden-checkbox" checked={isChecked} onChange={e => setChecked(old => e.target.checked ? [...old, item] : old.filter(value => value !== item))}/></label>;
        })}
      </div>
      <div className="checklist-caution"><CircleHelp size={17}/><p><strong>A completed checklist is not a safety guarantee.</strong> If a term is missing or unclear, ask the lender for written clarification. This checklist does not independently read or verify documents.</p></div>
    </section>
  );
}
