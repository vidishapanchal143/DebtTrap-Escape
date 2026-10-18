"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ResultCarousel from '@/components/ResultCarousel';
import { estimateLoan } from "../lib/loan-math";
import {
  ShieldCheck,
  FileSearch,
  ChevronDown,
  X,
  Menu,
  Calculator,
  TriangleAlert,
  ArrowRight,
  ArrowLeft,
  Check,
  LockKeyhole,
  FileText,
  Bot,
  Sparkles,
  CircleHelp,
  CheckCircle2,
  ClipboardCheck,
  Scale,
  Activity,
  AlertTriangle,
  Coins,
  Gauge,
  ShieldAlert,
  RotateCcw,
  BadgeCheck,
  LifeBuoy,
  BarChart3,
  Fingerprint,
  Copy,
  Wallet,
  RefreshCw,
  XCircle,
  History,
  Send,
} from 'lucide-react';
import CryptoLoanRiskAnalyzer from "@/components/CryptoLoanRiskAnalyzer";
import { BrandLogo } from '@/components/BrandLogo';
import { calculateCryptoCollateralRisk } from '@/lib/crypto-loan-risk';
import LoanSafetyTools from "@/components/LoanSafetyTools";
import LoanDocumentChecklist from "@/components/LoanDocumentChecklist";


type Message = { role: "agent" | "user"; text: string };
type HashingFile = "original" | "comparison" | null;
type ReviewGoal = "loan" | "compare" | "warning" | "crypto";
type SendDestination = "chat" | "review";

const money = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number.isFinite(value) ? value : 0);

async function sha256File(file: File) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is unavailable. Open this page in a secure browser context and try again.");
  }
  const bytes = await file.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function renderInlineReportText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part
  );
}

function renderReportText(text: string) {
  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div className="report-spacing" key={index} />;
    if (/^#{1,3}\s/.test(trimmed)) {
      return <h4 className="report-heading" key={index}>{renderInlineReportText(trimmed.replace(/^#{1,3}\s/, "").replace(/\*\*/g, ""))}</h4>;
    }
    const bullet = trimmed.match(/^(?:[-*]|\d+[.)])\s+(.*)$/);
    if (bullet) return <div className="report-bullet" key={index}><span aria-hidden="true">•</span><div>{renderInlineReportText(bullet[1])}</div></div>;
    return <p className="report-paragraph" key={index}>{renderInlineReportText(trimmed)}</p>;
  });
}

