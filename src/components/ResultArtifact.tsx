"use client";

import React, { useState, useEffect } from "react";
import {
  Calculator,
  Scale,
  PieChart,
  Coins,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
  TrendingDown,
  ClipboardCheck,
  ExternalLink,
  Volume2,
  Square,
} from "lucide-react";
import { TaskResultContext } from "@/types/midnight";
import { formatINR } from "@/lib/agentTools";
import {
  speakText,
  stopSpeaking,
  isSpeechSynthesisSupported,
} from "@/lib/speech-service";

function getSpokenSummaryText(result: TaskResultContext): string {
  const { taskType, loanCalc, comparison, affordability, cryptoRisk, redFlags, docReview, sepoliaTransfer, baseSepoliaTransfer } = result;

  switch (taskType) {
    case "loan_cost":
      if (!loanCalc) return result.summaryText || "Loan calculation result delivered.";
      return `Loan calculation completed. For a principal of ${loanCalc.principal} rupees over ${loanCalc.termMonths} months at ${loanCalc.annualRate} percent interest, your monthly EMI is ${Math.round(loanCalc.monthlyEmi)} rupees. Total interest payable is ${Math.round(loanCalc.totalInterest)} rupees, resulting in a total net outflow of ${Math.round(loanCalc.totalOutflow)} rupees. Upfront fee is ${loanCalc.upfrontFee} rupees.`;

    case "compare_offers":
      if (!comparison) return result.summaryText || "Loan comparison result delivered.";
      return `Loan offer comparison completed. ${comparison.cheaperOffer === "equal" ? "Both loan offers have identical total costs." : `Offer ${comparison.cheaperOffer} is cheaper with savings of ${Math.round(comparison.difference)} rupees.`} Offer A requires an EMI of ${Math.round(comparison.offerA.emi)} rupees and total outflow of ${Math.round(comparison.offerA.totalOutflow)} rupees. Offer B requires an EMI of ${Math.round(comparison.offerB.emi)} rupees and total outflow of ${Math.round(comparison.offerB.totalOutflow)} rupees.`;

    case "affordability":
      if (!affordability) return result.summaryText || "Affordability analysis completed.";
      return `Affordability assessment completed. With a monthly net income of ${affordability.income} rupees, your proposed EMI of ${Math.round(affordability.newEmi)} rupees results in an EMI-to-income ratio of ${affordability.emiToIncomeRatio.toFixed(1)} percent, leaving ${Math.round(affordability.disposableLeftover)} rupees disposable cushion. The loan is assessed as ${affordability.isAffordableIndicator ? "affordable within safe limits" : "carrying elevated financial stress"}.`;

    case "crypto_risk":
      if (!cryptoRisk) return result.summaryText || "Crypto collateral analysis completed.";
      return `Crypto collateral risk analysis completed for loan amount of ${cryptoRisk.loanAmountUsdc} USDC. Current loan-to-value ratio is ${cryptoRisk.loanToValuePercent.toFixed(1)} percent. Liquidation occurs if collateral price drops by ${cryptoRisk.priceDropToThresholdPercent.toFixed(1)} percent to ${cryptoRisk.estimatedLiquidationPriceUsd} dollars. Risk tier is ${cryptoRisk.risk}.`;

    case "red_flags":
      if (!redFlags) return result.summaryText || "Warning signs review completed.";
      return `Loan warning signs screening completed. The check evaluated text and detected ${redFlags.countVerified} potential warning signs.`;

    case "doc_review":
      if (!docReview) return result.summaryText || "Document review completed.";
      return `Loan document review completed. Analyzed ${docReview.totalClausesChecked} clauses. ${docReview.missingClauses.length} critical clauses were missing or require verification before signing.`;

    case "wallet_transfer":
      if (baseSepoliaTransfer) {
        return `Base Sepolia testnet transfer confirmed. Transferred ${baseSepoliaTransfer.amount} ETH to address ending in ${baseSepoliaTransfer.recipient.slice(-6)} with transaction hash ${baseSepoliaTransfer.txHash.slice(0, 10)}.`;
      }
      if (sepoliaTransfer) {
        return `Sepolia testnet transfer confirmed. Transferred ${sepoliaTransfer.amount} USDC to address ending in ${sepoliaTransfer.recipient.slice(-6)} with transaction hash ${sepoliaTransfer.txHash.slice(0, 10)}.`;
      }
      return result.summaryText || "Wallet transfer workflow completed.";

    default:
      return result.summaryText || "Task result established and verified.";
  }
}

interface ResultArtifactProps {
  result: TaskResultContext;
  onNewTask: () => void;
}

