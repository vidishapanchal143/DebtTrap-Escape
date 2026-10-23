"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Calculator,
  Scale,
  Coins,
  ShieldAlert,
  Wallet,
  PieChart,
  ClipboardCheck,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Send,
  Mic,
  MicOff,
  AlertTriangle,
} from "lucide-react";
import { TaskType } from "@/types/midnight";
import { playSoundEffect } from "@/lib/sound-effects";
import { parseTransferIntent } from "@/lib/transfer-intent";
import { isSpeechRecognitionSupported, startSpeechRecognition, SpeechRecognitionController } from "@/lib/speech-service";

interface TaskCommandInputProps {
  onSelectTask: (task: TaskType, promptText?: string) => void;
  loading?: boolean;
  isMuted?: boolean;
}

export function TaskCommandInput({
  onSelectTask,
  loading = false,
  isMuted = true,
}: TaskCommandInputProps) {
  const [showGuidedChoice, setShowGuidedChoice] = useState(false);
  const [commandText, setCommandText] = useState("");
  const [commandError, setCommandError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionController | null>(null);

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setCommandError("Speech recognition is not supported in this browser.");
      return;
    }

    setCommandError(null);
    const controller = startSpeechRecognition({
      onResult: (transcript) => {
        setCommandText(transcript);
      },
      onError: (err) => {
        setCommandError(err);
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

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commandText.trim();
    if (!trimmed || loading) return;

    setCommandError(null);

    // 1. Check for transfer/crypto intent
    if (/(?:transfer|send|pay|usdc|sepolia|base|0x[a-f0-9]{40})/i.test(trimmed)) {
      const parsed = parseTransferIntent(trimmed);
      if (!parsed.ok && parsed.error) {
        // Enforce instant pre-popup safety rejection (e.g. "exceeds strict safety maximum of 0.01 USDC")
        setCommandError(parsed.error);
        playSoundEffect("warning", isMuted);
        return;
      }
      playSoundEffect("task_accepted", isMuted);
      onSelectTask("wallet_transfer", trimmed);
      return;
    }

    // 2. Intent matching for financial safety tasks
    playSoundEffect("task_accepted", isMuted);
    if (/compare|offers?|versus|vs/i.test(trimmed)) {
      onSelectTask("compare_offers", trimmed);
    } else if (/afford|income|expenses?|take-?home|dti/i.test(trimmed)) {
      onSelectTask("affordability", trimmed);
    } else if (/crypto|collateral|ltv|liquidation/i.test(trimmed)) {
      onSelectTask("crypto_risk", trimmed);
    } else if (/red flags?|scam|fraud|warning|upfront|otp|seed phrase/i.test(trimmed)) {
      onSelectTask("red_flags", trimmed);
    } else if (/document|agreement|contract|clause|checklist/i.test(trimmed)) {
      onSelectTask("doc_review", trimmed);
    } else {
      onSelectTask("loan_cost", trimmed);
    }
  };

  // The 7 required selectable tasks
  const tasks = [
    {
      id: "loan_cost" as TaskType,
      label: "Calculate my true loan cost",
      description: "True APR, reducing EMI, and total interest outflow",
      icon: Calculator,
      color: "text-[#56D9F5]",
      iconBg: "bg-[#56D9F5]/10",
      borderHover: "hover:border-[#56D9F5]/50",
      badge: null,
    },
    {
      id: "compare_offers" as TaskType,
      label: "Compare loan offers",
      description: "Side-by-side repayment and total net outflow comparison",
      icon: Scale,
      color: "text-[#39D6C0]",
      iconBg: "bg-[#39D6C0]/10",
      borderHover: "hover:border-[#39D6C0]/50",
      badge: null,
    },
    {
      id: "affordability" as TaskType,
      label: "Check if I can afford a loan",
      description: "Disposable income cushion & EMI-to-income stress test",
      icon: PieChart,
      color: "text-[#78F5CF]",
      iconBg: "bg-[#78F5CF]/10",
      borderHover: "hover:border-[#78F5CF]/50",
      badge: null,
    },
    {
      id: "crypto_risk" as TaskType,
      label: "Assess crypto collateral risk",
      description: "LTV ratio & price-drop liquidation stress tests",
      icon: Coins,
      color: "text-[#56D9F5]",
      iconBg: "bg-[#56D9F5]/10",
      borderHover: "hover:border-[#56D9F5]/50",
      badge: null,
    },
    {
      id: "red_flags" as TaskType,
      label: "Check for loan scams and warning signs",
      description: "Screen advance fee traps, secrecy demands & pressure tactics",
      icon: ShieldAlert,
      color: "text-[#F4BB63]",
      iconBg: "bg-[#F4BB63]/10",
      borderHover: "hover:border-[#F4BB63]/50",
      badge: null,
    },
    {
      id: "doc_review" as TaskType,
      label: "Review my loan documents",
      description: "Verify mandatory contract clauses & terms before signing",
      icon: ClipboardCheck,
      color: "text-[#78F5CF]",
      iconBg: "bg-[#78F5CF]/10",
      borderHover: "hover:border-[#78F5CF]/50",
      badge: null,
    },
    {
      id: "wallet_transfer" as TaskType,
      label: "Prepare a wallet transfer",
      description: "Base Sepolia ETH, Sepolia USDC (MetaMask) or simulated ledger",
      icon: Wallet,
      color: "text-[#39D6C0]",
      iconBg: "bg-[#39D6C0]/10",
      borderHover: "hover:border-[#39D6C0]/50",
      badge: "BASE / SEPOLIA",
    },
  ];

  // Guided scenarios for "I'm not sure — help me choose"
  const guidedScenarios = [
    {
      task: "loan_cost" as TaskType,
      question: "I'm looking to borrow and want to calculate my true monthly EMI & fees.",
      tag: "True Cost",
    },
    {
      task: "compare_offers" as TaskType,
      question: "I have 2 loan offers from different lenders and want to know which is cheaper.",
      tag: "Comparison",
    },
    {
      task: "affordability" as TaskType,
      question: "I need to verify if my monthly income can safely handle a new debt payment.",
      tag: "Affordability",
    },
    {
      task: "crypto_risk" as TaskType,
      question: "I want to deposit crypto collateral and see my exact liquidation price.",
      tag: "Crypto LTV",
    },
    {
      task: "red_flags" as TaskType,
      question: "A lender asked for an advance fee, password, or is rushing me urgently.",
      tag: "Scam Detection",
    },
    {
      task: "doc_review" as TaskType,
      question: "I want to review an agreement contract before signing to catch missing terms.",
      tag: "Agreement",
    },
    {
      task: "wallet_transfer" as TaskType,
      question: "I want to send USDC on Sepolia testnet or test a simulated transfer.",
      tag: "Wallet Transfer",
    },
  ];

  const handleSelect = (taskId: TaskType) => {
    playSoundEffect("task_accepted", isMuted);
    onSelectTask(taskId);
  };

  return (
    <div className="w-full rounded-2xl border border-[#8E9EB5]/15 bg-[#0D192A]/80 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
      {/* View 1: Guided Choice Interface */}
      {showGuidedChoice ? (
        <div className="space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#8E9EB5]/10">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#56D9F5]/10 text-[#56D9F5]">
                <Sparkles size={14} />
              </div>
              <h3 className="text-sm font-semibold text-[#F1F5F9]">
                Guided Intent Selection
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowGuidedChoice(false)}
              className="flex items-center gap-1 text-[11px] font-medium text-[#8E9EB5] hover:text-[#56D9F5] transition-colors cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Back to list</span>
            </button>
          </div>

          <p className="text-xs text-[#8E9EB5] leading-relaxed">
            Which situation best describes what you are trying to accomplish?
          </p>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {guidedScenarios.map((sc, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleSelect(sc.task)}
                className="group w-full flex items-center justify-between gap-3 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-3 text-left transition-all hover:bg-[#122238] hover:border-[#56D9F5]/40 focus:outline-none focus:ring-1 focus:ring-[#56D9F5]/40 cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-[#56D9F5]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#56D9F5] border border-[#56D9F5]/20">
                      {sc.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#F1F5F9] leading-snug group-hover:text-white">
                    {sc.question}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="shrink-0 text-[#8E9EB5]/40 group-hover:text-[#56D9F5] group-hover:translate-x-0.5 transition-all"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* View 2: Compact Intent-Selection Panel */
        <div className="space-y-3">
          {/* Header */}
          <div className="pb-1">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#F1F5F9]">
              How can I help you?
            </h2>
            <p className="text-[11px] text-[#8E9EB5] mt-0.5">
              Type, speak, or select an assessment below to begin.
            </p>
          </div>

          {/* Natural Language Prompt Command Bar */}
          <form onSubmit={handleCommandSubmit} className="space-y-2">
            <div className="relative flex items-center rounded-xl border border-[#56D9F5]/30 bg-[#08111F]/90 px-3 py-1.5 focus-within:border-[#56D9F5] focus-within:ring-1 focus-within:ring-[#56D9F5]/50 transition-all">
              <input
                id="agent-command-input"
                type="text"
                value={commandText}
                onChange={(e) => {
                  setCommandText(e.target.value);
                  if (commandError) setCommandError(null);
                }}
                disabled={loading}
                placeholder="Type a request (e.g., 'Send 0.01 USDC to 0x...')"
                className="w-full bg-transparent text-xs text-[#F1F5F9] placeholder-[#8E9EB5]/60 focus:outline-none"
              />
              <div className="flex items-center gap-1.5 pl-2 shrink-0">
                <button
                  id="agent-voice-input-btn"
                  type="button"
                  onClick={handleToggleVoice}
                  title={isListening ? "Stop listening" : "Speak your request"}
                  className={`rounded-lg p-1.5 text-xs transition-colors cursor-pointer ${
                    isListening
                      ? "bg-[#F87171]/20 text-[#F87171] animate-pulse"
                      : "text-[#8E9EB5] hover:text-[#56D9F5] hover:bg-[#56D9F5]/10"
                  }`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <button
                  id="agent-submit-command-btn"
                  type="submit"
                  disabled={loading || !commandText.trim()}
                  title="Submit request"
                  className="rounded-lg bg-[#56D9F5] p-1.5 text-[#08111F] hover:bg-[#78F5CF] transition-colors disabled:opacity-40 disabled:hover:bg-[#56D9F5] cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>

            {/* Safety Limit / Validation Error Notice */}
            {commandError && (
              <div
                id="command-safety-error-notice"
                className="flex items-start gap-2 rounded-xl border border-[#F87171]/40 bg-[#F87171]/10 p-2.5 text-xs text-[#F87171] animate-fadeIn"
              >
                <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#F87171]" />
                <div className="text-[11px] leading-relaxed">
                  <strong className="block font-semibold">Safety Boundary Guard:</strong>
                  <span>{commandError}</span>
                </div>
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#8E9EB5]/15"></div>
            <span className="flex-shrink mx-2 text-[9px] font-mono uppercase tracking-wider text-[#8E9EB5]/60">
              Or Choose an Assessment
            </span>
            <div className="flex-grow border-t border-[#8E9EB5]/15"></div>
          </div>

          {/* 7 Sleek Selectable Rows */}
          <div className="space-y-1.5 sm:space-y-2">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <button
                  key={task.id}
                  id={`task-option-${task.id}`}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelect(task.id)}
                  className={`group relative flex w-full items-center justify-between rounded-xl border border-[#8E9EB5]/15 bg-[#0D192A]/90 px-3 py-2 sm:py-2.5 text-left transition-all duration-200 hover:bg-[#122238] hover:shadow-lg ${task.borderHover} focus:outline-none focus:ring-1 focus:ring-[#56D9F5]/40 cursor-pointer disabled:opacity-50`}
                >
                  {/* Left: Icon + Text */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#8E9EB5]/20 ${task.iconBg} ${task.color}`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-[13px] font-semibold text-[#F1F5F9] group-hover:text-white truncate">
                          {task.label}
                        </span>
                        {task.badge && (
                          <span className="hidden sm:inline-block shrink-0 rounded bg-[#F4BB63]/15 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-[#F4BB63] border border-[#F4BB63]/30">
                            {task.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-[#8E9EB5] truncate leading-tight mt-0.5">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Subtle Arrow */}
                  <div className="flex items-center gap-1 shrink-0">
                    <ArrowRight
                      size={14}
                      className="text-[#8E9EB5]/40 group-hover:text-[#56D9F5] group-hover:translate-x-0.5 transition-all duration-200"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Secondary Option: I'm not sure — help me choose */}
          <div className="pt-1 border-t border-[#8E9EB5]/10">
            <button
              id="help-me-choose-btn"
              type="button"
              disabled={loading}
              onClick={() => {
                playSoundEffect("task_accepted", isMuted);
                setShowGuidedChoice(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#8E9EB5]/25 bg-[#122238]/40 py-2 px-3 text-xs font-medium text-[#8E9EB5] hover:border-[#56D9F5]/40 hover:bg-[#56D9F5]/5 hover:text-[#56D9F5] transition-all cursor-pointer"
            >
              <HelpCircle size={13} className="text-[#56D9F5]/70" />
              <span>I’m not sure — help me choose</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