export default function Home() {
  const [amount, setAmount] = useState("50000");
  const [rate, setRate] = useState("18");
  const [months, setMonths] = useState("12");
  const [fee, setFee] = useState("1500");
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "Welcome to DebtTrap Escape. Tell me about the loan you are considering, and I’ll help you understand estimated repayments, compare offers, or identify questions worth asking before you commit. Share only the details needed for your question—never include passwords, OTPs, or banking credentials. Results are estimates, not a lender decision or professional financial advice." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [active, setActive] = useState("Home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalHash, setOriginalHash] = useState("");
  const [comparisonFile, setComparisonFile] = useState<File | null>(null);
  const [comparisonHash, setComparisonHash] = useState("");
  const [hashing, setHashing] = useState<HashingFile>(null);
  const [vaultError, setVaultError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [reviewGoal, setReviewGoal] = useState<ReviewGoal>("loan");
  const [reviewStep, setReviewStep] = useState<1 | 2 | 3>(1);
  const [reviewAmount, setReviewAmount] = useState("");
  const [reviewRate, setReviewRate] = useState("");
  const [reviewMonths, setReviewMonths] = useState("");
  const [reviewFee, setReviewFee] = useState("");
  const [includeBudget, setIncludeBudget] = useState(false);
  const [reviewIncome, setReviewIncome] = useState("");
  const [reviewExpenses, setReviewExpenses] = useState("");
  const [reviewExistingEmis, setReviewExistingEmis] = useState("");
  const [offerARate, setOfferARate] = useState("");
  const [offerAFee, setOfferAFee] = useState("");
  const [offerBRate, setOfferBRate] = useState("");
  const [offerBFee, setOfferBFee] = useState("");
  const [warningObservations, setWarningObservations] = useState("");
  const [cryptoQuantity, setCryptoQuantity] = useState("");
  const [cryptoPrice, setCryptoPrice] = useState("");
  const [cryptoLoan, setCryptoLoan] = useState("");
  const [cryptoThreshold, setCryptoThreshold] = useState("80");
  const [reviewResult, setReviewResult] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewValidation, setReviewValidation] = useState("");
  const originalFileRef = useRef<HTMLInputElement>(null);
  const comparisonFileRef = useRef<HTMLInputElement>(null);

  // ── Wallet state ─────────────────────────────────────────────────────────────
  type WalletStep = "idle" | "prepared" | "confirmed" | "cancelled" | "error";
  type TxRecord = { id: string; status: string; amount: string; recipient: string; createdAt: string };
  type PreparedInfo = { recipient: string; amountCents: number; feeCents: number; totalDebit: number; idempotencyKey: string };

  const [walletBalance, setWalletBalance] = useState<{ balance: number; asset: string } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletStep, setWalletStep] = useState<WalletStep>("idle");
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [preparedTx, setPreparedTx] = useState<PreparedInfo | null>(null);
  const [confirmedTxId, setConfirmedTxId] = useState("");
  const [walletError, setWalletError] = useState("");
  const [txHistory, setTxHistory] = useState<TxRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    setWalletLoading(true);
    try {
      const res = await fetch("/api/wallet/balance");
      const data = await res.json() as { balance?: number | null; asset?: string; error?: string };
      if (res.ok && typeof data.balance === "number" && !isNaN(data.balance)) {
        setWalletBalance({ balance: data.balance, asset: data.asset ?? "SIM-USDC" });
      }
    } catch { /* network error — silently ignore */ }
    finally { setWalletLoading(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/wallet/history?limit=5");
      const data = await res.json() as { history?: TxRecord[] };
      if (data.history) setTxHistory(data.history);
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { void fetchBalance(); void fetchHistory(); }, [fetchBalance, fetchHistory]);

  async function handlePrepare() {
    setWalletError("");
    const recipientAddr = transferRecipient.trim();
    const amt = Number(transferAmount);
    if (!/^0x[0-9A-Fa-f]{8,40}$/.test(recipientAddr)) { setWalletError("Enter a valid 0x… address (8–40 hex chars)."); return; }
    if (!Number.isFinite(amt) || amt <= 0) { setWalletError("Enter a positive amount."); return; }
    setWalletLoading(true);
    try {
      const res = await fetch("/api/wallet/prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient: recipientAddr, amount: amt }) });
      const data = await res.json() as PreparedInfo & { error?: string };
      if (!res.ok) { setWalletError(data.error ?? "Preparation failed."); return; }
      setPreparedTx({ recipient: data.recipient, amountCents: data.amountCents, feeCents: data.feeCents, totalDebit: data.totalDebit, idempotencyKey: data.idempotencyKey });
      setWalletStep("prepared");
    } catch { setWalletError("Network error — could not reach wallet API."); }
    finally { setWalletLoading(false); }
  }

  async function handleConfirm() {
    if (!preparedTx) return;
    setWalletLoading(true); setWalletError("");
    try {
      const res = await fetch("/api/wallet/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(preparedTx) });
      const data = await res.json() as { transactionId?: string; error?: string };
      if (!res.ok) { setWalletError(data.error ?? "Confirmation failed."); return; }
      setConfirmedTxId(data.transactionId ?? "");
      setWalletStep("confirmed");
      void fetchBalance(); void fetchHistory();
    } catch { setWalletError("Network error — could not reach wallet API."); }
    finally { setWalletLoading(false); }
  }

  async function handleCancel() {
    if (!preparedTx) return;
    setWalletLoading(true); setWalletError("");
    try {
      const res = await fetch("/api/wallet/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idempotencyKey: preparedTx.idempotencyKey }) });
      const data = await res.json() as { status?: string; error?: string };
      if (res.status === 409) { setWalletError("This transfer was already confirmed and cannot be cancelled."); return; }
      if (!res.ok && res.status !== 404) { setWalletError(data.error ?? "Cancellation failed."); return; }
      setWalletStep("cancelled");
      void fetchBalance(); void fetchHistory();
    } catch { setWalletError("Network error — could not reach wallet API."); }
    finally { setWalletLoading(false); }
  }

  function resetWallet() {
    setWalletStep("idle"); setPreparedTx(null); setConfirmedTxId(""); setWalletError("");
    setTransferRecipient(""); setTransferAmount("");
  }

  const calc = useMemo(() => {
    const principal = Math.max(0, Number(amount) || 0);
    const annualRate = Math.max(0, Number(rate) || 0);
    const term = Math.max(1, Number(months) || 1);
    const upfrontFee = Math.max(0, Number(fee) || 0);
    const estimate = estimateLoan(principal, annualRate, term, upfrontFee);
    return {
      principal,
      annualRate,
      term,
      upfrontFee,
      net: estimate.netDisbursedIfFeeDeducted,
      emi: estimate.emi,
      total: estimate.totalInstallments,
      interest: estimate.interestEstimate,
      outflow: estimate.totalOutflowIncludingFee,
    };
  }, [amount, rate, months, fee]);

  async function sendMessage(message?: string, destination: SendDestination = "chat") {
    const q = (message ?? chatInput).trim();
    if (!q || chatLoading) return;

    if (destination === "chat") {
      setMessages(prev => [...prev, { role: "user", text: q }]);
      setChatInput("");
    } else {
      setReviewResult("");
      setReviewError("");
      setReviewLoading(true);
    }
    setChatLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          history: messages.slice(1).slice(-20).map((item) => ({
            role: item.role === "agent" ? "model" : "user",
            text: item.text,
          })),
        }),
      });
      const data: { reply?: string; error?: string; mode?: string } = await response.json();

      if (!response.ok) {
        const safeError = typeof data.error === "string" && data.error.trim()
          ? data.error
          : "I couldn’t complete this analysis right now. Please try again shortly.";
        if (destination === "review") setReviewError(safeError);
        else setMessages(prev => [...prev, { role: "agent", text: safeError }]);
        return;
      }
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        const emptyMessage = "I received an empty result. Please try again with the loan amount, annual interest rate, and repayment period.";
        if (destination === "review") setReviewError(emptyMessage);
        else setMessages(prev => [...prev, { role: "agent", text: emptyMessage }]);
        return;
      }

      if (destination === "review") setReviewResult(data.reply.trim());
      else setMessages(prev => [...prev, { role: "agent", text: data.reply!.trim() }]);
    } catch {
      const networkMessage = "I can’t reach the AI service right now. Confirm the app is running and your internet connection is available, then try again.";
      if (destination === "review") setReviewError(networkMessage);
      else setMessages(prev => [...prev, { role: "agent", text: networkMessage }]);
    } finally {
      setChatLoading(false);
      setReviewLoading(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function buildReviewPrompt() {
    if (reviewGoal === "loan") {
      return [
        "Please perform a guided loan-cost review using the available calculations. Explain the result in plain, user-facing language; never mention internal functions, tools, or backend steps.",
        `Loan amount (INR): ${reviewAmount}`,
        `Annual interest rate (%): ${reviewRate}`,
        `Tenure (months): ${reviewMonths}`,
        `Known upfront fees (INR): ${reviewFee}`,
        includeBudget ? `Monthly take-home income (INR): ${reviewIncome}` : "The user did not request an affordability assessment.",
        includeBudget ? `Monthly essential expenses (INR): ${reviewExpenses}` : "",
        includeBudget ? `Existing monthly EMIs (INR): ${reviewExistingEmis}` : "",
        "Return the monthly EMI, estimated total interest, estimated total repayment, the key assumptions and the most useful next question. Do not claim lender verification. If an affordability assessment was requested, use only the stated income, expenses and existing EMIs and describe the result as an indicator, not approval or financial advice.",
      ].filter(Boolean).join("\n");
    }
    if (reviewGoal === "compare") {
      return [
        "Compare two loan offers on a like-for-like basis. Use the available calculation capability. Explain the cost difference in plain language and do not mention internal functions, tools, or backend steps.",
        `Same loan amount for both offers (INR): ${reviewAmount}`,
        `Same repayment period (months): ${reviewMonths}`,
        `Offer A annual interest rate (%): ${offerARate}`,
        `Offer A known upfront fees (INR): ${offerAFee}`,
        `Offer B annual interest rate (%): ${offerBRate}`,
        `Offer B known upfront fees (INR): ${offerBFee}`,
        "Show estimated monthly EMI, known total outflow for both, difference, assumptions and missing charges that could change the comparison. Do not call either offer universally best or verify lender legitimacy.",
      ].join("\n");
    }
    if (reviewGoal === "warning") {
      return [
        "Review the following user-described loan offer or lender interaction for warning signs. Use only exact wording contained in this message as evidence. Do not call a warning sign proof of fraud, and do not claim you read a contract or verified a lender. Explain practical next steps in plain language. Do not mention internal tools or backend steps.",
        "User-provided description / relevant wording:",
        warningObservations,
      ].join("\n");
    }
    return [
      "Estimate crypto-collateral loan risk using only the inputs below. Use the available calculations and clearly call the price a user-supplied assumption, not a live quote. Do not mention internal functions or backend steps.",
      `Collateral quantity (ETH): ${cryptoQuantity}`,
      `Assumed ETH price (USD): ${cryptoPrice}`,
      `Loan amount (USDC): ${cryptoLoan}`,
      `Assumed liquidation threshold (%): ${cryptoThreshold}`,
      "Report estimated collateral value, loan-to-value ratio, price-drop stress scenarios and limitations. Do not claim live price verification or protocol-specific certainty.",
    ].join("\n");
  }

  function runGuidedReview() {
    setReviewValidation("");
    setReviewError("");
    setReviewResult("");

    const fmt = (value: number, currency = "INR") => new Intl.NumberFormat("en-IN", {
      style: "currency", currency, maximumFractionDigits: 2,
    }).format(value);
    const pct = (value: number) => `${value.toFixed(2)}%`;

    if (reviewGoal === "loan") {
      if (!reviewAmount.trim() || Number(reviewAmount) <= 0 || !reviewRate.trim() || Number(reviewRate) < 0 || Number(reviewRate) > 300 || !reviewMonths.trim() || !Number.isInteger(Number(reviewMonths)) || Number(reviewMonths) < 1 || Number(reviewMonths) > 600 || !reviewFee.trim() || Number(reviewFee) < 0) {
        setReviewValidation("Enter a valid loan amount, annual interest rate, tenure (1–600 whole months), and known upfront fee. Enter 0 if there is no fee.");
        return;
      }
      if (includeBudget && (!reviewIncome.trim() || Number(reviewIncome) <= 0 || !reviewExpenses.trim() || Number(reviewExpenses) < 0 || !reviewExistingEmis.trim() || Number(reviewExistingEmis) < 0)) {
        setReviewValidation("For the budget check, enter take-home income, monthly essential expenses and existing EMIs. Enter 0 when you have no existing EMI.");
        return;
      }
      const principal = Number(reviewAmount), annualRate = Number(reviewRate), term = Number(reviewMonths), fees = Number(reviewFee);
      const estimate = estimateLoan(principal, annualRate, term, fees);
      const lines = [
        "# Your loan cost review",
        "## Loan summary",
        `- Loan amount: ${fmt(principal)}`,
        `- Annual interest rate: ${pct(annualRate)}`,
        `- Repayment period: ${term} months (${(term / 12).toFixed(1)} years)`,
        `- Known upfront fees entered: ${fmt(fees)}`,
        "",
        "## Estimated repayment",
        `- **Monthly EMI: ${fmt(estimate.emi)}**`,
        `- Total of instalments: ${fmt(estimate.totalInstallments)}`,
        `- Estimated total interest: ${fmt(estimate.interestEstimate)}`,
        `- Estimated total outflow including the fee entered: ${fmt(estimate.totalOutflowIncludingFee)}`,
        "",
        "## What this means",
        `At these inputs, the scheduled instalments add up to about ${fmt(estimate.totalInstallments)} over ${term} months. The estimate includes only the upfront fee you entered; any unlisted insurance, processing, late-payment or other charges are excluded.`,
        "",
        "## What still needs checking",
        "- Confirm whether the rate is fixed or floating and whether the lender uses monthly reducing balance, flat rate, or another method.",
        "- Check the written fee schedule, insurance, late-payment charges, foreclosure/prepayment conditions and the actual repayment schedule.",
        "- This calculation does not verify the lender or read your agreement.",
      ];
      if (includeBudget) {
        const income = Number(reviewIncome), expenses = Number(reviewExpenses), existing = Number(reviewExistingEmis);
        const totalEmis = existing + estimate.emi;
        const emiRatio = totalEmis / income * 100;
        const leftover = income - expenses - totalEmis;
        lines.push("", "## Monthly budget indicator", `- Take-home income entered: ${fmt(income)}`, `- Essential expenses entered: ${fmt(expenses)}`, `- Existing EMIs plus proposed EMI: ${fmt(totalEmis)}`, `- Money left after these listed costs: ${fmt(leftover)}`, `- Total EMI-to-income ratio: ${pct(emiRatio)}`, "This is a cash-flow indicator based only on the figures you entered, not a universal safe/unsafe threshold or loan approval.");
      } else {
        lines.push("", "## Affordability not assessed", "Income, essential expenses and existing EMIs were not provided for a budget check. Add them if you want a cash-flow indicator.");
      }
      lines.push("", "## Suggested next step", "Compare this estimate with the lender's official Key Facts Statement / sanction letter and repayment schedule before accepting the offer.", "", "*Estimate only. No lender or contract verification was performed.*");
      setReviewResult(lines.join("\n"));
      setReviewStep(3);
      return;
    }

    if (reviewGoal === "compare") {
      if (!reviewAmount.trim() || Number(reviewAmount) <= 0 || !reviewMonths.trim() || !Number.isInteger(Number(reviewMonths)) || Number(reviewMonths) < 1 || Number(reviewMonths) > 600 || !offerARate.trim() || Number(offerARate) < 0 || Number(offerARate) > 500 || !offerBRate.trim() || Number(offerBRate) < 0 || Number(offerBRate) > 500 || !offerAFee.trim() || Number(offerAFee) < 0 || !offerBFee.trim() || Number(offerBFee) < 0) {
        setReviewValidation("Enter the shared loan amount and tenure, both annual interest rates, and known fees for both offers. Enter 0 if a fee does not apply.");
        return;
      }
      const principal = Number(reviewAmount), term = Number(reviewMonths);
      const a = estimateLoan(principal, Number(offerARate), term, Number(offerAFee));
      const b = estimateLoan(principal, Number(offerBRate), term, Number(offerBFee));
      const difference = Math.abs(a.totalOutflowIncludingFee - b.totalOutflowIncludingFee);
      const cheaper = a.totalOutflowIncludingFee < b.totalOutflowIncludingFee ? "Offer A" : a.totalOutflowIncludingFee > b.totalOutflowIncludingFee ? "Offer B" : "Both offers";
      setReviewResult([
        "# Loan offer comparison",
        `## Shared assumptions\n- Loan amount: ${fmt(principal)}\n- Tenure: ${term} months\n- Fees are the amounts you entered; other charges are not included.`,
        "## Offer A",
        `- Annual rate: ${pct(Number(offerARate))}\n- Estimated EMI: ${fmt(a.emi)}\n- Estimated total interest: ${fmt(a.interestEstimate)}\n- Total outflow including entered fee: ${fmt(a.totalOutflowIncludingFee)}`,
        "## Offer B",
        `- Annual rate: ${pct(Number(offerBRate))}\n- Estimated EMI: ${fmt(b.emi)}\n- Estimated total interest: ${fmt(b.interestEstimate)}\n- Total outflow including entered fee: ${fmt(b.totalOutflowIncludingFee)}`,
        "## Cost comparison",
        difference < 0.01 ? "The estimated totals are equal using the entered values." : `${cheaper} has the lower estimated total outflow by ${fmt(difference)} using only the entered rate and fees. This does not mean it is automatically the better or safer offer.`,
        "## Before deciding",
        "Compare the Key Facts Statement, rate type, all fees, insurance, late charges, prepayment conditions and lender identity. A lower estimate may change when missing charges or different terms are included.",
        "*Illustrative calculation only. Lenders and offers have not been independently verified.*",
      ].join("\n\n"));
      setReviewStep(3);
      return;
    }

    if (reviewGoal === "warning") {
      if (warningObservations.trim().length < 10) {
        setReviewValidation("Describe the offer or the lender interaction in a little more detail so there is something specific to review.");
        return;
      }
      const text = warningObservations;
      const checks = [
        { re: /\b(otp|one[- ]time password|password|seed phrase|recovery phrase|private key)\b/i, label: "Sensitive credentials mentioned", reason: "A legitimate lender should not ask you to disclose account passwords, OTPs, wallet seed phrases or private keys.", next: "Do not share the secret. If already shared, secure the account or wallet through its official recovery steps." },
        { re: /\b(guarantee(?:d)? approval|guaranteed loan|100% approval|approval guaranteed)\b/i, label: "Guaranteed approval claim", reason: "Approval depends on the lender's real eligibility and underwriting process; a guarantee deserves scrutiny.", next: "Ask for the lender's official eligibility criteria and written offer; independently verify the institution." },
        { re: /\b(pay|payment|transfer|deposit|processing fee|upfront).{0,80}\b(today|first|before approval|to approve|guarantee|release)\b|\b(before approval|pay today|advance fee)\b/i, label: "Upfront payment or urgency wording", reason: "A fee request tied to urgency or guaranteed approval can be a warning sign. A fee alone is not proof of fraud.", next: "Do not pay based only on a message. Verify fees and refund terms using independently found official contact details." },
        { re: /\b(sign now|sign immediately|today only|limited time|urgent|act now)\b/i, label: "Pressure to act quickly", reason: "Pressure can reduce the time available to read the agreement and verify terms.", next: "Pause and request the complete written terms and time to review them." },
        { re: /\b(late fee|late penalty|penalty|processing fee|insurance|charges)\b/i, label: "Charges or penalties mentioned", reason: "The description mentions charges, but the full amount and conditions may not be clear from this text alone.", next: "Ask for each charge, when it applies, and the total cost in writing." },
      ];
      const found = checks.filter(c => c.re.test(text));
      setReviewResult([
        "# Warning-sign review",
        found.length ? `## Items to check (${found.length})` : "## No clear keyword match found",
        ...(found.length ? found.flatMap((item, i) => [`### ${i + 1}. ${item.label}`, `- Why it matters: ${item.reason}`, `- Suggested next step: ${item.next}`]) : ["The text you provided did not match the basic warning patterns checked here. That does not prove the offer or lender is safe; a more complete description or the written terms may reveal issues." ]),
        "## Limits of this review",
        "This is a basic screening of the text you typed, not a legal determination, fraud verdict, contract reading, or independent lender verification. No source or registration database was checked.",
      ].join("\n\n"));
      setReviewStep(3);
      return;
    }

    if (!cryptoQuantity.trim() || Number(cryptoQuantity) <= 0 || !cryptoPrice.trim() || Number(cryptoPrice) <= 0 || !cryptoLoan.trim() || Number(cryptoLoan) <= 0 || !cryptoThreshold.trim() || Number(cryptoThreshold) <= 0 || Number(cryptoThreshold) > 100) {
      setReviewValidation("Enter a positive collateral quantity, assumed ETH price, loan amount, and liquidation threshold between 1% and 100%.");
      return;
    }
    try {
      const result = calculateCryptoCollateralRisk({ collateralQuantity: Number(cryptoQuantity), collateralPriceUsd: Number(cryptoPrice), loanAmountUsdc: Number(cryptoLoan), liquidationThresholdPercent: Number(cryptoThreshold) });
      setReviewResult([
        "# Crypto collateral risk estimate",
        `- Collateral value at your assumed price: ${fmt(result.collateralValueUsd, "USD")}`,
        `- Current loan-to-value (LTV): ${pct(result.loanToValuePercent)}`,
        `- Estimated price per ETH at the entered threshold: ${fmt(result.estimatedLiquidationPriceUsd, "USD")}`,
        `- Price drop to threshold under this simplified model: ${pct(result.priceDropToThresholdPercent)}`,
        `- Scenario indicator: ${result.risk}`,
        "## Hypothetical price-drop scenarios",
        ...result.stressTests.map(t => `- If ETH falls ${t.assumedPriceDropPercent}%, estimated LTV becomes ${pct(t.stressedLoanToValuePercent)}${t.assumedThresholdReached ? " (at or above entered threshold)" : " (below entered threshold)"}.`),
        "## Important limits",
        ...result.assumptions,
        "*This uses only your supplied price and threshold. It does not fetch live prices or verify a specific lending protocol.*",
      ].join("\n\n"));
      setReviewStep(3);
    } catch {
      setReviewValidation("Please check the crypto values and try again.");
    }
  }

  function resetGuidedReview() {
    setReviewStep(1);
    setReviewResult("");
    setReviewError("");
    setReviewValidation("");
    setReviewLoading(false);
  }


  const nav = [
    { label: "Home", target: "home" },
    { label: "Start here", target: "start-review" },
    { label: "AI Guide", target: "support" },
    { label: "Compare offers", target: "loan-tools" },
    { label: "Agreement checklist", target: "document-review" },
    { label: "Evidence", target: "evidence" },
  ];

  async function selectOriginalFile(file: File | undefined) {
    if (!file) return;
    setOriginalFile(file);
    setOriginalHash("");
    setComparisonFile(null);
    setComparisonHash("");
    setVaultError("");
    setCopyMessage("");
    if (comparisonFileRef.current) comparisonFileRef.current.value = "";
    setHashing("original");
    try {
      setOriginalHash(await sha256File(file));
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : "Could not calculate the SHA-256 hash.");
    } finally {
      setHashing(null);
    }
  }

  async function selectComparisonFile(file: File | undefined) {
    if (!file) return;
    setComparisonFile(file);
    setComparisonHash("");
    setVaultError("");
    setHashing("comparison");
    try {
      setComparisonHash(await sha256File(file));
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : "Could not calculate the comparison hash.");
    } finally {
      setHashing(null);
    }
  }

  async function copyOriginalHash() {
    if (!originalHash) return;
    setCopyMessage("");
    setVaultError("");
    try {
      await navigator.clipboard.writeText(originalHash);
      setCopyMessage("SHA-256 hash copied to clipboard.");
    } catch {
      setVaultError("Could not access the clipboard. Check browser permissions and try again.");
    }
  }
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" onClick={() => setActive("Home")}>
          <BrandLogo className="brand-mark" />
          <span><strong>DebtTrap <b>Escape</b></strong><small>Know. Check. Compare. Stay Safe.</small></span>
        </a>
        <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
          {nav.map(item => <button key={item.target} className={active === item.label ? "nav-item active" : "nav-item"} onClick={() => { setActive(item.label); setMobileMenu(false); document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth" }); }}>{item.label}</button>)}
        </nav>
        <div className="top-actions"><button className="header-cta" aria-label="Start a loan safety review" onClick={() => { setActive("Start here"); document.getElementById("start-review")?.scrollIntoView({behavior:"smooth"}); }}><FileSearch size={16}/> Start a check</button><span className="lang-pill">EN <ChevronDown size={14}/></span><button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X/> : <Menu/>}</button></div>
      </header>
      <section className="hero wrap" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot"/> YOUR PERSONAL LOAN SAFETY ASSISTANT</div>
          <h1>Break free from<br/><span>loan traps</span> with clarity.</h1>
          <p className="hero-sub">Understand the real cost of a loan, inspect confusing terms, and organize evidence before you make a decision.</p>
          <div className="hero-chips">
            <span><Calculator size={17}/> Clear repayment estimates</span><span><TriangleAlert size={17}/> Warning signs to check</span><span><ShieldCheck size={17}/> Practical next steps</span>
          </div>
          <div className="hero-buttons"><button className="primary-btn" onClick={() => {setActive("Start here"); document.getElementById("start-review")?.scrollIntoView({behavior:"smooth"});}}>Start my review <ArrowRight size={18}/></button><button className="secondary-btn" onClick={() => document.getElementById("how")?.scrollIntoView({behavior:"smooth"})}><span className="play">▶</span> See how it works</button></div>
          <div className="trust-note"><LockKeyhole size={14}/> Privacy-first design <i/> No automatic scam verdicts <i/> Estimates clearly labelled</div>
        </div>
        <div className="hero-visual" aria-label="3D-inspired AI loan safety visual">
          <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
          <div className="holo holo-doc"><FileText size={28}/><span>LOAN OVERVIEW</span><div className="fake-lines"/><div className="fake-lines short"/><div className="fake-lines"/></div>
          <div className="agent-orb"><div className="orb-core"><Bot size={94} strokeWidth={1.15}/><Sparkles className="orb-spark" size={25}/></div><div className="orb-ring"/></div>
          <div className="floating-card score-card"><small>BEFORE YOU COMMIT</small><div className="score-ring"><ShieldCheck size={27}/></div><strong>Know the details</strong><em>Cost · terms · questions</em></div>
          <div className="floating-card charge-card"><TriangleAlert size={19}/><div><strong>Cost clarity</strong><small>Review fees & repayments</small></div></div>
          <div className="visual-caption"><span className="live-dot"/> A clearer view of your loan <span className="caption-tag">HERE TO HELP</span></div>
        </div>
      </section>

  

      <section className="guided-review wrap" id="start-review" aria-labelledby="guided-title">
        <div className="guided-heading">
          <div>
            <div className="eyebrow"><span className="pulse-dot"/> START HERE · ABOUT 2 MINUTES</div>
            <h2 id="guided-title">Get clarity on your loan, step by step.</h2>
            <p>Choose what you need, enter the details you have, then get a plain-language review. You do not need to know how the AI works.</p>
          </div>
          <div className="guided-privacy"><LockKeyhole size={16}/><span><strong>Your details stay focused on this request</strong><small>Never enter passwords, OTPs, bank logins or wallet recovery phrases.</small></span></div>
        </div>

        <div className="guided-stepper" aria-label="Review steps">
          {[{n:1,label:"Choose your goal"},{n:2,label:"Add your details"},{n:3,label:"See your review"}].map((item) => (
            <div key={item.n} className={`guided-step ${reviewStep === item.n ? "current" : reviewStep > item.n ? "complete" : ""}`}>
              <span className="guided-step-number">{reviewStep > item.n ? <Check size={15}/> : item.n}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="guided-layout">
          <div className="guided-form-card">
            {reviewStep === 1 && <>
              <div className="guided-card-title"><span className="guided-overline">STEP 1 OF 3</span><h3>What would you like help with?</h3><p>Pick one task to get started. You can run another review later.</p></div>
              <div className="goal-grid">
                <button type="button" className={`goal-option ${reviewGoal === "loan" ? "selected" : ""}`} onClick={() => setReviewGoal("loan")}>
                  <span className="goal-icon"><Calculator size={22}/></span><span className="goal-copy"><strong>Understand one loan</strong><small>Monthly EMI, total interest and repayment</small></span><span className="goal-radio" aria-hidden="true"/>
                </button>
                <button type="button" className={`goal-option ${reviewGoal === "compare" ? "selected" : ""}`} onClick={() => setReviewGoal("compare")}>
                  <span className="goal-icon violet"><Scale size={22}/></span><span className="goal-copy"><strong>Compare two offers</strong><small>See how rates and fees change the cost</small></span><span className="goal-radio" aria-hidden="true"/>
                </button>
                <button type="button" className={`goal-option ${reviewGoal === "warning" ? "selected" : ""}`} onClick={() => setReviewGoal("warning")}>
                  <span className="goal-icon amber"><ShieldAlert size={22}/></span><span className="goal-copy"><strong>Check warning signs</strong><small>Review a lender interaction or offer details</small></span><span className="goal-radio" aria-hidden="true"/>
                </button>
                <button type="button" className={`goal-option ${reviewGoal === "crypto" ? "selected" : ""}`} onClick={() => setReviewGoal("crypto")}>
                  <span className="goal-icon teal"><Coins size={22}/></span><span className="goal-copy"><strong>Check crypto collateral</strong><small>Explore LTV and hypothetical price drops</small></span><span className="goal-radio" aria-hidden="true"/>
                </button>
              </div>
              <div className="guided-actions"><span className="guided-step-hint">You can change your choice at any time.</span><button className="primary-btn" type="button" onClick={() => {setReviewValidation("");setReviewStep(2);}}>Continue <ArrowRight size={17}/></button></div>
            </> }

            {reviewStep === 2 && (<>
              <div className="guided-card-title guided-card-title-row"><div><span className="guided-overline">STEP 2 OF 3</span><h3>{reviewGoal === "loan" ? "Enter the loan details" : reviewGoal === "compare" ? "Add both offers" : reviewGoal === "warning" ? "Describe what happened" : "Enter your collateral assumptions"}</h3><p>{reviewGoal === "loan" ? "Use the figures from the offer or agreement. We will label anything that is still unknown." : reviewGoal === "compare" ? "Use the same loan amount and term for a fair estimate." : reviewGoal === "warning" ? "Paste the relevant wording or describe the request. Leave out private identifiers." : "These are scenario estimates using a price you provide—not live market data."}</p></div><button className="text-back" type="button" onClick={() => {setReviewStep(1);setReviewValidation("");}}><ArrowLeft size={15}/> Change goal</button></div>

              {reviewGoal === "loan" && <div className="guided-fields">
                <label className="guided-field">Loan amount <span>(₹)</span><input inputMode="decimal" type="number" min="1" step="any" placeholder="e.g. 500000" value={reviewAmount} onChange={e => setReviewAmount(e.target.value)}/></label>
                <label className="guided-field">Annual interest rate <span>(%)</span><input type="number" min="0" max="300" step="0.1" placeholder="e.g. 12" value={reviewRate} onChange={e => setReviewRate(e.target.value)}/></label>
                <label className="guided-field">Repayment period <span>(months)</span><input type="number" min="1" max="600" step="1" placeholder="e.g. 36" value={reviewMonths} onChange={e => setReviewMonths(e.target.value)}/></label>
                <label className="guided-field">Known upfront fees <span>(₹)</span><input type="number" min="0" step="any" placeholder="Enter 0 if there is no fee" value={reviewFee} onChange={e => setReviewFee(e.target.value)}/></label>
                <label className="guided-toggle"><input type="checkbox" checked={includeBudget} onChange={e => setIncludeBudget(e.target.checked)}/><span><strong>Also check whether repayments fit my budget</strong><small>This needs take-home income, essential expenses and existing EMIs.</small></span></label>
                {includeBudget && <div className="guided-fields budget-fields"><label className="guided-field">Monthly take-home income <span>(₹)</span><input type="number" min="1" placeholder="e.g. 35000" value={reviewIncome} onChange={e => setReviewIncome(e.target.value)}/></label><label className="guided-field">Essential monthly expenses <span>(₹)</span><input type="number" min="0" placeholder="e.g. 12000" value={reviewExpenses} onChange={e => setReviewExpenses(e.target.value)}/></label><label className="guided-field budget-wide">Existing monthly EMIs <span>(₹)</span><input type="number" min="0" placeholder="Enter 0 if none" value={reviewExistingEmis} onChange={e => setReviewExistingEmis(e.target.value)}/></label></div>}
              </div>}

              {reviewGoal === "compare" && <div className="guided-fields">
                <label className="guided-field">Loan amount for both offers <span>(₹)</span><input type="number" min="1" placeholder="e.g. 500000" value={reviewAmount} onChange={e => setReviewAmount(e.target.value)}/></label>
                <label className="guided-field">Same repayment period <span>(months)</span><input type="number" min="1" max="600" placeholder="e.g. 36" value={reviewMonths} onChange={e => setReviewMonths(e.target.value)}/></label>
                <div className="offer-mini-form"><span className="offer-mini-letter">A</span><div className="offer-mini-fields"><label className="guided-field">Offer A annual rate (%)<input type="number" min="0" step="0.1" placeholder="e.g. 11.5" value={offerARate} onChange={e => setOfferARate(e.target.value)}/></label><label className="guided-field">Offer A known fees (₹)<input type="number" min="0" placeholder="Enter 0 if none" value={offerAFee} onChange={e => setOfferAFee(e.target.value)}/></label></div></div>
                <div className="offer-mini-form"><span className="offer-mini-letter offer-mini-letter-b">B</span><div className="offer-mini-fields"><label className="guided-field">Offer B annual rate (%)<input type="number" min="0" step="0.1" placeholder="e.g. 12" value={offerBRate} onChange={e => setOfferBRate(e.target.value)}/></label><label className="guided-field">Offer B known fees (₹)<input type="number" min="0" placeholder="Enter 0 if none" value={offerBFee} onChange={e => setOfferBFee(e.target.value)}/></label></div></div>
              </div>}

              {reviewGoal === "warning" && <div className="guided-fields single-field"><label className="guided-field">Offer wording or what the lender asked you to do<textarea rows={6} placeholder="Example: The agent said I must pay a processing amount today to guarantee approval…" value={warningObservations} onChange={e => setWarningObservations(e.target.value)} maxLength={1800}/></label><p className="guided-helper">This checks only what you describe here. It does not read an uploaded agreement or independently verify a lender.</p></div>}

              {reviewGoal === "crypto" && <div className="guided-fields">
                <label className="guided-field">ETH collateral quantity<input type="number" min="0" step="any" placeholder="e.g. 0.5" value={cryptoQuantity} onChange={e => setCryptoQuantity(e.target.value)}/></label>
                <label className="guided-field">Assumed ETH price <span>(USD)</span><input type="number" min="0" step="any" placeholder="Enter a price you have checked" value={cryptoPrice} onChange={e => setCryptoPrice(e.target.value)}/></label>
                <label className="guided-field">Loan amount <span>(USDC)</span><input type="number" min="0" step="any" placeholder="e.g. 5000" value={cryptoLoan} onChange={e => setCryptoLoan(e.target.value)}/></label>
                <label className="guided-field">Assumed liquidation threshold <span>(%)</span><input type="number" min="1" max="100" step="any" value={cryptoThreshold} onChange={e => setCryptoThreshold(e.target.value)}/></label>
              </div>}

              {reviewValidation && <p className="guided-validation" role="alert"><CircleHelp size={16}/>{reviewValidation}</p>}
              <div className="guided-actions"><button className="secondary-btn" type="button" onClick={() => setReviewStep(1)}><ArrowLeft size={16}/> Back</button><span className="guided-step-hint">You’ll see a plain-language result here.</span><button className="primary-btn" type="button" onClick={runGuidedReview}>Run my review <ArrowRight size={17}/></button></div>
            </>)}

            {reviewStep === 3 && <>
              <div className="guided-card-title"><span className="guided-overline">STEP 3 OF 3</span><h3>Your review is ready to view</h3><p>The result appears beside this panel. Review its assumptions and limitations before relying on it.</p></div>
              <div className="review-summary-box"><span className="review-summary-check"><Check size={19}/></span><div><strong>{reviewGoal === "loan" ? "Loan cost review" : reviewGoal === "compare" ? "Offer comparison" : reviewGoal === "warning" ? "Warning-sign review" : "Crypto collateral estimate"}</strong><p>{reviewGoal === "loan" ? `Loan amount ${reviewAmount ? `₹${Number(reviewAmount).toLocaleString("en-IN")}` : "not entered"}, ${reviewRate || "—"}% annual rate, ${reviewMonths || "—"} months.` : reviewGoal === "compare" ? `Two offers for ${reviewAmount ? `₹${Number(reviewAmount).toLocaleString("en-IN")}` : "the same loan amount"} over ${reviewMonths || "—"} months.` : reviewGoal === "warning" ? "Your described offer or lender interaction was submitted for review." : `${cryptoQuantity || "—"} ETH collateral using a user-supplied price assumption.`}</p></div></div>
              {reviewError && <div className="guided-error" role="alert"><strong>We couldn’t complete the review</strong><p>{reviewError}</p><button className="secondary-btn" type="button" onClick={runGuidedReview}>Try again</button></div>}
              <div className="guided-actions guided-actions-wrap"><button className="secondary-btn" type="button" onClick={() => {setReviewStep(2);setReviewResult("");setReviewError("");}}><ArrowLeft size={16}/> Edit details</button><button className="primary-btn" type="button" onClick={resetGuidedReview}><RotateCcw size={16}/> Start another review</button></div></> }

          
</div>

          <aside className="guided-result-card" aria-live="polite" aria-label="Loan review result">
            <div className="guided-result-top"><div className="guided-result-mark"><ShieldCheck size={21}/></div><div><span className="guided-overline">YOUR LOAN REVIEW</span><h3>{reviewResult ? "Your results" : reviewLoading ? "Review in progress" : "What you’ll get"}</h3></div><span className={`guided-status ${reviewResult ? "done" : reviewLoading ? "working" : ""}`}>{reviewResult ? "READY" : reviewLoading ? "WORKING" : "PREVIEW"}</span></div>
            {!reviewLoading && !reviewResult && !reviewError && <div className="result-empty-state"><div className="result-empty-graphic"><FileSearch size={30}/></div><h4>Your answer will appear here</h4><p>After you enter the relevant details and run the review, this space will show the result in plain language.</p><div className="result-includes"><span><Check size={14}/> Useful numbers or findings</span><span><Check size={14}/> Assumptions and unknowns</span><span><Check size={14}/> Practical next steps</span></div></div>}
            {reviewLoading && <div className="result-loading-state"><span className="result-spinner"/><h4>Reviewing the details you shared…</h4><p>This may take a few seconds. Keep this page open.</p></div>}
            {reviewError && !reviewLoading && !reviewResult && <div className="result-error-state"><span className="result-error-mark"><CircleHelp size={22}/></span><h4>We couldn’t finish this review</h4><p>{reviewError}</p><p className="result-error-hint">Check your connection and AI service settings. Your entered details remain in the form.</p></div>}
            {reviewResult && !reviewLoading && <ResultCarousel content={reviewResult} />}
            <div className="guided-result-footer"><LockKeyhole size={14}/><span>Estimates are not a lender quote. This service does not approve loans, verify every lender, or replace qualified financial or legal advice.</span></div>
          </aside>
        </div>
      </section>


      <section className="feature-strip wrap" id="how">
        <article className="feature-card"><div className="feature-icon blue"><Calculator/></div><div><h3>Know your real cost</h3><p>Estimate monthly payments and total outflow.</p></div><ArrowRight size={17}/></article>
        <article className="feature-card"><div className="feature-icon purple"><ClipboardCheck/></div><div><h3>Know what to check</h3><p>Use a practical checklist for fees, dates and penalties.</p></div><ArrowRight size={17}/></article>
        <article className="feature-card"><div className="feature-icon teal"><BadgeCheck/></div><div><h3>Evidence, not guesses</h3><p>Separate confirmed facts from unknowns.</p></div><ArrowRight size={17}/></article>
        <article className="feature-card"><div className="feature-icon coral"><LifeBuoy/></div><div><h3>Ask better questions</h3><p>Know what to clarify with the lender before signing.</p></div><ArrowRight size={17}/></article>
      </section>

      <section className="workspace wrap more-tools-heading" id="additional-tools">
        <div className="section-heading more-tools-intro">
          <div><div className="eyebrow">OPTIONAL TOOLS · USE WHAT YOU NEED</div><h2>More ways to check the details.</h2><p>Start with the guided review above. These focused tools can help with a specific calculation, offer comparison, agreement checklist, crypto collateral scenario, or file fingerprint.</p></div>
        </div>
      </section>

<section className="workspace wrap" id="analyze">
        <div className="section-heading"><div><div className="eyebrow">LOAN WORKSPACE</div><h2>Make the numbers make sense.</h2></div><span className="secure-label"><LockKeyhole size={14}/> Estimates based on the details you enter</span></div>
        <div className="workspace-grid">
          <div className="panel guidance-panel">
            <div className="panel-heading"><span className="mini-icon"><ClipboardCheck size={20}/></span><div><h3>Before you accept a loan</h3><p>Have these details ready so you can make a fair comparison.</p></div></div>
            <div className="readiness-list">
              <div><span className="readiness-check">01</span><span><strong>Amount you will actually receive</strong><small>Check whether fees are deducted before payout.</small></span></div>
              <div><span className="readiness-check">02</span><span><strong>Full repayment schedule</strong><small>Confirm EMI, due dates and the total amount payable.</small></span></div>
              <div><span className="readiness-check">03</span><span><strong>All charges and penalties</strong><small>Ask for written details of fees, late payment and early closure.</small></span></div>
              <div><span className="readiness-check">04</span><span><strong>Who is legally lending</strong><small>Verify the lender independently through official sources.</small></span></div>
            </div>
            <button className="guidance-link" type="button" onClick={() => document.getElementById("document-review")?.scrollIntoView({ behavior: "smooth" })}>Open the full agreement checklist <ArrowRight size={16}/></button>
          </div>

          <div className="panel calc-panel">
            <div className="panel-heading"><span className="mini-icon cyan"><Calculator size={20}/></span><div><h3>Understand your repayment</h3><p>Adjust the details to estimate your monthly commitment.</p></div></div>
            <div className="form-grid">
              <label>Loan principal (₹)<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
              <label>Annual interest (%)<input type="number" min="0" max="300" step="0.1" value={rate} onChange={e=>setRate(e.target.value)}/></label>
              <label>Tenure (months)<input type="number" min="1" max="600" value={months} onChange={e=>setMonths(e.target.value)}/></label>
              <label>Upfront fee (₹)<input type="number" min="0" value={fee} onChange={e=>setFee(e.target.value)}/></label>
            </div>
            <div className="result-main"><div><span>Estimated monthly EMI</span><strong>{money(calc.emi)}</strong></div><div className="result-chip"><BarChart3 size={16}/><span>ESTIMATE</span></div></div>
            <div className="result-rows"><div><span>Estimated net amount if fee is deducted</span><strong>{money(calc.net)}</strong></div><div><span>Total of estimated instalments</span><strong>{money(calc.total)}</strong></div><div><span>Interest above principal</span><strong>{money(calc.interest)}</strong></div><div><span>Instalments + upfront fee</span><strong>{money(calc.outflow)}</strong></div></div>
            <p className="fine-print"><CircleHelp size={14}/> EMI estimate assumes monthly reducing-balance interest and equal instalments. It excludes any fees not entered here and is not a lender quote.</p>
          </div>

          <div className="panel report-panel">
            <div className="panel-heading"><span className="mini-icon orange"><TriangleAlert size={20}/></span><div><h3>Before-you-sign checklist</h3><p>Important points to confirm with the lender</p></div></div>
            {["Compare sanctioned amount with net amount received","Check every fee and the repayment schedule","Confirm lender and app relationship using official sources","Keep original agreement, receipts and messages"].map((item,i)=><div className="check-row" key={item}><span className="check-number">0{i+1}</span><span>{item}</span><span className="unknown-pill">Not checked</span></div>)}
            <div className="report-warning"><TriangleAlert size={17}/><span><strong>No risk verdict yet.</strong> This checklist has not verified a lender or your document.</span></div>
          </div>

          <div className="panel chat-panel" id="support">
            <div className="chat-head"><div className="agent-avatar"><Bot size={22}/></div><div><h3>Your loan guide</h3><p><span className="live-dot"/> Clear answers for a more informed decision</p></div><span className="ready-pill">READY</span></div>
            <div className="chat-messages">{messages.map((m,i)=><div key={i} className={`chat-message ${m.role}`}><div className={`chat-bubble ${m.role}`}>{m.role==="agent"&&<span className="bubble-avatar"><Sparkles size={14}/></span>}{m.text}</div></div>)}</div>
            <div className="quick-prompts">{["Estimate my loan cost","Compare two offers","Check warning signs"].map(q=><button key={q} type="button" disabled={chatLoading} onClick={()=>void sendMessage(q)}>{q}</button>)}</div>
            <form className="chat-input" onSubmit={e=>{e.preventDefault();void sendMessage();}}><input aria-label="Message the AI loan assistant" placeholder="Ask about your loan…" value={chatInput} onChange={e=>setChatInput(e.target.value)} disabled={chatLoading} maxLength={2000}/><button aria-label="Send message" type="submit" disabled={chatLoading || !chatInput.trim()}><Send size={17}/></button></form>
            {chatLoading && <p className="chat-disclaimer chat-loading" role="status"><span className="loading-dot"/> Reviewing the details you shared…</p>}
            <p className="chat-disclaimer">For educational guidance only. Loan figures are estimates, not a lender quote. This page does not independently verify lenders or read the contents of uploaded documents. Never share OTPs, passwords, Aadhaar, PAN or wallet recovery details.</p>
          </div>
        </div>
      </section>

<section className="workspace wrap" id="loan-tools">
  <div className="section-heading">
    <div>
      <div className="eyebrow">COMPARE BEFORE YOU COMMIT</div>
      <h2>Compare offers. Spot warning signs.</h2>
    </div>
  </div>
  <LoanSafetyTools />
</section>

<section className="workspace wrap" id="document-review">
  <div className="section-heading">
    <div>
      <div className="eyebrow">DOCUMENT SAFETY</div>
      <h2>Review your loan terms.</h2>
    </div>
  </div>
  <LoanDocumentChecklist />
</section>

<section className="workspace wrap" id="crypto">
  <div className="section-heading">
    <div>
      <div className="eyebrow">WEB3 LOAN SAFETY</div>
      <h2>Understand your crypto loan risk.</h2>
    </div>
  </div>

  <CryptoLoanRiskAnalyzer />
</section>

      <section className="workspace wrap" id="evidence">
        <div className="section-heading">
          <div><div className="eyebrow">LOCAL DOCUMENT VERIFICATION</div><h2>Check whether two files match</h2></div>
          <span className="secure-label"><LockKeyhole size={14}/> SHA-256 · processed in your browser</span>
        </div>
        <div className="panel vault-panel">
          <div className="panel-heading">
            <span className="mini-icon cyan"><Fingerprint size={20}/></span>
            <div><h3>Verify document integrity</h3><p>Calculate a SHA-256 fingerprint and compare it with another local file.</p></div>
          </div>
          <div className="vault-grid">
            <div className="vault-file-card">
              <div className="vault-card-title"><span>01</span><div><h3>Original document</h3><p>Select a file to calculate its hash.</p></div></div>
              <input ref={originalFileRef} className="visually-hidden" type="file" aria-label="Choose original document" onChange={event => void selectOriginalFile(event.target.files?.[0])}/>
              <button className="secondary-btn vault-select" type="button" onClick={() => { if (originalFileRef.current) originalFileRef.current.value = ""; originalFileRef.current?.click(); }} disabled={hashing === "original"}>
                <FileText size={17}/>{hashing === "original" ? "Hashing file…" : originalFile ? "Choose a different file" : "Choose original file"}
              </button>
              {originalFile ? (
                <div className="vault-file-details"><span>File</span><strong>{originalFile.name}</strong><span>Size</span><strong>{formatFileSize(originalFile.size)}</strong></div>
              ) : (
                <div className="vault-empty">No original document selected. Your file remains on this device.</div>
              )}
              <div className="hash-label">SHA-256</div>
              {originalHash ? (
                <>
                  <code className="hash-value">{originalHash}</code>
                  <button className="copy-hash" type="button" onClick={() => void copyOriginalHash()}><Copy size={15}/> Copy hash</button>
                </>
              ) : <div className="hash-placeholder">{hashing === "original" ? "Calculating SHA-256…" : "The 64-character hash will appear here."}</div>}
              {copyMessage && <p className="vault-success" role="status">{copyMessage}</p>}
            </div>

            <div className="vault-file-card">
              <div className="vault-card-title"><span>02</span><div><h3>Compare another file</h3><p>Choose a second file and compare its actual bytes.</p></div></div>
              <input ref={comparisonFileRef} className="visually-hidden" type="file" aria-label="Choose comparison document" disabled={!originalHash || hashing !== null} onChange={event => void selectComparisonFile(event.target.files?.[0])}/>
              <button className="secondary-btn vault-select" type="button" disabled={!originalHash || hashing !== null} onClick={() => { if (comparisonFileRef.current) comparisonFileRef.current.value = ""; comparisonFileRef.current?.click(); }}>
                <FileText size={17}/>{hashing === "comparison" ? "Hashing file…" : comparisonFile ? "Choose a different file" : "Choose comparison file"}
              </button>
              {comparisonFile ? (
                <>
                  <div className="vault-file-details"><span>File</span><strong>{comparisonFile.name}</strong><span>Size</span><strong>{formatFileSize(comparisonFile.size)}</strong></div>
                  <div className="hash-label">SHA-256</div>
                  {comparisonHash ? <code className="hash-value">{comparisonHash}</code> : <div className="hash-placeholder">Calculating SHA-256…</div>}
                  {comparisonHash && originalHash && (
                    <div className={comparisonHash === originalHash ? "comparison-result match" : "comparison-result mismatch"} role="status">
                      <strong>{comparisonHash === originalHash ? "MATCH" : "MISMATCH"}</strong>
                      <span>{comparisonHash === originalHash ? "The SHA-256 hash matches the original." : "The SHA-256 hashes differ."}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="vault-empty">{originalHash ? "No comparison file selected yet." : "Calculate the original file hash first."}</div>
              )}
            </div>
          </div>
          {vaultError && <p className="vault-error" role="alert">{vaultError}</p>}
          <div className="privacy-callout vault-privacy"><LockKeyhole size={16}/><span><strong>Private by design</strong> Files are read and hashed locally using the browser Web Crypto API. Document bytes are not uploaded, stored, or sent to a server.</span></div>
          <p className="fine-print vault-disclaimer"><CircleHelp size={14}/> Each hash is computed from the file&apos;s bytes; matching hashes indicate the contents match. This does not prove who created a document, when it was created, or whether it is authentic or trustworthy.</p>
        </div>
      </section>

      <section className="workspace wrap" id="wallet">
        <div className="section-heading">
          <div>
            <div className="eyebrow">DEMO WALLET · SIMULATION ONLY</div>
            <h2>Transfer flow — prepare, confirm, cancel.</h2>
          </div>
          <span className="secure-label"><LockKeyhole size={14}/> No real funds — local ledger only</span>
        </div>

        <div className="panel" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"}}>
          {/* Balance card */}
          <div style={{background:"var(--panel-bg,#0f1729)",borderRadius:"1rem",padding:"1.5rem",border:"1px solid rgba(99,102,241,.25)"}}>
            <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem"}}>
              <span style={{background:"rgba(99,102,241,.15)",borderRadius:".5rem",padding:".5rem"}}><Wallet size={20} style={{color:"#818cf8"}}/></span>
              <div><div style={{fontSize:".7rem",letterSpacing:".1em",color:"#818cf8",textTransform:"uppercase"}}>Demo Wallet Balance</div>
                <div style={{fontSize:"1.6rem",fontWeight:700,color:"#e2e8f0"}}>
                  {walletBalance && typeof walletBalance.balance === "number" && !isNaN(walletBalance.balance)
                    ? `${walletBalance.balance.toFixed(2)} ${walletBalance.asset}`
                    : "—"}
                </div>
              </div>
              <button onClick={()=>{void fetchBalance();}} disabled={walletLoading} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#818cf8"}} aria-label="Refresh balance"><RefreshCw size={16} className={walletLoading?"spin":""}/></button>
            </div>
            <p style={{fontSize:".75rem",color:"#64748b",margin:0}}>Simulated SIM-USDC. Not real crypto. No blockchain transactions.</p>
          </div>

          {/* Transfer form / flow */}
          <div style={{background:"var(--panel-bg,#0f1729)",borderRadius:"1rem",padding:"1.5rem",border:"1px solid rgba(99,102,241,.25)"}}>
            {walletStep === "idle" && (
              <>
                <h3 style={{marginBottom:"1rem",fontSize:"1rem",color:"#e2e8f0"}}>Prepare a demo transfer</h3>
                <label style={{fontSize:".8rem",color:"#94a3b8",display:"block",marginBottom:".25rem"}}>Recipient address (0x…)</label>
                <input id="wallet-recipient" value={transferRecipient} onChange={e=>setTransferRecipient(e.target.value)}
                  placeholder="0xabcdef1234567890" style={{width:"100%",marginBottom:".75rem",padding:".5rem .75rem",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:".5rem",color:"#e2e8f0",fontSize:".875rem"}}/>
                <label style={{fontSize:".8rem",color:"#94a3b8",display:"block",marginBottom:".25rem"}}>Amount (SIM-USDC)</label>
                <input id="wallet-amount" type="number" value={transferAmount} onChange={e=>setTransferAmount(e.target.value)}
                  placeholder="10.00" min="0.01" style={{width:"100%",marginBottom:"1rem",padding:".5rem .75rem",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:".5rem",color:"#e2e8f0",fontSize:".875rem"}}/>
                <button id="wallet-prepare-btn" onClick={()=>void handlePrepare()} disabled={walletLoading}
                  style={{width:"100%",padding:".6rem",background:"#6366f1",color:"#fff",border:"none",borderRadius:".5rem",fontWeight:600,cursor:"pointer",opacity:walletLoading?.6:1}}>
                  {walletLoading ? "Preparing…" : "Prepare Transfer"}
                </button>
              </>
            )}

            {walletStep === "prepared" && preparedTx && (
              <>
                <h3 style={{marginBottom:".75rem",fontSize:"1rem",color:"#fbbf24"}}>⚠ Confirm this demo transfer?</h3>
                <div style={{background:"rgba(251,191,36,.06)",borderRadius:".5rem",padding:".75rem",marginBottom:"1rem",fontSize:".85rem",color:"#e2e8f0",lineHeight:1.6}}>
                  <div><span style={{color:"#94a3b8"}}>To:</span> <code style={{fontSize:".8rem"}}>{preparedTx.recipient}</code></div>
                  <div><span style={{color:"#94a3b8"}}>Amount:</span> {(preparedTx.amountCents/100).toFixed(2)} SIM-USDC</div>
                  <div><span style={{color:"#94a3b8"}}>Total debit:</span> {(preparedTx.totalDebit/100).toFixed(2)} SIM-USDC</div>
                  <div style={{marginTop:".5rem",fontSize:".75rem",color:"#64748b"}}>Simulation only. No real funds.</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".5rem"}}>
                  <button id="wallet-confirm-btn" onClick={()=>void handleConfirm()} disabled={walletLoading}
                    style={{padding:".6rem",background:"#10b981",color:"#fff",border:"none",borderRadius:".5rem",fontWeight:600,cursor:"pointer",opacity:walletLoading?.6:1}}>
                    <CheckCircle2 size={15} style={{marginRight:".3rem",verticalAlign:"middle"}}/>{walletLoading?"Confirming…":"Confirm"}
                  </button>
                  <button id="wallet-cancel-btn" onClick={()=>void handleCancel()} disabled={walletLoading}
                    style={{padding:".6rem",background:"rgba(239,68,68,.15)",color:"#f87171",border:"1px solid rgba(239,68,68,.3)",borderRadius:".5rem",fontWeight:600,cursor:"pointer",opacity:walletLoading?.6:1}}>
                    <XCircle size={15} style={{marginRight:".3rem",verticalAlign:"middle"}}/>{walletLoading?"Cancelling…":"Cancel"}
                  </button>
                </div>
              </>
            )}

            {walletStep === "confirmed" && (
              <div style={{textAlign:"center",padding:"1rem 0"}}>
                <CheckCircle2 size={36} style={{color:"#10b981",marginBottom:".5rem"}}/>
                <h3 style={{color:"#10b981",margin:"0 0 .5rem"}}>Demo transfer confirmed!</h3>
                <p style={{fontSize:".8rem",color:"#94a3b8",marginBottom:".75rem"}}>txId: <code style={{fontSize:".75rem"}}>{confirmedTxId}</code></p>
                <p style={{fontSize:".75rem",color:"#64748b",margin:"0 0 1rem"}}>Simulation only — no real blockchain transaction occurred.</p>
                <button onClick={resetWallet} style={{padding:".5rem 1rem",background:"rgba(99,102,241,.15)",color:"#818cf8",border:"1px solid rgba(99,102,241,.3)",borderRadius:".5rem",cursor:"pointer",fontSize:".85rem"}}>
                  <RotateCcw size={14} style={{marginRight:".3rem",verticalAlign:"middle"}}/> New transfer
                </button>
              </div>
            )}

            {walletStep === "cancelled" && (
              <div style={{textAlign:"center",padding:"1rem 0"}}>
                <XCircle size={36} style={{color:"#f87171",marginBottom:".5rem"}}/>
                <h3 style={{color:"#f87171",margin:"0 0 .5rem"}}>Transfer cancelled</h3>
                <p style={{fontSize:".8rem",color:"#94a3b8",marginBottom:"1rem"}}>The prepared transfer was cancelled. Balance unchanged.</p>
                <button onClick={resetWallet} style={{padding:".5rem 1rem",background:"rgba(99,102,241,.15)",color:"#818cf8",border:"1px solid rgba(99,102,241,.3)",borderRadius:".5rem",cursor:"pointer",fontSize:".85rem"}}>
                  <RotateCcw size={14} style={{marginRight:".3rem",verticalAlign:"middle"}}/> New transfer
                </button>
              </div>
            )}

            {walletError && <p role="alert" style={{marginTop:".75rem",color:"#f87171",fontSize:".8rem",background:"rgba(239,68,68,.08)",borderRadius:".4rem",padding:".5rem .75rem"}}>{walletError}</p>}
          </div>
        </div>

        {/* Transaction history */}
        <div className="panel" style={{marginTop:"1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:".5rem"}}>
              <History size={18} style={{color:"#818cf8"}}/>
              <h3 style={{margin:0,fontSize:"1rem",color:"#e2e8f0"}}>Recent demo transactions</h3>
            </div>
            <button onClick={()=>void fetchHistory()} disabled={historyLoading} style={{background:"none",border:"none",cursor:"pointer",color:"#818cf8",fontSize:".8rem",display:"flex",alignItems:"center",gap:".3rem"}}>
              <RefreshCw size={13} className={historyLoading?"spin":""}/> Refresh
            </button>
          </div>
          {txHistory.length === 0 ? (
            <p style={{color:"#64748b",fontSize:".85rem",textAlign:"center",padding:"1.5rem 0"}}>No demo transactions yet. Use the transfer form above.</p>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:".82rem",color:"#cbd5e1"}}>
                <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,.07)",color:"#64748b",textAlign:"left"}}>
                  <th style={{padding:".5rem .75rem"}}>Status</th>
                  <th style={{padding:".5rem .75rem"}}>Amount</th>
                  <th style={{padding:".5rem .75rem"}}>Recipient</th>
                  <th style={{padding:".5rem .75rem"}}>Date</th>
                </tr></thead>
                <tbody>
                  {txHistory.map(tx => (
                    <tr key={tx.id} style={{borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                      <td style={{padding:".5rem .75rem"}}>
                        <span style={{padding:".2rem .5rem",borderRadius:"99px",fontSize:".72rem",fontWeight:600,
                          background: tx.status==="confirmed"?"rgba(16,185,129,.15)":tx.status==="cancelled"?"rgba(239,68,68,.12)":"rgba(251,191,36,.12)",
                          color: tx.status==="confirmed"?"#10b981":tx.status==="cancelled"?"#f87171":"#fbbf24"}}>
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{padding:".5rem .75rem"}}>{tx.amount} SIM-USDC</td>
                      <td style={{padding:".5rem .75rem"}}><code style={{fontSize:".75rem"}}>{tx.recipient?.slice(0,14)}…</code></td>
                      <td style={{padding:".5rem .75rem",color:"#64748b"}}>{new Date(tx.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="bottom-banner wrap" id="compare"><div className="banner-glow"/><div className="banner-icon"><ShieldCheck size={30}/></div><div><div className="eyebrow">BUILT AROUND CLARITY</div><h2>Understand first. Decide with confidence.</h2><p>DebtTrap Escape helps organize loan information; it does not replace qualified financial or legal advice.</p></div><button className="secondary-btn" onClick={()=>document.getElementById("start-review")?.scrollIntoView({behavior:"smooth"})}>Start a review <ArrowRight size={16}/></button></section>

      <footer className="footer wrap"><a className="brand small-brand" href="#"><BrandLogo className="brand-mark" /><span><strong>DebtTrap <b>Escape</b></strong><small>Know. Check. Compare. Stay Safe.</small></span></a><span>Prototype · Built for transparent loan decisions</span><span>Not financial or legal advice</span></footer>
    </main>
  );
}