export function ResultArtifact({ result, onNewTask }: ResultArtifactProps) {
  const { taskType, loanCalc, comparison, affordability, cryptoRisk, redFlags, docReview, preparedTransfer, confirmedTxId, sepoliaTransfer, baseSepoliaTransfer } = result;

  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [speechLang, setSpeechLang] = useState("en-US");
  const [ttsSupported, setTtsSupported] = useState(true);

  useEffect(() => {
    setTtsSupported(isSpeechSynthesisSupported());
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleToggleSpeech = () => {
    if (isPlayingSpeech) {
      stopSpeaking();
      setIsPlayingSpeech(false);
      return;
    }

    const textToSpeak = getSpokenSummaryText(result);
    const success = speakText(textToSpeak, {
      lang: speechLang,
      onStart: () => setIsPlayingSpeech(true),
      onEnd: () => setIsPlayingSpeech(false),
      onError: () => setIsPlayingSpeech(false),
    });

    if (!success) {
      setIsPlayingSpeech(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Primary Result Container Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#8E9EB5]/25 bg-[#0D192A]/95 p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all">
        {/* Ambient Top Glow Accent */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-[#56D9F5]/10 blur-3xl" />

        {/* Header Bar */}
        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#8E9EB5]/15 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#122238] text-[#56D9F5] shadow-inner">
              {taskType === "loan_cost" && <Calculator size={22} />}
              {taskType === "compare_offers" && <Scale size={22} className="text-[#39D6C0]" />}
              {taskType === "affordability" && <PieChart size={22} className="text-[#78F5CF]" />}
              {taskType === "crypto_risk" && <Coins size={22} className="text-[#56D9F5]" />}
              {taskType === "red_flags" && <ShieldAlert size={22} className="text-[#F4BB63]" />}
              {taskType === "doc_review" && <ClipboardCheck size={22} className="text-[#78F5CF]" />}
              {taskType === "wallet_transfer" && <Wallet size={22} className="text-[#39D6C0]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#56D9F5]">
                  Task Execution Result
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#78F5CF]/15 px-2 py-0.5 text-[10px] font-semibold text-[#78F5CF]">
                  <CheckCircle2 size={11} />
                  <span>Delivered</span>
                </span>
              </div>
              <h1 className="text-xl font-bold text-[#F1F5F9] md:text-2xl mt-0.5">
                {result.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Spoken Audio Read-Aloud Button */}
            <button
              id="read-aloud-result-btn"
              type="button"
              onClick={handleToggleSpeech}
              disabled={!ttsSupported}
              title={
                !ttsSupported
                  ? "Speech synthesis not supported in this browser"
                  : isPlayingSpeech
                  ? "Stop spoken reading"
                  : "Read result aloud"
              }
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isPlayingSpeech
                  ? "border-[#56D9F5] bg-[#56D9F5]/20 text-[#56D9F5] shadow-[0_0_12px_rgba(86,217,245,0.35)]"
                  : "border-[#8E9EB5]/20 bg-[#122238]/70 text-[#8E9EB5] hover:border-[#56D9F5]/40 hover:text-[#56D9F5] hover:bg-[#122238]"
              }`}
            >
              {isPlayingSpeech ? (
                <>
                  <Square size={13} className="fill-current" />
                  <span>Stop Audio</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <span className="w-0.5 bg-[#56D9F5] rounded-full voice-wave-1 h-3" />
                    <span className="w-0.5 bg-[#56D9F5] rounded-full voice-wave-2 h-3" />
                    <span className="w-0.5 bg-[#56D9F5] rounded-full voice-wave-3 h-3" />
                  </div>
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  <span>Read Aloud</span>
                </>
              )}
            </button>

            <button
              id="new-task-btn"
              type="button"
              onClick={onNewTask}
              className="flex items-center gap-1.5 rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 px-3 py-1.5 text-xs text-[#8E9EB5] hover:bg-[#122238] hover:text-[#F1F5F9] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Active Spoken Audio Playback Banner */}
        {isPlayingSpeech && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#56D9F5]/30 bg-[#56D9F5]/10 px-4 py-2.5 text-xs text-[#56D9F5] animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5 h-4">
                <span className="w-1 bg-[#56D9F5] rounded-full voice-wave-1" />
                <span className="w-1 bg-[#56D9F5] rounded-full voice-wave-2" />
                <span className="w-1 bg-[#56D9F5] rounded-full voice-wave-3" />
                <span className="w-1 bg-[#56D9F5] rounded-full voice-wave-4" />
              </div>
              <span className="font-medium">Reading verified task analysis aloud…</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={speechLang}
                onChange={(e) => {
                  setSpeechLang(e.target.value);
                  stopSpeaking();
                  setIsPlayingSpeech(false);
                }}
                className="rounded border border-[#56D9F5]/30 bg-[#122238] px-2 py-0.5 text-[10px] text-[#F1F5F9] outline-none cursor-pointer"
              >
                <option value="en-US">English (US)</option>
                <option value="en-IN">English (India)</option>
              </select>
              <button
                type="button"
                onClick={handleToggleSpeech}
                className="flex items-center gap-1 rounded border border-[#56D9F5]/40 bg-[#122238] px-2.5 py-1 text-[11px] font-semibold text-[#56D9F5] hover:bg-[#56D9F5]/20 transition-colors"
              >
                <Square size={10} className="fill-current" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TASK SPECIFIC BODY
        ========================================================================= */}

        {/* 1. LOAN COST RESULT */}
        {taskType === "loan_cost" && loanCalc && (
          <div className="space-y-6">
            {/* Key Hero Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[#56D9F5]/25 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Monthly EMI</span>
                <div className="mt-1 text-lg font-bold text-[#56D9F5] md:text-xl font-mono">
                  {formatINR(loanCalc.monthlyEmi)}
                </div>
                <span className="text-[10px] text-[#8E9EB5]/70">For {loanCalc.termMonths} months</span>
              </div>

              <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Total Interest</span>
                <div className="mt-1 text-lg font-bold text-[#F1F5F9] md:text-xl font-mono">
                  {formatINR(loanCalc.totalInterest)}
                </div>
                <span className="text-[10px] text-[#8E9EB5]/70">
                  {((loanCalc.totalInterest / loanCalc.principal) * 100).toFixed(1)}% of principal
                </span>
              </div>

              <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Net Disbursed</span>
                <div className="mt-1 text-lg font-bold text-[#F1F5F9] md:text-xl font-mono">
                  {formatINR(loanCalc.netDisbursed)}
                </div>
                <span className="text-[10px] text-[#8E9EB5]/70">
                  After {formatINR(loanCalc.upfrontFee)} fee
                </span>
              </div>

              <div className="rounded-xl border border-[#78F5CF]/25 bg-[#78F5CF]/10 p-3.5">
                <span className="text-[11px] font-semibold text-[#78F5CF]">Total Outflow</span>
                <div className="mt-1 text-lg font-bold text-[#78F5CF] md:text-xl font-mono">
                  {formatINR(loanCalc.totalOutflow)}
                </div>
                <span className="text-[10px] text-[#78F5CF]/80">Installments + Fees</span>
              </div>
            </div>

            {/* Visual Repayment Breakdown Bar */}
            <div className="space-y-2 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/40 p-4">
              <div className="flex items-center justify-between text-xs text-[#8E9EB5]">
                <span>Repayment Composition</span>
                <span>Total: {formatINR(loanCalc.totalOutflow)}</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#08111F]">
                <div
                  style={{ width: `${(loanCalc.principal / loanCalc.totalOutflow) * 100}%` }}
                  className="bg-[#56D9F5]"
                  title="Principal"
                />
                <div
                  style={{ width: `${(loanCalc.totalInterest / loanCalc.totalOutflow) * 100}%` }}
                  className="bg-[#39D6C0]"
                  title="Interest"
                />
                <div
                  style={{ width: `${(loanCalc.upfrontFee / loanCalc.totalOutflow) * 100}%` }}
                  className="bg-[#F4BB63]"
                  title="Fees"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8E9EB5]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#56D9F5]" />
                  Principal: {formatINR(loanCalc.principal)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#39D6C0]" />
                  Interest: {formatINR(loanCalc.totalInterest)}
                </span>
                {loanCalc.upfrontFee > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F4BB63]" />
                    Upfront Fee: {formatINR(loanCalc.upfrontFee)}
                  </span>
                )}
              </div>
            </div>

            {/* Assumptions & Limitations */}
            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/30 p-4 text-xs text-[#8E9EB5] space-y-1.5">
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 mb-1">
                <Info size={14} className="text-[#56D9F5]" />
                <span>Calculation Basis & Assumptions</span>
              </span>
              {loanCalc.assumptions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#56D9F5]">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. COMPARE OFFERS RESULT */}
        {taskType === "compare_offers" && comparison && (
          <div className="space-y-6">
            {/* Winner Banner */}
            <div className="rounded-xl border border-[#39D6C0]/30 bg-[#39D6C0]/10 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#39D6C0]">
                  Cost Analysis Outcome
                </span>
                <div className="text-base font-bold text-[#F1F5F9] mt-0.5">
                  {comparison.cheaperOffer === "equal"
                    ? "Both offers have identical total estimated outflows."
                    : `Offer ${comparison.cheaperOffer} is cheaper by ${formatINR(comparison.difference)}`}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8E9EB5]">Principal & Term</span>
                <div className="text-xs font-semibold text-[#F1F5F9]">
                  {formatINR(comparison.principal)} · {comparison.termMonths} mo
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Offer A */}
              <div
                className={`rounded-xl border p-4 transition-all ${
                  comparison.cheaperOffer === "A"
                    ? "border-[#39D6C0] bg-[#122238]/80 shadow-md shadow-[#39D6C0]/10"
                    : "border-[#8E9EB5]/20 bg-[#122238]/40"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#F1F5F9]">Offer A</span>
                  {comparison.cheaperOffer === "A" && (
                    <span className="rounded-full bg-[#39D6C0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#39D6C0]">
                      Lower Outflow
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Nominal Rate</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{comparison.offerA.rate}%</span>
                  </div>
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Monthly EMI</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{formatINR(comparison.offerA.emi)}</span>
                  </div>
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Upfront Fee</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{formatINR(comparison.offerA.fee)}</span>
                  </div>
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Total Interest</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{formatINR(comparison.offerA.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#8E9EB5]/15 pt-2 font-bold text-sm">
                    <span className="text-[#8E9EB5]">Total Outflow</span>
                    <span className="font-mono text-[#39D6C0]">{formatINR(comparison.offerA.totalOutflow)}</span>
                  </div>
                </div>
              </div>

              {/* Offer B */}
              <div
                className={`rounded-xl border p-4 transition-all ${
                  comparison.cheaperOffer === "B"
                    ? "border-[#39D6C0] bg-[#122238]/80 shadow-md shadow-[#39D6C0]/10"
                    : "border-[#8E9EB5]/20 bg-[#122238]/40"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#F1F5F9]">Offer B</span>
                  {comparison.cheaperOffer === "B" && (
                    <span className="rounded-full bg-[#39D6C0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#39D6C0]">
                      Lower Outflow
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Nominal Rate</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{comparison.offerB.rate}%</span>
                  </div>
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Monthly EMI</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{formatINR(comparison.offerB.emi)}</span>
                  </div>
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Upfront Fee</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{formatINR(comparison.offerB.fee)}</span>
                  </div>
                  <div className="flex justify-between text-[#8E9EB5]">
                    <span>Total Interest</span>
                    <span className="font-mono text-[#F1F5F9] font-medium">{formatINR(comparison.offerB.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#8E9EB5]/15 pt-2 font-bold text-sm">
                    <span className="text-[#8E9EB5]">Total Outflow</span>
                    <span className="font-mono text-[#39D6C0]">{formatINR(comparison.offerB.totalOutflow)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assumptions */}
            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/30 p-4 text-xs text-[#8E9EB5] space-y-1.5">
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 mb-1">
                <Info size={14} className="text-[#39D6C0]" />
                <span>Comparison Assumptions</span>
              </span>
              {comparison.assumptions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#39D6C0]">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. AFFORDABILITY RESULT */}
        {taskType === "affordability" && affordability && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-xl border border-[#78F5CF]/25 bg-[#122238]/70 p-4">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Total EMI-to-Income</span>
                <div className="mt-1 text-2xl font-bold font-mono text-[#78F5CF]">
                  {affordability.emiToIncomeRatio.toFixed(1)}%
                </div>
                <span className="text-[10px] text-[#8E9EB5]">
                  Existing ({formatINR(affordability.existingEmis)}) + New ({formatINR(affordability.newEmi)})
                </span>
              </div>

              <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 p-4">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Remaining Cash Leftover</span>
                <div
                  className={`mt-1 text-2xl font-bold font-mono ${
                    affordability.disposableLeftover < 0 ? "text-[#F4BB63]" : "text-[#F1F5F9]"
                  }`}
                >
                  {formatINR(affordability.disposableLeftover)}
                </div>
                <span className="text-[10px] text-[#8E9EB5]">After living costs and all EMIs</span>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  affordability.isAffordableIndicator
                    ? "border-[#78F5CF]/30 bg-[#78F5CF]/10"
                    : "border-[#F4BB63]/40 bg-[#F4BB63]/10"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E9EB5]">
                  Stress Indicator
                </span>
                <div
                  className={`mt-1 text-base font-bold ${
                    affordability.isAffordableIndicator ? "text-[#78F5CF]" : "text-[#F4BB63]"
                  }`}
                >
                  {affordability.isAffordableIndicator
                    ? "Non-Negative Reported Cashflow"
                    : "Deficit Cashflow Alert"}
                </div>
                <span className="text-[10px] text-[#8E9EB5]">Based on user-supplied inputs</span>
              </div>
            </div>

            {/* Income Allocation Bar */}
            <div className="space-y-2 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/40 p-4">
              <span className="text-xs font-medium text-[#8E9EB5]">Monthly In-Hand Income Distribution</span>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#08111F]">
                <div
                  style={{ width: `${Math.min(100, (affordability.expenses / affordability.income) * 100)}%` }}
                  className="bg-[#56D9F5]"
                  title="Living Expenses"
                />
                <div
                  style={{ width: `${Math.min(100, (affordability.existingEmis / affordability.income) * 100)}%` }}
                  className="bg-[#F4BB63]"
                  title="Existing EMIs"
                />
                <div
                  style={{ width: `${Math.min(100, (affordability.newEmi / affordability.income) * 100)}%` }}
                  className="bg-[#39D6C0]"
                  title="New Loan EMI"
                />
                {affordability.disposableLeftover > 0 && (
                  <div
                    style={{ width: `${(affordability.disposableLeftover / affordability.income) * 100}%` }}
                    className="bg-[#78F5CF]"
                    title="Buffer Leftover"
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8E9EB5]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#56D9F5]" />
                  Living: {formatINR(affordability.expenses)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#F4BB63]" />
                  Existing EMIs: {formatINR(affordability.existingEmis)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#39D6C0]" />
                  New EMI: {formatINR(affordability.newEmi)}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-[#78F5CF]">
                  <span className="h-2 w-2 rounded-full bg-[#78F5CF]" />
                  Buffer: {formatINR(affordability.disposableLeftover)}
                </span>
              </div>
            </div>

            {/* Limitations */}
            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/30 p-4 text-xs text-[#8E9EB5] space-y-1.5">
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 mb-1">
                <Info size={14} className="text-[#78F5CF]" />
                <span>Limitations of Indicator</span>
              </span>
              {affordability.limitations.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#78F5CF]">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CRYPTO COLLATERAL RISK RESULT */}
        {taskType === "crypto_risk" && cryptoRisk && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-[#56D9F5]/25 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Current LTV</span>
                <div className="mt-1 text-xl font-bold font-mono text-[#56D9F5]">
                  {cryptoRisk.loanToValuePercent}%
                </div>
                <span className="text-[10px] text-[#8E9EB5]">Max: {cryptoRisk.liquidationThresholdPercent}%</span>
              </div>

              <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Liquidation Price</span>
                <div className="mt-1 text-xl font-bold font-mono text-[#F4BB63]">
                  ${cryptoRisk.estimatedLiquidationPriceUsd}
                </div>
                <span className="text-[10px] text-[#8E9EB5]">Collateral trigger</span>
              </div>

              <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Safety Drop Buffer</span>
                <div className="mt-1 text-xl font-bold font-mono text-[#78F5CF]">
                  {cryptoRisk.priceDropToThresholdPercent}%
                </div>
                <span className="text-[10px] text-[#8E9EB5]">Price drop to liquidation</span>
              </div>

              <div
                className={`rounded-xl border p-3.5 ${
                  cryptoRisk.risk === "High"
                    ? "border-[#F4BB63]/50 bg-[#F4BB63]/10 text-[#F4BB63]"
                    : cryptoRisk.risk === "Medium"
                    ? "border-[#56D9F5]/40 bg-[#56D9F5]/10 text-[#56D9F5]"
                    : "border-[#78F5CF]/40 bg-[#78F5CF]/10 text-[#78F5CF]"
                }`}
              >
                <span className="text-[11px] font-semibold uppercase">Risk Profile</span>
                <div className="mt-1 text-xl font-bold font-mono">{cryptoRisk.risk}</div>
                <span className="text-[10px] opacity-80">
                  {cryptoRisk.thresholdReached ? "Threshold Breached" : "Within Safe Bounds"}
                </span>
              </div>
            </div>

            {/* Stress Test Scenarios */}
            <div className="space-y-2 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/40 p-4">
              <span className="text-xs font-semibold text-[#F1F5F9] flex items-center gap-1.5">
                <TrendingDown size={14} className="text-[#56D9F5]" />
                <span>Deterministic Price-Drop Stress Tests</span>
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#8E9EB5]/15 text-[#8E9EB5]">
                      <th className="py-2">Price Drop</th>
                      <th className="py-2">Stressed Collateral Price</th>
                      <th className="py-2">Stressed LTV</th>
                      <th className="py-2">Liquidation Triggered?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8E9EB5]/10 font-mono">
                    {cryptoRisk.stressTests.map((t, idx) => (
                      <tr key={idx} className="text-[#F1F5F9]">
                        <td className="py-2 text-[#56D9F5]">-{t.assumedPriceDropPercent}%</td>
                        <td className="py-2">${t.stressedCollateralPriceUsd}</td>
                        <td className="py-2">{t.stressedLoanToValuePercent}%</td>
                        <td className="py-2">
                          {t.assumedThresholdReached ? (
                            <span className="rounded bg-[#F4BB63]/20 px-2 py-0.5 text-[10px] font-bold text-[#F4BB63]">
                              YES (Liquidated)
                            </span>
                          ) : (
                            <span className="rounded bg-[#78F5CF]/20 px-2 py-0.5 text-[10px] font-bold text-[#78F5CF]">
                              NO (Safe)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assumptions */}
            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/30 p-4 text-xs text-[#8E9EB5] space-y-1.5">
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 mb-1">
                <Info size={14} className="text-[#56D9F5]" />
                <span>Modeling Assumptions</span>
              </span>
              {cryptoRisk.assumptions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#56D9F5]">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. RED FLAGS RESULT */}
        {taskType === "red_flags" && redFlags && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/60 p-4">
              <div>
                <span className="text-[11px] font-semibold text-[#8E9EB5] uppercase">Evidence Verification</span>
                <div className="text-base font-bold text-[#F1F5F9] mt-0.5">
                  {redFlags.countVerified === 0
                    ? "No known predatory red flags detected in quoted text."
                    : `${redFlags.countVerified} Predatory Signal${redFlags.countVerified > 1 ? "s" : ""} Verified with Verbatim Evidence`}
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  redFlags.countVerified === 0
                    ? "bg-[#78F5CF]/20 text-[#78F5CF]"
                    : "bg-[#F4BB63]/20 text-[#F4BB63]"
                }`}
              >
                {redFlags.countVerified === 0 ? "Clear Scan" : "Action Required"}
              </span>
            </div>

            {redFlags.verifiedFlags.length > 0 && (
              <div className="space-y-3">
                {redFlags.verifiedFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#F4BB63]/30 bg-[#122238]/70 p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-[#F4BB63]" />
                        <span className="text-sm font-bold text-[#F1F5F9]">{flag.label}</span>
                      </div>
                      <span className="rounded bg-[#F4BB63]/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#F4BB63]">
                        {flag.severity} Severity
                      </span>
                    </div>

                    <div className="rounded-lg bg-[#08111F] p-3 text-xs">
                      <span className="text-[10px] text-[#8E9EB5] uppercase font-bold tracking-wider block mb-1">
                        Verbatim Evidence Match:
                      </span>
                      <p className="font-mono text-[#56D9F5] italic">&ldquo;{flag.evidenceQuote}&rdquo;</p>
                    </div>

                    <div className="text-xs text-[#8E9EB5] space-y-1">
                      <p>
                        <strong className="text-[#F1F5F9]">Why this is a concern:</strong> {flag.reason}
                      </p>
                      <p className="text-[#78F5CF]">
                        <strong>Recommended next step:</strong> {flag.nextStep}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Limitations */}
            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/30 p-4 text-xs text-[#8E9EB5] space-y-1.5">
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 mb-1">
                <Info size={14} className="text-[#F4BB63]" />
                <span>Verification Scope & Limitations</span>
              </span>
              {redFlags.limitations.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#F4BB63]">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. DOCUMENT REVIEW RESULT */}
        {taskType === "doc_review" && docReview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#78F5CF]/25 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Verified Disclosures</span>
                <div className="mt-1 text-lg font-bold text-[#78F5CF] md:text-xl font-mono">
                  {docReview.totalClausesChecked} / {docReview.totalRequiredClauses}
                </div>
                <span className="text-[10px] text-[#8E9EB5]/70">Standard Consumer Protections</span>
              </div>

              <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Compliance Score</span>
                <div className="mt-1 text-lg font-bold text-[#F1F5F9] md:text-xl font-mono">
                  {Math.round((docReview.totalClausesChecked / docReview.totalRequiredClauses) * 100)}%
                </div>
                <span className="text-[10px] text-[#8E9EB5]/70">Required terms located</span>
              </div>

              <div className="col-span-2 md:col-span-1 rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/70 p-3.5">
                <span className="text-[11px] font-medium text-[#8E9EB5]">Disclosure Status</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      docReview.isFullyDisclosed
                        ? "bg-[#78F5CF]/20 text-[#78F5CF]"
                        : "bg-[#F4BB63]/20 text-[#F4BB63]"
                    }`}
                  >
                    {docReview.isFullyDisclosed ? "Complete Disclosure" : "Incomplete — Action Required"}
                  </span>
                </div>
                <span className="text-[10px] text-[#8E9EB5]/70 block mt-1">
                  {docReview.missingClauses.length === 0
                    ? "All 8 key clauses confirmed"
                    : `${docReview.missingClauses.length} clause(s) unverified`}
                </span>
              </div>
            </div>

            {/* Missing Clauses Warning if any */}
            {docReview.missingClauses.length > 0 && (
              <div className="rounded-xl border border-[#F4BB63]/40 bg-[#122238]/80 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F4BB63]">
                  <AlertTriangle size={15} />
                  <span>Unverified or Missing Clauses ({docReview.missingClauses.length})</span>
                </div>
                <p className="text-[11px] text-[#8E9EB5] leading-relaxed">
                  The following mandatory consumer disclosures were not confirmed. Request written documentation before signing:
                </p>
                <ul className="space-y-1.5 pt-1 text-xs text-[#F1F5F9]">
                  {docReview.missingClauses.map((clause, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#F4BB63] font-bold">•</span>
                      <span>{clause}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verified Clauses */}
            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/50 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78F5CF] block">
                Verified Terms ({docReview.checkedClauses.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#F1F5F9]/90 pt-1">
                {docReview.checkedClauses.map((clause, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-lg bg-[#08111F]/60 p-2">
                    <CheckCircle2 size={13} className="text-[#78F5CF] shrink-0" />
                    <span className="truncate">{clause}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-[#56D9F5]/25 bg-[#122238]/50 p-4 space-y-1.5 text-xs text-[#8E9EB5]">
              <span className="font-semibold text-[#56D9F5] block mb-1">
                Recommended Borrower Next Steps
              </span>
              {docReview.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#56D9F5]">•</span>
                  <p>{rec}</p>
                </div>
              ))}
            </div>

            {/* Limitations */}
            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/30 p-4 text-xs text-[#8E9EB5] space-y-1.5">
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 mb-1">
                <Info size={14} className="text-[#56D9F5]" />
                <span>Document Review Limitations</span>
              </span>
              {docReview.limitations.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#56D9F5]">•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. REAL BASE SEPOLIA ON-CHAIN TRANSFER RESULT */}
        {taskType === "wallet_transfer" && baseSepoliaTransfer && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#56D9F5]/35 bg-[#56D9F5]/10 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#56D9F5] flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[#56D9F5]" />
                  <span>On-Chain Transaction Confirmed (Base Sepolia Testnet)</span>
                </span>
                <div className="text-base font-bold text-[#F1F5F9] mt-0.5">
                  {baseSepoliaTransfer.amount} ETH Transferred to {baseSepoliaTransfer.recipient.slice(0, 8)}...{baseSepoliaTransfer.recipient.slice(-6)}
                </div>
              </div>
              <span className="rounded-full bg-[#56D9F5]/20 px-3 py-1 text-xs font-semibold text-[#56D9F5] border border-[#56D9F5]/30">
                Block #{baseSepoliaTransfer.blockNumber || "Mined"}
              </span>
            </div>

            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[#8E9EB5]">
                <span>Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#56D9F5] text-[11px]">
                    {baseSepoliaTransfer.txHash.slice(0, 14)}...{baseSepoliaTransfer.txHash.slice(-10)}
                  </span>
                  <a
                    href={baseSepoliaTransfer.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded bg-[#56D9F5]/10 px-2 py-0.5 text-[10px] text-[#56D9F5] hover:bg-[#56D9F5]/20 transition-colors"
                  >
                    <span>View on Basescan</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Recipient EVM Address</span>
                <span className="font-mono text-[#F1F5F9]">{baseSepoliaTransfer.recipient}</span>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Transferred Asset</span>
                <span className="font-mono text-[#56D9F5] font-semibold">
                  {baseSepoliaTransfer.amount} {baseSepoliaTransfer.tokenSymbol} (Base Sepolia Native Ether)
                </span>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Sending Wallet (MetaMask)</span>
                <span className="font-mono text-[#F1F5F9]">{baseSepoliaTransfer.senderAddress}</span>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Network</span>
                <span className="font-mono text-[#F1F5F9]">{baseSepoliaTransfer.networkName} (Chain ID {baseSepoliaTransfer.chainId})</span>
              </div>

              {baseSepoliaTransfer.gasUsed && (
                <div className="flex justify-between text-[#8E9EB5]">
                  <span>Gas Units Consumed</span>
                  <span className="font-mono text-[#8E9EB5]">{baseSepoliaTransfer.gasUsed} gas</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/30 p-4 text-xs text-[#8E9EB5] space-y-1.5">
              <span className="font-semibold text-[#F1F5F9] flex items-center gap-1.5 mb-1">
                <Info size={14} className="text-[#56D9F5]" />
                <span>Base Sepolia Testnet Safeguards</span>
              </span>
              <p>• Verified directly on Base Sepolia block #{baseSepoliaTransfer.blockNumber}.</p>
              <p>• Transferred native ETH carries no real-world financial value.</p>
              <p>• Transaction was authorized and signed exclusively via your connected MetaMask wallet.</p>
            </div>
          </div>
        )}

        {/* 8. REAL SEPOLIA ON-CHAIN TRANSFER RESULT */}
        {taskType === "wallet_transfer" && sepoliaTransfer && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#39D6C0]/35 bg-[#39D6C0]/10 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#39D6C0] flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-[#78F5CF]" />
                  <span>On-Chain Transaction Confirmed (Sepolia Testnet)</span>
                </span>
                <div className="text-base font-bold text-[#F1F5F9] mt-0.5">
                  {sepoliaTransfer.amount} USDC Transferred to {sepoliaTransfer.recipient.slice(0, 8)}...{sepoliaTransfer.recipient.slice(-6)}
                </div>
              </div>
              <span className="rounded-full bg-[#78F5CF]/20 px-3 py-1 text-xs font-semibold text-[#78F5CF] border border-[#78F5CF]/30">
                Block #{sepoliaTransfer.blockNumber || "Mined"}
              </span>
            </div>

            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[#8E9EB5]">
                <span>Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#56D9F5] text-[11px]">
                    {sepoliaTransfer.txHash.slice(0, 14)}...{sepoliaTransfer.txHash.slice(-10)}
                  </span>
                  <a
                    href={sepoliaTransfer.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded bg-[#56D9F5]/10 px-2 py-0.5 text-[10px] text-[#56D9F5] hover:bg-[#56D9F5]/20 transition-colors"
                  >
                    <span>View on Etherscan</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Recipient EVM Address</span>
                <span className="font-mono text-[#F1F5F9]">{sepoliaTransfer.recipient}</span>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Transferred Token</span>
                <span className="font-mono text-[#78F5CF] font-semibold">
                  {sepoliaTransfer.amount} {sepoliaTransfer.tokenSymbol} (Circle Testnet)
                </span>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Sending Wallet (MetaMask)</span>
                <span className="font-mono text-[#F1F5F9]">{sepoliaTransfer.senderAddress}</span>
              </div>

              <div className="flex justify-between text-[#8E9EB5]">
                <span>Network</span>
                <span className="font-mono text-[#F1F5F9]">{sepoliaTransfer.networkName} (Chain ID {sepoliaTransfer.chainId})</span>
              </div>

              {sepoliaTransfer.gasUsed && (
                <div className="flex justify-between text-[#8E9EB5]">
                  <span>Gas Units Consumed</span>
                  <span className="font-mono text-[#8E9EB5]">{sepoliaTransfer.gasUsed} gas</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#39D6C0]/25 bg-[#39D6C0]/5 p-3.5 text-xs text-[#39D6C0]/90">
              <strong>Verified Testnet Record:</strong> This transaction was signed by your connected MetaMask account and permanently confirmed on the Ethereum Sepolia testnet blockchain. Sepolia testnet tokens carry NO real monetary value.
            </div>
          </div>
        )}

        {/* 7b. SIMULATED LOCAL SQLITE TRANSFER RESULT */}
        {taskType === "wallet_transfer" && preparedTransfer && !sepoliaTransfer && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#39D6C0]/30 bg-[#39D6C0]/10 p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#39D6C0]">
                  Simulated Transaction Confirmed
                </span>
                <div className="text-base font-bold text-[#F1F5F9] mt-0.5">
                  {(preparedTransfer.amountCents / 100).toFixed(2)} SIM-USDC Recorded to Local Ledger
                </div>
              </div>
              <span className="rounded-full bg-[#39D6C0]/20 px-2.5 py-1 text-xs font-semibold text-[#39D6C0]">
                Success
              </span>
            </div>

            <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#8E9EB5]">
                <span>Recipient</span>
                <span className="font-mono text-[#F1F5F9]">{preparedTransfer.recipient}</span>
              </div>
              <div className="flex justify-between text-[#8E9EB5]">
                <span>Total Debit</span>
                <span className="font-mono text-[#78F5CF] font-bold">
                  {(preparedTransfer.totalDebit / 100).toFixed(2)} SIM-USDC
                </span>
              </div>
              {confirmedTxId && (
                <div className="flex justify-between text-[#8E9EB5] border-t border-[#8E9EB5]/10 pt-2">
                  <span>Ledger TX Record ID</span>
                  <span className="font-mono text-[#56D9F5]">{confirmedTxId}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-3.5 text-xs text-[#F4BB63]">
              <strong>Simulation Safeguard Note:</strong> This transaction was completed on a local simulated SQLite ledger. It was NOT broadcast to Ethereum or Sepolia networks and did NOT debit real cryptocurrency.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
