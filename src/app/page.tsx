"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  AgentFlowState,
  TaskType,
  TaskResultContext,
  PreparedTransferInfo,
  LoanCalcSummary,
  OfferComparisonResult,
  AffordabilityResult,
  CryptoRiskResult,
  RedFlagsResult,
  DocumentReviewResult,
} from "@/types/midnight";
import { AmbientWaveField } from "@/components/AmbientWaveField";
import { SmokyAtmosphere } from "@/components/SmokyAtmosphere";
import { AgentPresence } from "@/components/AgentPresence";
import { TaskCommandInput } from "@/components/TaskCommandInput";
import { TaskInputCard } from "@/components/TaskInputCard";
import { TaskReviewCard } from "@/components/TaskReviewCard";
import { ResultArtifact } from "@/components/ResultArtifact";
import { ContextualQuestionPanel } from "@/components/ContextualQuestionPanel";
import {
  calculateLoanCost,
  compareLoanOffers,
  assessAffordability,
  analyzeCryptoCollateralRisk,
  detectLoanRedFlags,
} from "@/lib/agentTools";
import { executeSepoliaTransfer, executeBaseSepoliaEthTransfer } from "@/lib/metamask";
import {
  formatSepoliaExplorerTxUrl,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NETWORK_NAME,
  SUPPORTED_TOKENS,
  validateTransferParameters,
} from "@/lib/sepolia-config";
import {
  formatBaseSepoliaExplorerTxUrl,
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_NETWORK_NAME,
  BASE_SEPOLIA_RPC_URL,
  validateBaseSepoliaTransferParameters,
} from "@/lib/base-sepolia-config";
import { playSoundEffect } from "@/lib/sound-effects";
import { playWelcomeVoice, stopSpeaking } from "@/lib/speech-service";
import { parseTransferIntent } from "@/lib/transfer-intent";
import {
  SepoliaTransferParams,
  SepoliaTransferResult,
  BaseSepoliaTransferParams,
  BaseSepoliaTransferResult,
} from "@/types/midnight";
import { ShieldCheck, AlertCircle, RefreshCw, Layers, Volume2, VolumeX } from "lucide-react";

