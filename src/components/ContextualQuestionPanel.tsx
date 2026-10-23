"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  HelpCircle,
  CornerDownRight,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  Square,
  AlertCircle,
} from "lucide-react";
import { TaskResultContext } from "@/types/midnight";
import { formatINR } from "@/lib/agentTools";
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  SpeechRecognitionController,
  speakText,
  stopSpeaking,
  isSpeechSynthesisSupported,
} from "@/lib/speech-service";

interface ContextualQuestionPanelProps {
  result: TaskResultContext;
  onSelectNewTask?: () => void;
  onStartAnswering?: () => void;
  onFinishAnswering?: () => void;
}

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

export function ContextualQuestionPanel({
  result,
  onStartAnswering,
  onFinishAnswering,
}: ContextualQuestionPanelProps) {
  const [customQuestion, setCustomQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionController | null>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
    setTtsSupported(isSpeechSynthesisSupported());
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    setVoiceError(null);
    const controller = startSpeechRecognition({
      onResult: (transcript) => {
        setCustomQuestion(transcript);
      },
      onError: (err) => {
        setVoiceError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (controller) {
      recognitionRef.current = controller;
      setIsListening(true);
    }
  };

  const handleToggleReadAloud = (id: string, text: string) => {
    if (speakingId === id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(id);
    speakText(text, {
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  // Compute dynamic task-specific suggested questions based on actual results
  const getSuggestedQuestions = (): string[] => {
    switch (result.taskType) {
      case "loan_cost":
        return [
          `Why is my monthly EMI ${formatINR(result.loanCalc?.monthlyEmi || 0)}?`,
          `How much total interest will I pay over ${result.loanCalc?.termMonths || 0} months?`,
          "Which fees or assumptions increase my total borrowing cost?",
          "What critical clauses should I verify before accepting this offer?",
        ];
      case "compare_offers":
        return [
          result.comparison?.cheaperOffer !== "equal"
            ? `Why is Offer ${result.comparison?.cheaperOffer} cheaper by ${formatINR(result.comparison?.difference || 0)}?`
            : "Why are the total costs of both offers equal?",
          "How do upfront fees shift the real comparison versus interest rates?",
          "What lender-specific assumptions could change this ranking?",
          "What should I verify before making a final loan decision?",
        ];
      case "affordability":
        return [
          `How was my ${result.affordability?.emiToIncomeRatio.toFixed(1)}% EMI-to-income ratio calculated?`,
          `What does having ${formatINR(result.affordability?.disposableLeftover || 0)} leftover mean for emergency resilience?`,
          "Which expenditure input had the greatest impact on this assessment?",
          "What are the major real-world limitations of this cash-flow indicator?",
        ];
      case "crypto_risk":
        return [
          `Explain my ${result.cryptoRisk?.loanToValuePercent}% LTV and the $${result.cryptoRisk?.estimatedLiquidationPriceUsd} liquidation price.`,
          `What does the ${result.cryptoRisk?.priceDropToThresholdPercent}% safety buffer mean if ETH drops?`,
          "How did you model the -20%, -40%, and -60% price drop stress tests?",
          "What assumptions are made about interest rates and protocol liquidations?",
        ];
      case "red_flags":
        return [
          result.redFlags && result.redFlags.verifiedFlags.length > 0
            ? `Explain the "${result.redFlags.verifiedFlags[0].label}" warning in simple terms.`
            : "Why did no red flags appear for this text?",
          "What verbatim evidence in my text triggered the verification?",
          "What exact documentation should I demand from the lender in writing?",
          "What is uncertain about this check that requires human legal review?",
        ];
      case "doc_review":
        return [
          result.docReview && result.docReview.missingClauses.length > 0
            ? `Which ${result.docReview.missingClauses.length} critical clauses are missing from this loan agreement?`
            : "Why is a completed checklist not a legal safety guarantee?",
          "What should I ask the lender regarding prepayment charges?",
          "How do I independently verify the lender's registration?",
          "What should I do if the lender refuses to provide a signed copy?",
        ];
      case "wallet_transfer":
        return [
          "Has this transaction actually been submitted to Ethereum mainnet?",
          "What does the local SQLite ledger record signify?",
          "Explain the fee estimate and total debit breakdown.",
          "How does DebtTrap Escape safeguard against unauthorized transfers?",
        ];
      default:
        return [
          "Explain the primary calculation methodology.",
          "What key assumptions were used for this result?",
          "What practical steps should I take next?",
        ];
    }
  };

  const suggestedQuestions = getSuggestedQuestions();

  // Generate deterministic, grounded point-by-point explanations referencing exact result values
  const generateGroundedAnswer = (question: string): string => {
    const q = question.toLowerCase();

    if (result.taskType === "loan_cost" && result.loanCalc) {
      const calc = result.loanCalc;
      if (q.includes("emi") || q.includes("monthly")) {
        return `Your monthly EMI of ${formatINR(calc.monthlyEmi)} was calculated using the standard monthly reducing-balance formula on a principal of ${formatINR(calc.principal)} at an annual interest rate of ${calc.annualRate}% over ${calc.termMonths} equal monthly installments.

Key factors:
1. Interest is recalculated each month on the remaining unpaid principal balance.
2. Across all ${calc.termMonths} months, your installments total ${formatINR(calc.totalInstallments)}.
3. Note: This assumes equal monthly repayments; changes to taxes, insurance, or variable rate terms would alter this figure.`;
      }
      if (q.includes("interest") || q.includes("overall")) {
        return `Across the full tenure of ${calc.termMonths} months, your total interest will be ${formatINR(calc.totalInterest)}.

Point-by-point breakdown:
1. Principal received: ${formatINR(calc.principal)}
2. Total installments: ${formatINR(calc.totalInstallments)}
3. Net interest outflow: ${formatINR(calc.totalInterest)} (${((calc.totalInterest / calc.principal) * 100).toFixed(1)}% of your principal).
4. With the upfront fee of ${formatINR(calc.upfrontFee)}, your overall financial outflow is ${formatINR(calc.totalOutflow)}.`;
      }
      if (q.includes("fee") || q.includes("increase")) {
        return `Your total cost includes an upfront fee of ${formatINR(calc.upfrontFee)}.
1. Because this fee is deducted upfront, your net disbursed amount is ${formatINR(calc.netDisbursed)}, while you repay interest on the full ${formatINR(calc.principal)}.
2. This creates an effective borrowing cost higher than the nominal ${calc.annualRate}% rate.
3. Unknown fees (documentation charges, GST, late penalties) were not provided and are excluded.`;
      }
      if (q.includes("verify") || q.includes("clauses") || q.includes("steps")) {
        return `Before accepting this loan of ${formatINR(calc.principal)}:
1. Demand an itemized Key Fact Statement (KFS) stating the Annual Percentage Rate (APR), including all mandatory fees.
2. Verify prepayment and foreclosure penalty clauses in writing.
3. Confirm whether the interest rate (${calc.annualRate}%) is fixed or floating with benchmark resets.`;
      }
    }

    if (result.taskType === "compare_offers" && result.comparison) {
      const cmp = result.comparison;
      if (q.includes("cheaper") || q.includes("why") || q.includes("cost")) {
        if (cmp.cheaperOffer === "equal") {
          return `Both offers result in the identical total estimated outflow of ${formatINR(cmp.offerA.totalOutflow)}.`;
        }
        return `Offer ${cmp.cheaperOffer} is cheaper by ${formatINR(cmp.difference)} over the ${cmp.termMonths}-month tenure.

Comparison analysis:
1. Offer A: Nominal rate ${cmp.offerA.rate}%, upfront fee ${formatINR(cmp.offerA.fee)}, total outflow ${formatINR(cmp.offerA.totalOutflow)}.
2. Offer B: Nominal rate ${cmp.offerB.rate}%, upfront fee ${formatINR(cmp.offerB.fee)}, total outflow ${formatINR(cmp.offerB.totalOutflow)}.
3. The winner achieves a net saving of ${formatINR(cmp.difference)} when accounting for both periodic interest and upfront deduction fees.`;
      }
      if (q.includes("fee") || q.includes("shift")) {
        return `Upfront fees have an immediate impact on like-for-like comparisons.
A loan with a slightly lower nominal rate but high upfront processing fees can cost more overall than a higher-rate loan with zero processing fees. In this comparison, Offer A fees were ${formatINR(cmp.offerA.fee)} versus Offer B fees of ${formatINR(cmp.offerB.fee)}.`;
      }
      if (q.includes("verify") || q.includes("deciding")) {
        return `Before deciding between Offer A and Offer B:
1. Ensure both lenders use the identical compounding frequency (monthly reducing balance).
2. Check for hidden mandatory insurance bundles or administrative fees.
3. Verify cooling-off periods and prepayment flexibility for both lenders.`;
      }
    }

    if (result.taskType === "affordability" && result.affordability) {
      const aff = result.affordability;
      if (q.includes("ratio") || q.includes("how")) {
        return `Your EMI-to-income ratio of ${aff.emiToIncomeRatio.toFixed(1)}% was calculated as:
(Total Monthly EMIs / Monthly Take-Home Income) × 100
= (${formatINR(aff.totalEmis)} / ${formatINR(aff.income)}) × 100 = ${aff.emiToIncomeRatio.toFixed(1)}%.

Breakdown:
1. Existing EMIs: ${formatINR(aff.existingEmis)}
2. Proposed New EMI: ${formatINR(aff.newEmi)}
3. Combined Monthly Debt Commitments: ${formatINR(aff.totalEmis)}`;
      }
      if (q.includes("leftover") || q.includes("disposable") || q.includes("emergency")) {
        return `After paying essential living expenses (${formatINR(aff.expenses)}) and all monthly EMIs (${formatINR(aff.totalEmis)}), your reported cashflow buffer is ${formatINR(aff.disposableLeftover)}.
${
  aff.disposableLeftover < 0
    ? `⚠️ This represents a monthly cash deficit of ${formatINR(Math.abs(aff.disposableLeftover))}. Taking on this new EMI will require drawing from savings or accumulating high-cost debt.`
    : `This surplus must cover emergency funds, discretionary spending, healthcare, and unexpected fluctuations in living costs.`
}`;
      }
      if (q.includes("limitations") || q.includes("real-world")) {
        return `Key limitations of this assessment:
1. It relies solely on your self-reported inputs; it has not verified tax deductions or bank statements.
2. It excludes irregular annual expenses, healthcare emergencies, and dependents.
3. This is an educational cash-flow indicator, not an official credit underwriting decision.`;
      }
    }

    if (result.taskType === "crypto_risk" && result.cryptoRisk) {
      const cr = result.cryptoRisk;
      if (q.includes("ltv") || q.includes("liquidation")) {
        return `Your current Loan-To-Value (LTV) is ${cr.loanToValuePercent}%, calculated on collateral value of $${cr.collateralValueUsd} backing a borrow of $${cr.loanAmountUsdc} USDC.
Your liquidation threshold is ${cr.liquidationThresholdPercent}%, meaning your collateral will face automated liquidation if the asset price falls to $${cr.estimatedLiquidationPriceUsd}.`;
      }
      if (q.includes("buffer") || q.includes("safety") || q.includes("drop")) {
        return `Your safety price-drop buffer is ${cr.priceDropToThresholdPercent}%.
From the current price of $${cr.collateralPriceUsd}, the collateral asset can decrease by up to ${cr.priceDropToThresholdPercent}% before reaching the $${cr.estimatedLiquidationPriceUsd} liquidation threshold.`;
      }
      if (q.includes("stress") || q.includes("tests") || q.includes("40")) {
        return `In our deterministic stress test:
1. At -20% drop ($${cr.stressTests[0]?.stressedCollateralPriceUsd}): LTV rises to ${cr.stressTests[0]?.stressedLoanToValuePercent}% (Threshold breached: ${cr.stressTests[0]?.assumedThresholdReached ? "YES" : "NO"}).
2. At -40% drop ($${cr.stressTests[1]?.stressedCollateralPriceUsd}): LTV rises to ${cr.stressTests[1]?.stressedLoanToValuePercent}% (Threshold breached: ${cr.stressTests[1]?.assumedThresholdReached ? "YES" : "NO"}).
3. At -60% drop ($${cr.stressTests[2]?.stressedCollateralPriceUsd}): LTV rises to ${cr.stressTests[2]?.stressedLoanToValuePercent}% (Threshold breached: ${cr.stressTests[2]?.assumedThresholdReached ? "YES" : "NO"}).`;
      }
    }

    if (result.taskType === "red_flags" && result.redFlags) {
      const rf = result.redFlags;
      if (q.includes("warning") || q.includes("explain")) {
        if (rf.verifiedFlags.length > 0) {
          const first = rf.verifiedFlags[0];
          return `The warning "${first.label}" was triggered by the quote: "${first.evidenceQuote}".

Reason: ${first.reason}
Immediate action: ${first.nextStep}`;
        }
        return `No predatory signals were detected in the supplied text. However, legitimate lenders must still provide formal documentation and clear KFS disclosure.`;
      }
      if (q.includes("evidence") || q.includes("triggered")) {
        if (rf.verifiedFlags.length > 0) {
          return rf.verifiedFlags
            .map((f, i) => `${i + 1}. [${f.label}]: matched verbatim substring "${f.evidenceQuote}"`)
            .join("\n");
        }
        return `No specific substrings matched our deterministic predatory signal catalog.`;
      }
      if (q.includes("documentation") || q.includes("demand")) {
        return `Demand the following in writing:
1. Formal Sanction Letter with registered lender entity name.
2. Complete Key Fact Statement (KFS) detailing APR and all fees.
3. Grievance redressal officer details and official RBI registration number (for Indian NBFCs).`;
      }
    }

    if (result.taskType === "wallet_transfer") {
      if (result.sepoliaTransfer) {
        const st = result.sepoliaTransfer;
        if (q.includes("status") || q.includes("confirmed") || q.includes("mean")) {
          return `Your transaction is permanently confirmed on the Ethereum Sepolia testnet blockchain (Block #${st.blockNumber || "Mined"}).
Receipt status is 1 (Success), meaning ${st.amount} ${st.tokenSymbol} tokens were debited from ${st.senderAddress} and transferred to ${st.recipient}.
It has been mined by Sepolia network validators.`;
        }
        if (q.includes("etherscan") || q.includes("verify") || q.includes("hash") || q.includes("explorer")) {
          return `You can verify this transfer directly on Sepolia Etherscan at:
${st.explorerUrl}

Transaction Hash: ${st.txHash}
Block: #${st.blockNumber || "Pending"}
Token: ${st.tokenSymbol} (Circle Sepolia Testnet)
Gas Consumed: ${st.gasUsed || "N/A"} gas units.`;
        }
        if (q.includes("simulation") || q.includes("difference") || q.includes("sim-usdc")) {
          return `The distinction between this Sepolia USDC transfer and the SIM-USDC simulation is fundamental:
1. SIM-USDC: An educational SQLite database record on a local machine. Zero cryptography, no gas, no blockchain.
2. Sepolia USDC: A real on-chain transaction signed with your MetaMask account private key, broadcast across peer-to-peer testnet nodes, and permanently included in a Sepolia block.
Note: While Sepolia is a real blockchain network, Sepolia testnet tokens carry NO monetary value.`;
        }
        if (q.includes("metamask") || q.includes("signature") || q.includes("approval") || q.includes("separate")) {
          return `Under strict fintech security principles:
1. AI intent parsing only interprets your request and prepares parameters. The AI never has access to your private keys and cannot sign transactions.
2. The UI review card requires your explicit authorization before anything is sent.
3. MetaMask enforces a distinct, cryptographic signature popup where you review gas fees and grant personal authorization before the transaction is broadcast to Ethereum consensus.`;
        }
      }

      if (q.includes("on-chain") || q.includes("mainnet") || q.includes("ethereum")) {
        return `No. This transfer was NOT submitted to Ethereum mainnet or any public blockchain.
It is recorded exclusively in a local educational SQLite ledger using simulated SIM-USDC tokens. No actual gas was spent, and no private keys were used to sign an on-chain transaction.`;
      }
      if (q.includes("sqlite") || q.includes("signify") || q.includes("status")) {
        return `The transaction record in the SQLite ledger demonstrates:
1. Structured parameter verification (recipient formatting, amount, fee debit).
2. Idempotency protection ensuring a transfer cannot be submitted twice.
3. Explicit user authorization gatekeeping before state modification.`;
      }
    }

    if (result.taskType === "doc_review" && result.docReview) {
      const doc = result.docReview;
      if (q.includes("missing") || q.includes("clause")) {
        if (doc.missingClauses.length === 0) {
          return `All ${doc.totalRequiredClauses} critical consumer protection terms were verified in this document review. No mandatory disclosure clauses were flagged as missing.`;
        }
        return `Your review identified ${doc.missingClauses.length} missing or unverified disclosure(s):
${doc.missingClauses.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Recommendation:
Never sign a loan agreement with missing statutory terms. Ask the lender to provide written documentation covering these exact items prior to commitment.`;
      }
      if (q.includes("guarantee") || q.includes("checklist")) {
        return `A completed checklist confirms that you have located and read these terms, but it is not a legal guarantee of lender legitimacy or fair dealing. Predatory lenders often include misleading or contradictory clauses elsewhere in the contract. Always ensure the lender is officially licensed.`;
      }
      if (q.includes("prepayment") || q.includes("foreclosure")) {
        return `Under Reserve Bank and consumer protection guidelines, many floating-rate personal loans to individuals may not carry foreclosure charges. You should ask the lender in writing: "What is the exact penalty or fee if I pay off the remaining balance ahead of schedule?"`;
      }
      return `To verify lender registration, look up the lender's registered corporate name and NBFC registration number on the official regulatory portal (such as the RBI registered NBFC directory or ministry of corporate affairs).`;
    }

    // Default grounded fallback
    return `Regarding your question about "${question}":
This task was executed with strict adherence to verified input parameters for ${result.title}.
All calculations use deterministic, transparent mathematical models. If you need a different loan scenario or modified collateral stress test, you can click "New Task" at any time.`;
  };

  const handleAskQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    onStartAnswering?.();

    let answer = "";
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[Context: ${result.title} for ${result.taskType}. Summary: ${result.summaryText}. Key data: ${JSON.stringify(result.inputs)}] Borrower asks: "${trimmed}". Provide a clear, educational, grounded explanation.`,
          history: qaHistory.flatMap((h) => [
            { role: "user" as const, text: h.question },
            { role: "model" as const, text: h.answer },
          ]),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          answer = data.reply;
        }
      }
    } catch {
      // Fallback to local grounded answers if agent is unreachable
    }

    if (!answer) {
      answer = generateGroundedAnswer(trimmed);
    }

    setQaHistory((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        question: trimmed,
        answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setCustomQuestion("");
    setLoading(false);
    onFinishAnswering?.();
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#56D9F5]/30 bg-[#0D192A]/90 p-6 md:p-8 shadow-2xl backdrop-blur-md transition-all">
      {/* Follow-up Header */}
      <div className="mb-6 flex items-start gap-3 border-b border-[#8E9EB5]/15 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#56D9F5]/15 text-[#56D9F5]">
          <HelpCircle size={20} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#F1F5F9] md:text-lg">
            Your result is ready. Do you have any questions regarding this task?
          </h2>
          <p className="text-xs text-[#8E9EB5] mt-1 leading-relaxed">
            Ask me to explain your calculations, findings, assumptions, or next steps based on the result above.
          </p>
        </div>
      </div>

      {/* Suggested Question Chips (Task-specific & grounded) */}
      <div className="mb-6 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E9EB5]/80 block">
          Suggested contextual questions
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAskQuestion(q)}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/60 px-3 py-1.5 text-xs text-[#F1F5F9] hover:border-[#56D9F5]/50 hover:bg-[#122238] transition-all text-left disabled:opacity-50"
            >
              <CornerDownRight size={12} className="text-[#56D9F5] shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Q&A Thread History */}
      {qaHistory.length > 0 && (
        <div className="mb-6 space-y-4 border-t border-[#8E9EB5]/10 pt-4">
          {qaHistory.map((item) => (
            <div key={item.id} className="space-y-2.5 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/50 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#56D9F5]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#56D9F5]" />
                  <span>Q: {item.question}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleReadAloud(item.id, item.answer)}
                    disabled={!ttsSupported}
                    title={!ttsSupported ? "Speech playback not supported in this browser" : speakingId === item.id ? "Stop spoken reading" : "Read answer aloud"}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                      speakingId === item.id
                        ? "border-[#56D9F5] bg-[#56D9F5]/20 text-[#56D9F5]"
                        : "border-[#8E9EB5]/20 bg-[#122238] text-[#8E9EB5] hover:text-[#56D9F5] hover:border-[#56D9F5]/40"
                    }`}
                  >
                    {speakingId === item.id ? (
                      <>
                        <Square size={10} className="fill-current" />
                        <span>Stop</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <span className="w-0.5 bg-[#56D9F5] rounded-full voice-wave-1 h-2" />
                          <span className="w-0.5 bg-[#56D9F5] rounded-full voice-wave-2 h-2" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Volume2 size={11} />
                        <span>Read Aloud</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-[#8E9EB5]/60">{item.timestamp}</span>
                </div>
              </div>
              <div className="text-xs text-[#F1F5F9]/90 whitespace-pre-line leading-relaxed pl-3 border-l-2 border-[#39D6C0]/40">
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Voice Status or Error Notification */}
      {isListening && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-red-500/25 bg-red-950/30 px-3 py-1.5 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span>Listening to question… Speak clearly into microphone</span>
          </div>
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className="rounded border border-red-500/40 bg-red-900/40 px-2 py-0.5 text-[10px] text-red-200 hover:bg-red-900/60 transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {voiceError && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-[#F4BB63]/30 bg-[#F4BB63]/10 px-3 py-1.5 text-xs text-[#F4BB63]">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{voiceError}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceError(null)}
            className="text-[10px] underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Custom Question Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion(customQuestion);
        }}
        className="relative"
      >
        <div className="relative flex items-center rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 p-1.5 focus-within:border-[#56D9F5] focus-within:ring-1 focus-within:ring-[#56D9F5]/30 transition-all">
          {/* Microphone Question Dictation Button */}
          <button
            id="qa-voice-input-button"
            type="button"
            onClick={handleToggleVoiceInput}
            disabled={loading || !speechSupported}
            title={
              !speechSupported
                ? "Voice recognition not supported"
                : isListening
                ? "Stop recording"
                : "Ask question with voice"
            }
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors mr-1 cursor-pointer ${
              isListening
                ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-mic-pulse"
                : speechSupported
                ? "text-[#8E9EB5] hover:text-[#56D9F5] hover:bg-[#122238]"
                : "text-[#8E9EB5]/30 cursor-not-allowed"
            }`}
          >
            {isListening ? (
              <div className="flex items-center gap-0.5">
                <span className="w-0.5 bg-red-400 rounded-full voice-wave-1 h-2" />
                <span className="w-0.5 bg-red-400 rounded-full voice-wave-2 h-2" />
              </div>
            ) : speechSupported ? (
              <Mic size={15} />
            ) : (
              <MicOff size={15} />
            )}
          </button>

          <input
            id="qa-custom-input"
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder={
              isListening
                ? "Listening… speak your question"
                : "Ask a specific question about these figures or recommendations…"
            }
            disabled={loading}
            className="w-full bg-transparent px-2 py-2 text-xs text-[#F1F5F9] placeholder-[#8E9EB5]/60 focus:outline-none"
          />
          <button
            id="qa-submit-button"
            type="submit"
            disabled={loading || !customQuestion.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#56D9F5] text-[#08111F] hover:bg-[#72e1fa] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Send follow-up question"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </form>
    </div>
  );
}