export default function DebtTrapEscapeApp() {
  // Flow State (Starts with opening sequence)
  const [flowState, setFlowState] = useState<AgentFlowState>("welcoming");
  const [welcomePhase, setWelcomePhase] = useState<"standby" | "speaking" | "settled">("standby");
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  const [activeVoiceName, setActiveVoiceName] = useState<string | null>(null);
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);

  const hasStartedWelcomeRef = useRef(false);
  const welcomeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [taskPrompt, setTaskPrompt] = useState<string>("");

  // Intermediate Preparation State
  const [preparedTx, setPreparedTx] = useState<PreparedTransferInfo | null>(null);
  const [preparedSepoliaTx, setPreparedSepoliaTx] = useState<SepoliaTransferParams | null>(null);
  const [preparedBaseSepoliaTx, setPreparedBaseSepoliaTx] = useState<BaseSepoliaTransferParams | null>(null);

  // Completed Result Context (Grounded artifact deliverable)
  const [taskResult, setTaskResult] = useState<TaskResultContext | null>(null);

  // Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Optional UI Sound Effects (Disabled/muted by default)
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Sound preference initialization
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("debttrap_sound_enabled");
      if (stored === "true") {
        setIsMuted(false);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("debttrap_sound_enabled", (!next).toString());
      } catch {
        // ignore
      }
      if (next === false) {
        playSoundEffect("task_accepted", false);
      }
      return next;
    });
  }, []);

  // Opening Welcome Sequence:
  // 1. Wait exactly 1 second (1000ms).
  // 2. Play clear, natural female English voice: "Welcome to DebtTrap Escape."
  // 3. Trigger synchronized welcome animation (glowing core brightens & expands, waves ripple, smoke flows gracefully, welcome text fades in).
  // 4. Smoothly transition to main task-selection experience after voice finishes.
  useEffect(() => {
    if (hasStartedWelcomeRef.current) return;
    hasStartedWelcomeRef.current = true;

    // Step 1: Wait exactly 1 second before triggering welcome sequence
    const t1 = setTimeout(async () => {
      setWelcomePhase("speaking");
      const welcomeStartTime = Date.now();
      const minWelcomeDurationMs = 2800; // Keep welcome animation visible for natural 2.8s cadence

      let hasCompleted = false;
      const completeSequence = () => {
        if (hasCompleted) return;
        hasCompleted = true;
        const elapsed = Date.now() - welcomeStartTime;
        const remaining = Math.max(0, minWelcomeDurationMs - elapsed);
        const t3 = setTimeout(() => {
          setWelcomePhase("settled");
          setFlowState("idle");
        }, remaining + 350);
        welcomeTimersRef.current.push(t3);
      };

      // Play female English voice welcome
      try {
        const res = await playWelcomeVoice({
          onEnd: () => {
            completeSequence();
          },
          onError: () => {
            completeSequence();
          },
        });

        if (res.played && res.voiceName) {
          setActiveVoiceName(res.voiceName);
        } else if (res.autoplayBlocked) {
          setAutoplayBlocked(true);
        } else if (res.error) {
          setVoiceNotification(res.error);
        }
      } catch {
        completeSequence();
      }

      // Safety timeout in case speech onEnd doesn't fire
      const t2 = setTimeout(() => {
        completeSequence();
      }, minWelcomeDurationMs + 400);
      welcomeTimersRef.current.push(t2);
    }, 1000);

    welcomeTimersRef.current.push(t1);

    return () => {
      welcomeTimersRef.current.forEach((t) => clearTimeout(t));
      welcomeTimersRef.current = [];
      stopSpeaking();
    };
  }, []);

  const handleReplayWelcomeVoice = useCallback(async () => {
    setAutoplayBlocked(false);
    setIsMuted(false);
    try {
      localStorage.setItem("debttrap_sound_enabled", "true");
    } catch {
      // ignore
    }

    setFlowState("welcoming");
    setWelcomePhase("speaking");

    const welcomeStartTime = Date.now();
    const minWelcomeDurationMs = 2800;

    let hasCompleted = false;
    const completeSequence = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      const elapsed = Date.now() - welcomeStartTime;
      const remaining = Math.max(0, minWelcomeDurationMs - elapsed);
      setTimeout(() => {
        setWelcomePhase("settled");
        setFlowState("idle");
      }, remaining + 350);
    };

    const res = await playWelcomeVoice({
      onEnd: () => {
        completeSequence();
      },
      onError: () => {
        completeSequence();
      },
    });

    if (res.played && res.voiceName) {
      setActiveVoiceName(res.voiceName);
    } else if (res.error) {
      setVoiceNotification(res.error);
    }

    setTimeout(() => {
      completeSequence();
    }, minWelcomeDurationMs + 400);
  }, []);

  // Transition to Attentive State, then Collecting Input (or direct review for verified transfer prompt)
  const handleSelectTask = useCallback((task: TaskType, promptText?: string) => {
    setSelectedTask(task);
    setTaskPrompt(promptText || "");
    setErrorMessage(null);

    // If it's a valid Base Sepolia or Sepolia transfer prompt, prepare it directly for the TaskReviewCard
    if (task === "wallet_transfer" && promptText) {
      const parsed = parseTransferIntent(promptText);
      if (parsed.ok && parsed.intent) {
        if (parsed.intent.chainId === BASE_SEPOLIA_CHAIN_ID) {
          const val = validateBaseSepoliaTransferParameters({
            recipient: parsed.intent.recipient,
            amount: parsed.intent.amount,
            chainId: BASE_SEPOLIA_CHAIN_ID,
          });

          if (val.isValid) {
            const baseTx: BaseSepoliaTransferParams = {
              recipient: val.normalizedRecipient || parsed.intent.recipient,
              amount: parsed.intent.amount,
              tokenSymbol: "ETH",
              senderAddress: "",
              chainId: BASE_SEPOLIA_CHAIN_ID,
              networkName: BASE_SEPOLIA_NETWORK_NAME,
              rpcUrl: BASE_SEPOLIA_RPC_URL,
              rawPrompt: promptText,
            };
            setPreparedBaseSepoliaTx(baseTx);
            setPreparedSepoliaTx(null);
            setPreparedTx(null);
            setFlowState("attentive");
            playSoundEffect("task_accepted", isMuted);
            const timer = setTimeout(() => {
              setFlowState("awaiting_approval");
            }, 500);
            welcomeTimersRef.current.push(timer);
            return;
          }
        } else {
          const val = validateTransferParameters({
            recipient: parsed.intent.recipient,
            amount: parsed.intent.amount,
            tokenSymbol: parsed.intent.tokenSymbol,
            chainId: SEPOLIA_CHAIN_ID,
          });

          if (val.isValid) {
            const sepoliaTx: SepoliaTransferParams = {
              recipient: val.normalizedRecipient || parsed.intent.recipient,
              amount: parsed.intent.amount,
              tokenSymbol: parsed.intent.tokenSymbol,
              tokenAddress: parsed.intent.tokenAddress,
              tokenDecimals: parsed.intent.decimals,
              senderAddress: "",
              chainId: SEPOLIA_CHAIN_ID,
              networkName: SEPOLIA_NETWORK_NAME,
              rawPrompt: promptText,
            };
            setPreparedSepoliaTx(sepoliaTx);
            setPreparedBaseSepoliaTx(null);
            setPreparedTx(null);
            setFlowState("attentive");
            playSoundEffect("task_accepted", isMuted);
            const timer = setTimeout(() => {
              setFlowState("awaiting_approval");
            }, 500);
            welcomeTimersRef.current.push(timer);
            return;
          }
        }
      }
    }

    setFlowState("attentive");
    playSoundEffect("task_accepted", isMuted);

    const timer = setTimeout(() => {
      setFlowState("collecting_input");
    }, 450);
    welcomeTimersRef.current.push(timer);
  }, [isMuted]);

  // Cancel current task and return to idle command surface
  const handleCancelToIdle = useCallback(() => {
    setFlowState("idle");
    setWelcomePhase("settled");
    setSelectedTask(null);
    setPreparedTx(null);
    setPreparedSepoliaTx(null);
    setPreparedBaseSepoliaTx(null);
    setTaskPrompt("");
    setErrorMessage(null);
  }, []);

  // Execute Task with provided parameters
  const handleExecuteTask = async (params: Record<string, unknown>) => {
    if (!selectedTask) return;

    setErrorMessage(null);
    setFlowState("running");

    try {
      // 1. LOAN COST TASK
      if (selectedTask === "loan_cost") {
        const principal = Number(params.principal);
        const rate = Number(params.annualRatePercent);
        const months = Number(params.months);
        const fee = Number(params.upfrontFee || 0);

        const calcResult = calculateLoanCost({
          principal,
          annualInterestRatePercent: rate,
          tenureMonths: months,
          upfrontFees: fee,
        });

        const summary: LoanCalcSummary = {
          principal: calcResult.principal,
          annualRate: calcResult.annualInterestRatePercent,
          termMonths: calcResult.tenureMonths,
          upfrontFee: calcResult.upfrontFees ?? 0,
          netDisbursed: Math.max(0, calcResult.principal - (calcResult.upfrontFees ?? 0)),
          monthlyEmi: calcResult.monthlyEmi,
          totalInstallments: calcResult.totalInstallments,
          totalInterest: calcResult.totalInterestEstimate,
          totalOutflow: calcResult.estimatedTotalOutflowWithKnownFees,
          additionalCost: (calcResult.upfrontFees ?? 0) + calcResult.totalInterestEstimate,
          assumptions: Array.from(calcResult.assumptions),
        };

        const resultCtx: TaskResultContext = {
          taskType: "loan_cost",
          title: "Loan Cost & Amortization Report",
          timestamp: new Date().toLocaleTimeString(),
          inputs: params,
          loanCalc: summary,
          summaryText: `Loan of ₹${summary.principal.toLocaleString("en-IN")} at ${summary.annualRate}% for ${summary.termMonths} months results in a monthly EMI of ₹${summary.monthlyEmi.toLocaleString("en-IN")}. Total interest is ₹${summary.totalInterest.toLocaleString("en-IN")}.`,
          suggestedQuestions: [
            "Why is my EMI this amount?",
            "How much total interest will I pay overall?",
            "Which fees increase my total borrowing cost?",
            "What should I verify before accepting this offer?",
          ],
        };

        setTimeout(() => {
          setTaskResult(resultCtx);
          setFlowState("result_ready");
        }, 350);
        return;
      }

      // 2. COMPARE OFFERS TASK
      if (selectedTask === "compare_offers") {
        const principal = Number(params.principal);
        const tenureMonths = Number(params.tenureMonths);
        const rateA = Number(params.offerAAnnualInterestRatePercent);
        const feeA = Number(params.offerAUpfrontFees || 0);
        const rateB = Number(params.offerBAnnualInterestRatePercent);
        const feeB = Number(params.offerBUpfrontFees || 0);

        const cmp = compareLoanOffers({
          principal,
          tenureMonths,
          offerAAnnualInterestRatePercent: rateA,
          offerAUpfrontFees: feeA,
          offerBAnnualInterestRatePercent: rateB,
          offerBUpfrontFees: feeB,
        });

        const comparisonSummary: OfferComparisonResult = {
          principal,
          termMonths: tenureMonths,
          offerA: {
            rate: cmp.offerA.annualInterestRatePercent,
            fee: cmp.offerA.upfrontFees ?? 0,
            emi: cmp.offerA.monthlyEmi,
            totalInterest: cmp.offerA.totalInterestEstimate,
            totalOutflow: cmp.offerA.estimatedTotalOutflowWithKnownFees,
          },
          offerB: {
            rate: cmp.offerB.annualInterestRatePercent,
            fee: cmp.offerB.upfrontFees ?? 0,
            emi: cmp.offerB.monthlyEmi,
            totalInterest: cmp.offerB.totalInterestEstimate,
            totalOutflow: cmp.offerB.estimatedTotalOutflowWithKnownFees,
          },
          difference: cmp.estimatedKnownOutflowDifference,
          cheaperOffer: cmp.lowerKnownCostOffer === "approximately_equal" ? "equal" : cmp.lowerKnownCostOffer,
          assumptions: Array.from(cmp.assumptions),
        };

        const resultCtx: TaskResultContext = {
          taskType: "compare_offers",
          title: "Loan Offer Comparative Analysis",
          timestamp: new Date().toLocaleTimeString(),
          inputs: params,
          comparison: comparisonSummary,
          summaryText:
            comparisonSummary.cheaperOffer === "equal"
              ? "Both loan offers have identical total estimated outflows."
              : `Offer ${comparisonSummary.cheaperOffer} is cheaper by ₹${comparisonSummary.difference.toLocaleString("en-IN")} over ${tenureMonths} months.`,
          suggestedQuestions: [
            "Why is one offer cheaper than the other?",
            "What is the total repayment difference?",
            "How do upfront fees alter the comparison?",
            "What should I verify before deciding?",
          ],
        };

        setTimeout(() => {
          setTaskResult(resultCtx);
          setFlowState("result_ready");
        }, 350);
        return;
      }

      // 3. AFFORDABILITY TASK
      if (selectedTask === "affordability") {
        const income = Number(params.monthlyTakeHomeIncome);
        const expenses = Number(params.monthlyEssentialExpenses);
        const existing = Number(params.existingMonthlyEmis);
        const newEmi = Number(params.newLoanEmi);

        const aff = assessAffordability({
          monthlyTakeHomeIncome: income,
          monthlyEssentialExpenses: expenses,
          existingMonthlyEmis: existing,
          newLoanEmi: newEmi,
        });

        const affSummary: AffordabilityResult = {
          income: aff.monthlyTakeHomeIncome,
          expenses: aff.monthlyEssentialExpenses,
          existingEmis: aff.existingMonthlyEmis,
          newEmi: aff.proposedLoanEmi,
          totalEmis: aff.totalMonthlyEmis,
          emiToIncomeRatio: aff.totalEmiToIncomePercent,
          disposableLeftover: aff.remainingAfterExpensesAndAllEmis,
          isAffordableIndicator: aff.cashFlowIndicator === "non_negative_using_reported_inputs",
          limitations: Array.from(aff.limitations),
        };

        const resultCtx: TaskResultContext = {
          taskType: "affordability",
          title: "Cash-Flow & EMI Affordability Assessment",
          timestamp: new Date().toLocaleTimeString(),
          inputs: params,
          affordability: affSummary,
          summaryText: `Your total debt commitments will be ${affSummary.emiToIncomeRatio.toFixed(1)}% of reported take-home income, leaving a surplus of ₹${affSummary.disposableLeftover.toLocaleString("en-IN")}.`,
          suggestedQuestions: [
            "How did you calculate the affordability indicator?",
            "Which expenditure input had the biggest impact?",
            "What happens if living expenses increase by 20%?",
            "What are the limitations of this calculation?",
          ],
        };

        setTimeout(() => {
          setTaskResult(resultCtx);
          setFlowState("result_ready");
        }, 350);
        return;
      }

      // 4. CRYPTO RISK TASK
      if (selectedTask === "crypto_risk") {
        const qty = Number(params.collateralQuantity);
        const price = Number(params.collateralPriceUsd);
        const loan = Number(params.loanAmountUsdc);
        const threshold = Number(params.liquidationThresholdPercent);

        const cr = analyzeCryptoCollateralRisk({
          collateralQuantity: qty,
          collateralPriceUsd: price,
          loanAmountUsdc: loan,
          liquidationThresholdPercent: threshold,
        });

        const crSummary: CryptoRiskResult = {
          collateralQuantity: qty,
          collateralPriceUsd: price,
          loanAmountUsdc: loan,
          liquidationThresholdPercent: threshold,
          collateralValueUsd: cr.collateralValueUsd,
          loanToValuePercent: cr.loanToValuePercent,
          estimatedLiquidationPriceUsd: cr.estimatedLiquidationPriceUsd,
          priceDropToThresholdPercent: cr.priceDropToThresholdPercent,
          risk: cr.risk === "Lower" ? "Low" : cr.risk,
          thresholdReached: cr.thresholdReached,
          stressTests: cr.stressTests.map((t) => ({
            assumedPriceDropPercent: t.assumedPriceDropPercent,
            stressedCollateralPriceUsd: t.stressedCollateralPriceUsd,
            stressedLoanToValuePercent: t.stressedLoanToValuePercent,
            assumedThresholdReached: t.assumedThresholdReached,
          })),
          assumptions: Array.from(cr.assumptions),
        };

        const resultCtx: TaskResultContext = {
          taskType: "crypto_risk",
          title: "Crypto Collateral Liquidation Risk Model",
          timestamp: new Date().toLocaleTimeString(),
          inputs: params,
          cryptoRisk: crSummary,
          summaryText: `Current LTV is ${crSummary.loanToValuePercent}%. Liquidation occurs if collateral price falls ${crSummary.priceDropToThresholdPercent}% to $${crSummary.estimatedLiquidationPriceUsd}. Risk rating: ${crSummary.risk}.`,
          suggestedQuestions: [
            "Explain my LTV and liquidation price in simple terms.",
            "How was the liquidation threshold calculated?",
            "What does the -40% price drop stress test show?",
            "What assumptions are made about interest rates?",
          ],
        };

        setTimeout(() => {
          setTaskResult(resultCtx);
          setFlowState("result_ready");
        }, 350);
        return;
      }

      // 5. RED FLAGS TASK
      if (selectedTask === "red_flags") {
        const text = String(params.text || "");

        // Candidate signals for screening
        const observations = [
          {
            signal: "upfront_payment_promised_to_guarantee_approval",
            evidenceQuote: text.match(/(?:advance|upfront|pay (?:first|before)).{0,30}(?:guarantee|approv)/i)?.[0] || "pay first to unlock approval",
          },
          {
            signal: "requested_otp_password_or_wallet_seed_phrase",
            evidenceQuote: text.match(/(?:otp|password|seed phrase|private key)/i)?.[0] || "share your otp",
          },
          {
            signal: "pressure_to_sign_immediately",
            evidenceQuote: text.match(/(?:sign|signing).{0,25}(?:now|immediately|today|urgent)/i)?.[0] || "sign immediately today",
          },
          {
            signal: "fees_not_disclosed",
            evidenceQuote: text.match(/(?:fees?.{0,15}(?:not|hidden|unknown)|without disclosing)/i)?.[0] || "fees are not disclosed",
          },
          {
            signal: "guaranteed_approval_regardless_of_eligibility",
            evidenceQuote: text.match(/(?:guarantee.{0,20}approv|regardless of eligibility)/i)?.[0] || "guaranteed approval regardless of eligibility",
          },
        ];

        const rf = detectLoanRedFlags(observations, text);

        const rfSummary: RedFlagsResult = {
          verifiedFlags: rf.verifiedFlags.map((f) => ({
            signal: f.signal,
            label: f.label,
            severity: f.severity,
            evidenceQuote: f.evidenceQuote,
            reason: f.reason,
            nextStep: f.nextStep,
          })),
          checkedTextLength: text.length,
          countVerified: rf.countVerified,
          limitations: Array.from(rf.limitations),
        };

        const resultCtx: TaskResultContext = {
          taskType: "red_flags",
          title: "Predatory Red Flags & Evidence Verification",
          timestamp: new Date().toLocaleTimeString(),
          inputs: params,
          redFlags: rfSummary,
          summaryText:
            rfSummary.countVerified > 0
              ? `Detected ${rfSummary.countVerified} predatory warning signs verified against verbatim evidence in text.`
              : "No known predatory red flags detected in quoted text.",
          suggestedQuestions: [
            "Explain this warning sign in simple language.",
            "What verbatim evidence supports this finding?",
            "Which clauses must I verify in writing before signing?",
            "What is uncertain about this check?",
          ],
        };

        setTimeout(() => {
          setTaskResult(resultCtx);
          setFlowState("result_ready");
        }, 350);
        return;
      }

      // 6. LOAN DOCUMENT REVIEW TASK
      if (selectedTask === "doc_review") {
        const checked = (params.checkedClauses as string[]) || [];
        const excerpt = String(params.documentExcerpt || "");
        const allClauses = [
          "Interest rate and APR are clearly stated",
          "Processing fees and other charges are disclosed",
          "EMI amount and repayment dates are specified",
          "Late-payment penalties are explained",
          "Prepayment or foreclosure charges are disclosed",
          "The lender's legal name and contact details are provided",
          "Default, collection and collateral terms are understandable",
          "You can keep a copy of the final loan agreement",
        ];

        const missing = allClauses.filter((c) => !checked.includes(c));
        const isComplete = missing.length === 0;

        let flaggedConcerns: string[] = [];
        if (excerpt.trim()) {
          const rf = detectLoanRedFlags([], excerpt);
          flaggedConcerns = rf.verifiedFlags.map((f) => f.label);
        }

        const docReviewSummary: DocumentReviewResult = {
          totalClausesChecked: checked.length,
          totalRequiredClauses: allClauses.length,
          checkedClauses: checked,
          missingClauses: missing,
          isFullyDisclosed: isComplete,
          documentExcerpt: excerpt.trim() || undefined,
          flaggedConcerns,
          recommendations: isComplete
            ? [
                "All 8 primary consumer protection terms were verified.",
                "Obtain a signed and dated physical or PDF copy for your records.",
                "Cross-check that the lender's registration matches official regulatory records.",
              ]
            : [
                `Missing ${missing.length} critical disclosure clause${missing.length > 1 ? "s" : ""}: ${missing.join("; ")}.`,
                "Do not sign until the lender issues an addendum or revised agreement specifying these terms in writing.",
                "Verify whether any undisclosed charges or penalties could apply.",
              ],
          limitations: [
            "This checklist confirms borrower-verified terms; it does not constitute legal counsel.",
            "Lender legitimacy must be independently verified via regulatory licensing registries.",
            "State consumer protection laws may impose additional statutory cooling-off rights.",
          ],
        };

        const resultCtx: TaskResultContext = {
          taskType: "doc_review",
          title: "Loan Agreement Document Review",
          timestamp: new Date().toLocaleTimeString(),
          inputs: params,
          docReview: docReviewSummary,
          summaryText: isComplete
            ? "Verified all 8 core loan agreement disclosures and consumer protections."
            : `Reviewed loan agreement: ${checked.length} of ${allClauses.length} disclosures verified. ${missing.length} clause(s) require written lender clarification before signing.`,
          suggestedQuestions: [
            "Which critical clauses are missing from this loan agreement?",
            "Why is a completed checklist not a legal safety guarantee?",
            "What should I ask the lender regarding prepayment charges?",
            "How do I independently verify the lender's registration?",
          ],
        };

        setTimeout(() => {
          setTaskResult(resultCtx);
          setFlowState("result_ready");
        }, 350);
        return;
      }

      // 7. WALLET TRANSFER PREPARATION & AUTHORIZATION GATEWAY
      if (selectedTask === "wallet_transfer") {
        if (params.transferMode === "base_sepolia") {
          const recipient = String(params.recipient);
          const amount = String(params.amount);
          const sender = String(params.senderAddress || "");

          const valResult = validateBaseSepoliaTransferParameters({
            recipient,
            amount,
            chainId: BASE_SEPOLIA_CHAIN_ID,
          });

          if (!valResult.isValid) {
            throw new Error(valResult.error || "Transfer parameters failed safety validation.");
          }

          const baseTx: BaseSepoliaTransferParams = {
            recipient: valResult.normalizedRecipient || recipient,
            amount,
            tokenSymbol: "ETH",
            senderAddress: sender,
            chainId: BASE_SEPOLIA_CHAIN_ID,
            networkName: BASE_SEPOLIA_NETWORK_NAME,
            rpcUrl: BASE_SEPOLIA_RPC_URL,
            estimatedGasEth: params.estimatedGasEth ? String(params.estimatedGasEth) : undefined,
            rawPrompt: params.rawPrompt ? String(params.rawPrompt) : undefined,
          };

          setPreparedBaseSepoliaTx(baseTx);
          setPreparedSepoliaTx(null);
          setPreparedTx(null);
          setFlowState("awaiting_approval");
          playSoundEffect("warning", isMuted);
          return;
        }

        if (params.transferMode === "sepolia") {
          const recipient = String(params.recipient);
          const amount = String(params.amount);
          const sender = String(params.senderAddress || "");
          const tokenSymbol = String(params.tokenSymbol || "USDC");
          const contractAddress = String(params.tokenAddress || SUPPORTED_TOKENS.USDC.contractAddress);
          const decimals = Number(params.tokenDecimals || 6);

          // Server/UI boundary safety validation
          const valResult = validateTransferParameters({
            recipient,
            amount,
            tokenSymbol,
            chainId: SEPOLIA_CHAIN_ID,
          });

          if (!valResult.isValid) {
            throw new Error(valResult.error || "Transfer parameters failed safety validation.");
          }

          const sepoliaTx: SepoliaTransferParams = {
            recipient: valResult.normalizedRecipient || recipient,
            amount,
            tokenSymbol,
            tokenAddress: contractAddress,
            tokenDecimals: decimals,
            senderAddress: sender,
            chainId: SEPOLIA_CHAIN_ID,
            networkName: SEPOLIA_NETWORK_NAME,
            estimatedGasEth: params.estimatedGasEth ? String(params.estimatedGasEth) : undefined,
            rawPrompt: params.rawPrompt ? String(params.rawPrompt) : undefined,
          };

          setPreparedSepoliaTx(sepoliaTx);
          setPreparedTx(null);
          setFlowState("awaiting_approval");
          playSoundEffect("warning", isMuted);
          return;
        }

        const recipient = String(params.recipient);
        const amount = Number(params.amount);

        // Call server-side preparation endpoint
        const prepRes = await fetch("/api/wallet/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipient, amount }),
        });

        if (!prepRes.ok) {
          const errData = await prepRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to prepare wallet transaction.");
        }

        const prepData = await prepRes.json();

        setPreparedTx({
          recipient: prepData.recipient,
          amountCents: prepData.amountCents,
          feeCents: prepData.feeCents,
          totalDebit: prepData.totalDebit || prepData.amountCents + prepData.feeCents,
          idempotencyKey: prepData.idempotencyKey,
          asset: "SIM-USDC",
          network: "Local SQLite Ledger",
        });

        // Transition to reviewing / awaiting explicit user approval
        setFlowState("awaiting_approval");
        playSoundEffect("warning", isMuted);
        return;
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Execution failed.");
      setFlowState("error");
    }
  };

  // Explicit User Approval for Prepared Transaction
  const handleConfirmPreparedTransfer = async () => {
    // 1. REAL ON-CHAIN BASE SEPOLIA TESTNET TRANSFER
    if (preparedBaseSepoliaTx) {
      setFlowState("running");
      try {
        const receipt = await executeBaseSepoliaEthTransfer(
          preparedBaseSepoliaTx.recipient,
          preparedBaseSepoliaTx.amount
        );

        const explorerUrl = formatBaseSepoliaExplorerTxUrl(receipt.txHash);

        const baseSepoliaResult: BaseSepoliaTransferResult = {
          txHash: receipt.txHash,
          blockNumber: receipt.blockNumber,
          recipient: preparedBaseSepoliaTx.recipient,
          amount: preparedBaseSepoliaTx.amount,
          tokenSymbol: "ETH",
          senderAddress: preparedBaseSepoliaTx.senderAddress,
          chainId: preparedBaseSepoliaTx.chainId,
          networkName: preparedBaseSepoliaTx.networkName,
          explorerUrl,
          status: receipt.status,
          gasUsed: receipt.gasUsed,
          timestamp: new Date().toLocaleTimeString(),
          isTestnet: true,
        };

        const resultCtx: TaskResultContext = {
          taskType: "wallet_transfer",
          title: "Verified Base Sepolia On-Chain Transfer",
          timestamp: new Date().toLocaleTimeString(),
          inputs: {
            recipient: preparedBaseSepoliaTx.recipient,
            amount: preparedBaseSepoliaTx.amount,
            token: "ETH",
            network: preparedBaseSepoliaTx.networkName,
          },
          preparedBaseSepoliaTx,
          baseSepoliaTransfer: baseSepoliaResult,
          summaryText: `Successfully transferred ${preparedBaseSepoliaTx.amount} ETH to ${preparedBaseSepoliaTx.recipient} on ${preparedBaseSepoliaTx.networkName} (Block #${receipt.blockNumber}).`,
          suggestedQuestions: [
            "How do I verify this transaction on Base Sepolia Basescan?",
            "What is the difference between Base Sepolia and Ethereum Sepolia?",
            "How was the transaction receipt verified on-chain?",
            "What is the official Base Sepolia RPC endpoint?",
          ],
        };

        setTaskResult(resultCtx);
        setFlowState("result_ready");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "MetaMask transaction failed or was rejected.");
        setFlowState("error");
      }
      return;
    }

    // 2. REAL ON-CHAIN SEPOLIA TESTNET TRANSFER
    if (preparedSepoliaTx) {
      setFlowState("running");
      try {
        const receipt = await executeSepoliaTransfer(
          preparedSepoliaTx.recipient,
          preparedSepoliaTx.amount
        );

        const explorerUrl = formatSepoliaExplorerTxUrl(receipt.txHash);

        const sepoliaResult: SepoliaTransferResult = {
          txHash: receipt.txHash,
          blockNumber: receipt.blockNumber,
          recipient: preparedSepoliaTx.recipient,
          amount: preparedSepoliaTx.amount,
          tokenSymbol: preparedSepoliaTx.tokenSymbol,
          tokenAddress: preparedSepoliaTx.tokenAddress,
          senderAddress: preparedSepoliaTx.senderAddress,
          chainId: preparedSepoliaTx.chainId,
          networkName: preparedSepoliaTx.networkName,
          explorerUrl,
          status: receipt.status,
          gasUsed: receipt.gasUsed,
          timestamp: new Date().toLocaleTimeString(),
          isTestnet: true,
        };

        const resultCtx: TaskResultContext = {
          taskType: "wallet_transfer",
          title: "Verified Sepolia On-Chain Transfer",
          timestamp: new Date().toLocaleTimeString(),
          inputs: {
            recipient: preparedSepoliaTx.recipient,
            amount: preparedSepoliaTx.amount,
            token: preparedSepoliaTx.tokenSymbol,
            network: preparedSepoliaTx.networkName,
          },
          preparedSepoliaTx,
          sepoliaTransfer: sepoliaResult,
          summaryText: `Successfully transferred ${preparedSepoliaTx.amount} ${preparedSepoliaTx.tokenSymbol} to ${preparedSepoliaTx.recipient} on ${preparedSepoliaTx.networkName} (Block #${receipt.blockNumber}).`,
          suggestedQuestions: [
            "How do I verify this transaction on Sepolia Etherscan?",
            "What is the difference between Sepolia testnet and mainnet?",
            "How was the transaction verified on-chain?",
            "Where can I view the Circle USDC token contract?",
          ],
        };

        setTaskResult(resultCtx);
        setFlowState("result_ready");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "MetaMask transaction failed or was rejected.");
        setFlowState("error");
      }
      return;
    }

    // 2. SIMULATED LOCAL SQLITE TRANSFER
    if (!preparedTx) return;

    setFlowState("running");
    try {
      const confirmRes = await fetch("/api/wallet/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparedTx),
      });

      if (!confirmRes.ok) {
        const errData = await confirmRes.json().catch(() => ({}));
        throw new Error(errData.error || "Confirmation rejected by ledger.");
      }

      const confirmData = await confirmRes.json();
      const txId = confirmData.transactionId || confirmData.txId || `SIM-TX-${Date.now()}`;

      const resultCtx: TaskResultContext = {
        taskType: "wallet_transfer",
        title: "Simulated Wallet Transfer Record",
        timestamp: new Date().toLocaleTimeString(),
        inputs: { recipient: preparedTx.recipient, amount: preparedTx.amountCents / 100 },
        preparedTransfer: preparedTx,
        confirmedTxId: txId,
        summaryText: `Successfully transferred ${(preparedTx.amountCents / 100).toFixed(2)} SIM-USDC to ${preparedTx.recipient} on local ledger.`,
        suggestedQuestions: [
          "Has this transaction actually been submitted on-chain?",
          "What does this transaction status mean?",
          "Explain the transaction review and fee details.",
          "How does the local simulation ensure safety?",
        ],
      };

      setTaskResult(resultCtx);
      setFlowState("result_ready");
      playSoundEffect("task_completed", isMuted);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Confirmation failed.");
      setFlowState("error");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#08111F] text-[#F1F5F9] font-sans antialiased overflow-x-hidden selection:bg-[#56D9F5]/30 selection:text-white">
      {/* 3D Perspective Wave Grid Layer */}
      <AmbientWaveField
        intensity={
          flowState === "running"
            ? "active"
            : flowState === "welcoming" && welcomePhase === "speaking"
            ? "welcome_ripple"
            : "calm"
        }
      />

      {/* Layered Drifting Smoky Atmosphere */}
      <SmokyAtmosphere
        state={
          flowState === "running"
            ? "running"
            : flowState === "awaiting_approval"
            ? "awaiting_approval"
            : flowState === "result_ready" || flowState === "answering_question"
            ? "result_ready"
            : flowState === "error"
            ? "error"
            : flowState === "welcoming" && welcomePhase === "speaking"
            ? "welcoming"
            : "idle"
        }
      />

      {/* Top Header Identity */}
      <header className="relative z-20 border-b border-[#8E9EB5]/10 bg-[#08111F]/80 px-4 py-3.5 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#56D9F5]/10 text-[#56D9F5] border border-[#56D9F5]/20 shadow-sm">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest text-[#F1F5F9] uppercase font-mono">
                DebtTrap Escape
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] tracking-wider text-[#56D9F5] uppercase">
                {"// AI Financial Safety Agent"}
              </span>
            </div>
          </div>

          {/* Dynamic State Beacon */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-[#8E9EB5]/20 bg-[#0D192A]/80 px-2.5 py-1 text-[11px] text-[#8E9EB5]">
              <span
                className={`h-2 w-2 rounded-full ${
                  flowState === "welcoming" || flowState === "attentive"
                    ? "bg-[#56D9F5] animate-pulse"
                    : flowState === "running"
                    ? "bg-[#56D9F5] animate-ping"
                    : flowState === "awaiting_approval"
                    ? "bg-[#F4BB63] animate-pulse"
                    : flowState === "result_ready"
                    ? "bg-[#78F5CF]"
                    : flowState === "error"
                    ? "bg-[#F87171]"
                    : "bg-[#39D6C0]"
                }`}
              />
              <span className="font-mono uppercase text-[10px] text-[#F1F5F9]/80">
                {flowState === "welcoming" && "Agent Initializing"}
                {flowState === "idle" && "Agent Standby"}
                {flowState === "attentive" && "Preparing Assessment"}
                {flowState === "collecting_input" && "Gathering Parameters"}
                {flowState === "needs_clarification" && "Awaiting Details"}
                {flowState === "reviewing" && "Reviewing Action"}
                {flowState === "running" && "Calculating…"}
                {flowState === "awaiting_approval" && "Action Review"}
                {flowState === "result_ready" && "Result Ready"}
                {flowState === "answering_question" && "Clarifying Result"}
                {flowState === "error" && "Attention Required"}
              </span>
            </div>

            {/* Optional Sound Effects Toggle */}
            <button
              id="sound-toggle-btn"
              type="button"
              onClick={handleToggleSound}
              title={
                !isMuted
                  ? `Sound active ${activeVoiceName ? `(${activeVoiceName})` : ""}`
                  : "Sound effects muted (Click to enable audio)"
              }
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                !isMuted
                  ? "border-[#56D9F5]/40 bg-[#56D9F5]/10 text-[#56D9F5]"
                  : "border-[#8E9EB5]/20 bg-[#0D192A]/80 text-[#8E9EB5] hover:text-[#F1F5F9]"
              }`}
            >
              {!isMuted ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{!isMuted ? "Sound: On" : "Sound: Off"}</span>
            </button>

            {/* Autoplay fallback button: if browser restricted autoplay, user can trigger opening voice welcome */}
            {autoplayBlocked && (
              <button
                id="enable-voice-welcome-btn"
                type="button"
                onClick={handleReplayWelcomeVoice}
                className="flex items-center gap-1.5 rounded-full border border-[#56D9F5]/40 bg-[#56D9F5]/10 px-2.5 py-1 text-[11px] font-medium text-[#56D9F5] hover:bg-[#56D9F5]/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(86,217,245,0.2)]"
                title="Browser autoplay policy restricted voice. Click to play female voice welcome."
              >
                <Volume2 size={12} />
                <span>Play Voice Welcome</span>
              </button>
            )}

            {flowState !== "idle" && flowState !== "welcoming" && (
              <button
                type="button"
                onClick={handleCancelToIdle}
                className="flex items-center gap-1 rounded-lg border border-[#8E9EB5]/20 bg-[#122238]/60 px-2.5 py-1 text-[11px] text-[#8E9EB5] hover:bg-[#122238] hover:text-[#F1F5F9] transition-colors cursor-pointer"
              >
                <RefreshCw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Single Agent Surface */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-6 md:py-10">
        {/* =========================================================================
            STAGE A: INITIAL SCREEN / INTENT SELECTION (Desktop 2-Column: Left ~60%, Right ~40%)
            When in welcoming, idle, or attentive states
        ========================================================================= */}
        {(flowState === "idle" || flowState === "welcoming" || flowState === "attentive") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(85vh-80px)]">
            {/* Left Side (~60% on desktop: lg:col-span-7): Animated AI agent core centerpiece */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center text-center px-2 py-4">
              <AgentPresence
                state={flowState}
                size="large"
                className="mb-6"
              />

              {/* During Welcome Animation (t >= 1.0s, during speech): "Welcome to DebtTrap Escape" */}
              {flowState === "welcoming" && welcomePhase === "speaking" && (
                <div className="animate-welcomeFadeIn space-y-3 max-w-lg mx-auto py-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#56D9F5] via-[#78F5CF] to-[#39D6C0] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(86,217,245,0.45)]">
                    Welcome to DebtTrap Escape
                  </h1>
                  <p className="text-xs sm:text-sm text-[#8E9EB5] font-medium tracking-wide">
                    AI Financial Safety Agent • Real-time Protection &amp; Risk Modeling
                  </p>
                </div>
              )}

              {/* Standby placeholder during the 1st second */}
              {flowState === "welcoming" && welcomePhase === "standby" && (
                <div className="h-16" aria-hidden="true" />
              )}

              {/* After Welcome begins / in Idle / Attentive: Main question & supporting line */}
              {(flowState === "idle" || flowState === "attentive" || (flowState === "welcoming" && welcomePhase === "settled")) && (
                <div className="animate-fadeIn space-y-3 max-w-lg mx-auto">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F1F5F9] leading-tight">
                    What brings you here today?
                  </h1>
                  <p className="text-sm sm:text-base text-[#8E9EB5] leading-relaxed max-w-md mx-auto">
                    Choose what you need help with, and I’ll guide you through it.
                  </p>
                </div>
              )}
            </div>

            {/* Right Side (~40% on desktop: lg:col-span-5): Compact vertically arranged intent-selection panel */}
            <div className="lg:col-span-5 w-full flex flex-col justify-center">
              <TaskCommandInput
                onSelectTask={handleSelectTask}
                loading={flowState === "attentive"}
                isMuted={isMuted}
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE B & C: IN-PLACE PARAMETER COLLECTION
        ========================================================================= */}
        {(flowState === "collecting_input" || flowState === "needs_clarification") && selectedTask && (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="flex flex-col items-center justify-center">
              <AgentPresence state={flowState} size="normal" className="mb-1" />
            </div>
            <TaskInputCard
              taskType={selectedTask}
              initialPrompt={taskPrompt}
              onCancel={handleCancelToIdle}
              onSubmit={handleExecuteTask}
              loading={false}
            />
          </div>
        )}

        {/* =========================================================================
            STAGE D: REVIEW & EXPLICIT AUTHORIZATION
        ========================================================================= */}
        {(flowState === "awaiting_approval" || flowState === "reviewing") && (preparedTx || preparedSepoliaTx || preparedBaseSepoliaTx) && (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="flex flex-col items-center justify-center">
              <AgentPresence state={flowState} size="normal" className="mb-1" />
            </div>
            <TaskReviewCard
              preparedTx={preparedTx}
              preparedSepoliaTx={preparedSepoliaTx}
              preparedBaseSepoliaTx={preparedBaseSepoliaTx}
              onConfirm={handleConfirmPreparedTransfer}
              onCancel={handleCancelToIdle}
              loading={false}
            />
          </div>
        )}

        {/* =========================================================================
            STAGE E: RUNNING EXECUTION STATE (Truthful activity, no fake bars)
        ========================================================================= */}
        {flowState === "running" && (
          <div className="w-full max-w-md mx-auto space-y-6 text-center py-8">
            <div className="flex flex-col items-center justify-center">
              <AgentPresence state="running" size="normal" className="mb-1" />
            </div>
            <div className="rounded-2xl border border-[#56D9F5]/30 bg-[#0D192A]/90 p-8 shadow-2xl backdrop-blur-md">
              <div className="flex justify-center mb-4 text-[#56D9F5]">
                <Layers size={36} className="animate-spin duration-3000" />
              </div>
              <h3 className="text-base font-semibold text-[#F1F5F9]">
                Executing verified financial model…
              </h3>
              <p className="mt-1 text-xs text-[#8E9EB5]">
                Processing parameters against deterministic mathematical algorithms and safety guardrails.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE F: ERROR & RECOVERY
        ========================================================================= */}
        {flowState === "error" && (
          <div className="mx-auto max-w-md rounded-2xl border border-[#F87171]/40 bg-[#0D192A]/95 p-6 text-center shadow-2xl backdrop-blur-md">
            <div className="flex justify-center mb-3 text-[#F87171]">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Task Execution Error</h3>
            <p className="mt-1 text-xs text-[#8E9EB5] leading-relaxed">
              {errorMessage || "An unexpected error occurred while executing the task."}
            </p>
            <button
              type="button"
              onClick={handleCancelToIdle}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#122238] border border-[#8E9EB5]/25 px-4 py-2 text-xs font-semibold text-[#F1F5F9] hover:bg-[#1B2E4B] transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Return to Command Surface</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            STAGE 5 & 6: COMPLETE RESULT ARTIFACT + CONTEXTUAL Q&A
        ========================================================================= */}
        {(flowState === "result_ready" || flowState === "answering_question") && taskResult && (
          <div className="w-full space-y-8 animate-fadeIn">
            {/* The Primary Result Deliverable */}
            <ResultArtifact result={taskResult} onNewTask={handleCancelToIdle} />

            {/* Contextual Follow-Up Q&A Panel (Unlocked ONLY after result) */}
            <ContextualQuestionPanel
              result={taskResult}
              onSelectNewTask={handleCancelToIdle}
              onStartAnswering={() => setFlowState("answering_question")}
              onFinishAnswering={() => setFlowState("result_ready")}
            />
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 border-t border-[#8E9EB5]/10 py-6 text-center text-[11px] text-[#8E9EB5]/60">
        <p>{"DebtTrap Escape — AI Financial Safety Agent • Grounded deterministic fintech analysis"}</p>
      </footer>
    </div>
  );
}