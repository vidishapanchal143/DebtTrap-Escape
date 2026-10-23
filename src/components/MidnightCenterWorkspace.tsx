"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  CheckSquare,
} from "lucide-react";
import {
  AgentTaskStatus,
  ChatMessage,
  PreparedTransferInfo,
  ToolExecutionEvent,
} from "@/types/midnight";

interface MidnightCenterWorkspaceProps {
  taskStatus: AgentTaskStatus;
  messages: ChatMessage[];
  chatLoading: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onConfirmTransfer: (tx: PreparedTransferInfo) => Promise<void>;
  onCancelTransfer: (tx: PreparedTransferInfo) => Promise<void>;
  onSelectPrompt: (prompt: string) => void;
  onResetWorkspace: () => void;
  activePreparedTx: PreparedTransferInfo | null;
  confirmedTxId: string;
}

export function MidnightCenterWorkspace({
  taskStatus,
  messages,
  chatLoading,
  onSendMessage,
  onConfirmTransfer,
  onCancelTransfer,
  onSelectPrompt,
  onResetWorkspace,
}: MidnightCenterWorkspaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [showRealChainDetails, setShowRealChainDetails] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, taskStatus]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || chatLoading) return;
    setInputValue("");
    void onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const promptSuggestions = [
    {
      category: "Loan Analysis",
      label: "Estimate loan EMI & total outflow",
      prompt: "Calculate EMI and total interest for a ₹5,00,000 loan at 12% annual interest for 36 months with a ₹2,000 upfront fee.",
    },
    {
      category: "Offer Comparison",
      label: "Compare two loan offers",
      prompt: "Compare two offers on ₹3,00,000 for 24 months: Offer A has 11.5% interest and ₹1,500 fee; Offer B has 12.5% interest and ₹0 fee.",
    },
    {
      category: "Affordability",
      label: "Assess budget & cash-flow",
      prompt: "Can I afford a ₹15,000 monthly EMI with ₹45,000 take-home income, ₹18,000 living expenses, and ₹5,000 existing EMIs?",
    },
    {
      category: "Web3 Collateral",
      label: "Crypto collateral risk & liquidation",
      prompt: "Analyze crypto loan risk: 2 ETH collateral at $2,500/ETH with a $2,000 USDC loan and 80% liquidation threshold.",
    },
    {
      category: "Warning Signs",
      label: "Screen lender red flags",
      prompt: "Review for warning signs: The lender agent told me approval is 100% guaranteed, but I must pay a ₹3,500 advance fee today before signing.",
    },
    {
      category: "Demo Wallet",
      label: "Simulated transfer request",
      prompt: "Prepare a demo transfer of 25 SIM-USDC to 0x71C8363837918a71018283726152817291829101.",
    },
  ];

  const getStatusBadge = () => {
    switch (taskStatus) {
      case "running":
        return {
          label: "AGENT RUNNING",
          desc: "Reasoning and evaluating financial tools...",
          badgeClass: "bg-[#56D9F5]/15 text-[#56D9F5] border-[#56D9F5]/30",
          dotClass: "bg-[#56D9F5] animate-ping",
        };
      case "planning":
        return {
          label: "PLANNING TASK",
          desc: "Structuring parameters and checking requirements...",
          badgeClass: "bg-[#39D6C0]/15 text-[#39D6C0] border-[#39D6C0]/30",
          dotClass: "bg-[#39D6C0] animate-pulse",
        };
      case "awaiting_approval":
        return {
          label: "AWAITING APPROVAL",
          desc: "Action prepared. Explicit authorization required.",
          badgeClass: "bg-[#F4BB63]/20 text-[#F4BB63] border-[#F4BB63]/40",
          dotClass: "bg-[#F4BB63] animate-pulse",
        };
      case "needs_input":
        return {
          label: "NEEDS INPUT",
          desc: "Additional terms required to complete calculation.",
          badgeClass: "bg-[#39D6C0]/15 text-[#39D6C0] border-[#39D6C0]/30",
          dotClass: "bg-[#39D6C0]",
        };
      case "completed":
        return {
          label: "TASK COMPLETED",
          desc: "Analysis grounded in verified data & calculations.",
          badgeClass: "bg-[#78F5CF]/15 text-[#78F5CF] border-[#78F5CF]/30",
          dotClass: "bg-[#78F5CF]",
        };
      case "error":
        return {
          label: "EXECUTION ERROR",
          desc: "Unable to complete request. Please review input.",
          badgeClass: "bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30",
          dotClass: "bg-[#F87171]",
        };
      default:
        return {
          label: "AGENT READY",
          desc: "Awaiting loan terms, comparative offers, or tasks.",
          badgeClass: "bg-[#8E9EB5]/15 text-[#8E9EB5] border-[#8E9EB5]/25",
          dotClass: "bg-[#78F5CF]",
        };
    }
  };

  const statusInfo = getStatusBadge();

  // Helper to render inline bold and bulleted text
  const renderMessageContent = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      if (/^#{1,3}\s/.test(trimmed)) {
        const title = trimmed.replace(/^#{1,3}\s/, "").replace(/\*\*/g, "");
        return (
          <h4 key={idx} className="mt-3 mb-1 text-sm font-bold text-[#56D9F5]">
            {title}
          </h4>
        );
      }

      const bulletMatch = trimmed.match(/^(?:[-*]|\d+[.)])\s+(.*)$/);
      if (bulletMatch) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs text-[#CBD5E1] leading-relaxed">
            <span className="text-[#39D6C0] font-bold select-none">•</span>
            <div>{renderInline(bulletMatch[1])}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="my-1.5 text-xs text-[#CBD5E1] leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    });
  };

  const renderInline = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-[#08111F] text-[#F1F5F9] overflow-hidden">
      {/* Workspace Sub-Header / Status Bar */}
      <div className="flex h-[56px] items-center justify-between border-b border-[#8E9EB5]/15 bg-[#0D192A]/90 px-6 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusInfo.dotClass}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${statusInfo.dotClass.split(" ")[0]}`} />
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
          </div>
          <span className="hidden md:inline text-xs text-[#8E9EB5] border-l border-[#8E9EB5]/20 pl-3">
            {statusInfo.desc}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={onResetWorkspace}
              className="flex items-center gap-1.5 rounded-lg border border-[#8E9EB5]/20 bg-[#122238]/60 px-2.5 py-1 text-xs text-[#8E9EB5] hover:bg-[#122238] hover:text-white transition-colors"
              title="Reset conversation and start fresh"
              aria-label="Reset Conversation"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation & Activity Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Welcome State when conversation is empty */}
        {messages.length <= 1 && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-[#8E9EB5]/15 bg-gradient-to-b from-[#0D192A] to-[#122238]/60 p-6 md:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#8E9EB5]/15">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#56D9F5]">
                  <Sparkles size={14} />
                  <span>AI Financial Intelligence System</span>
                </div>
                <h1 className="mt-1 text-xl md:text-2xl font-bold tracking-tight text-white">
                  Welcome to DebtTrap Escape Command Center
                </h1>
                <p className="mt-1.5 text-xs md:text-sm text-[#8E9EB5] leading-relaxed">
                  Analyze loan agreements, estimate True Cost, assess cash-flow affordability, test crypto collateral liquidation risks, and simulate secure wallet workflows.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-[#08111F]/60 border border-[#8E9EB5]/20 p-2.5 text-xs text-[#CBD5E1]">
                <Cpu size={16} className="text-[#39D6C0]" />
                <div>
                  <div className="font-semibold text-white">Deterministic + Gemini</div>
                  <div className="text-[10px] text-[#8E9EB5]">Strict Zod Validation</div>
                </div>
              </div>
            </div>

            {/* Supported Agent Capabilities */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: "True Cost & EMI", desc: "Principal, fees, reducing-balance schedule, and extra charges." },
                { title: "Offer Comparison", desc: "Like-for-like evaluation of two lender proposals." },
                { title: "Cash-Flow Budget", desc: "EMI-to-income ratio & disposable income indicators." },
                { title: "Crypto Collateral", desc: "LTV ratios, liquidation price, & 20/40/60% drop stress tests." },
                { title: "Warning Screening", desc: "Identifies advance fee traps, secrecy, and high-pressure signs." },
                { title: "Simulated Wallet", desc: "Off-chain SQLite ledger for transfer preparation & confirmation." },
              ].map((cap, i) => (
                <div key={i} className="rounded-xl border border-[#8E9EB5]/10 bg-[#08111F]/40 p-3 hover:border-[#56D9F5]/30 transition-colors">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <CheckSquare size={13} className="text-[#78F5CF]" />
                    {cap.title}
                  </div>
                  <div className="mt-1 text-[11px] text-[#8E9EB5] leading-snug">{cap.desc}</div>
                </div>
              ))}
            </div>

            {/* Suggested Prompts Quick Starter */}
            <div className="mt-6 pt-5 border-t border-[#8E9EB5]/15">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8E9EB5] mb-3">
                Suggested Prompts (Click to Run)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectPrompt(item.prompt)}
                    className="group flex flex-col items-start rounded-xl border border-[#8E9EB5]/15 bg-[#08111F]/50 p-3 text-left transition-all hover:border-[#56D9F5]/40 hover:bg-[#122238] focus:outline-none focus:ring-1 focus:ring-[#56D9F5]"
                  >
                    <div className="flex w-full items-center justify-between text-[10px] font-semibold text-[#56D9F5] uppercase tracking-wide">
                      <span>{item.category}</span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="mt-1 text-xs font-medium text-white group-hover:text-[#78F5CF]">
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#8E9EB5] line-clamp-1">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => {
            const isAgent = message.role === "agent";
            return (
              <div
                key={message.id}
                className={`flex gap-3 md:gap-4 ${
                  isAgent ? "items-start" : "items-start justify-end"
                }`}
              >
                {/* Agent Avatar */}
                {isAgent && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#122238] to-[#0D192A] border border-[#56D9F5]/30 text-[#56D9F5] shadow-sm">
                    <Bot size={17} />
                  </div>
                )}

                {/* Message Bubble & Content */}
                <div
                  className={`relative max-w-[88%] md:max-w-[80%] rounded-2xl p-4 md:p-5 shadow-md ${
                    isAgent
                      ? "bg-[#0D192A] border border-[#8E9EB5]/20 text-[#F1F5F9]"
                      : "bg-[#122238] border border-[#39D6C0]/30 text-white"
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#8E9EB5]/10 text-[11px]">
                    <span className="font-semibold tracking-wide flex items-center gap-1.5">
                      {isAgent ? (
                        <>
                          <span className="text-[#56D9F5]">DebtTrap Escape AI</span>
                          <span className="rounded bg-[#56D9F5]/10 px-1.5 py-0.2 text-[9px] text-[#56D9F5] font-normal">
                            AI Verified
                          </span>
                        </>
                      ) : (
                        <span className="text-[#39D6C0]">You</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 text-[#8E9EB5]/60 text-[10px]">
                      <span>{message.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(message.text, message.id)}
                        className="hover:text-white transition-colors"
                        title="Copy message text"
                        aria-label="Copy text"
                      >
                        {copiedId === message.id ? <Check size={12} className="text-[#78F5CF]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Main Message Body */}
                  <div className="prose-invert">
                    {renderMessageContent(message.text)}
                  </div>

                  {/* Inspectable Tool Execution Activity Card */}
                  {isAgent && message.toolEvents && message.toolEvents.length > 0 && (
                    <div className="mt-4 rounded-xl border border-[#8E9EB5]/20 bg-[#08111F]/70 p-3">
                      <button
                        type="button"
                        onClick={() => toggleToolExpand(message.id)}
                        className="flex w-full items-center justify-between text-left text-xs font-semibold text-[#8E9EB5] hover:text-white transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers size={13} className="text-[#39D6C0]" />
                          <span>Tool Executions ({message.toolEvents.length})</span>
                          <span className="rounded bg-[#39D6C0]/15 px-1.5 py-0.5 text-[9px] text-[#39D6C0] font-normal">
                            Verified Server Output
                          </span>
                        </span>
                        {expandedTools[message.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {expandedTools[message.id] && (
                        <div className="mt-3 space-y-2 border-t border-[#8E9EB5]/15 pt-2.5">
                          {message.toolEvents.map((evt: ToolExecutionEvent, i: number) => (
                            <div
                              key={i}
                              className="rounded-lg border border-[#8E9EB5]/15 bg-[#122238]/60 p-2.5 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-semibold text-[#56D9F5]">
                                  {evt.name}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                    evt.status === "completed"
                                      ? "bg-[#78F5CF]/15 text-[#78F5CF]"
                                      : "bg-[#F87171]/15 text-[#F87171]"
                                  }`}
                                >
                                  {evt.status}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] text-[#CBD5E1] leading-relaxed">
                                {evt.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Structured Transaction Review & Approval Card */}
                  {message.preparedTx && (
                    <div className="mt-4 rounded-xl border-2 border-[#F4BB63]/40 bg-gradient-to-b from-[#122238] to-[#0D192A] p-4 shadow-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#F4BB63] uppercase tracking-wider pb-2 border-b border-[#F4BB63]/20">
                        <AlertTriangle size={15} />
                        <span>Action Required: Structured Transaction Review</span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-[#8E9EB5]/10">
                          <span className="text-[#8E9EB5]">Token & Amount:</span>
                          <span className="font-semibold text-white font-mono">
                            {(message.preparedTx.amountCents / 100).toFixed(2)} SIM-USDC
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-[#8E9EB5]/10">
                          <span className="text-[#8E9EB5]">Recipient Address:</span>
                          <div className="flex items-center gap-1 font-mono text-[11px] text-[#56D9F5]">
                            <span>{message.preparedTx.recipient.slice(0, 10)}…{message.preparedTx.recipient.slice(-6)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(message.preparedTx?.recipient || "", "tx-recip")}
                              className="text-[#8E9EB5] hover:text-white"
                              title="Copy recipient address"
                              aria-label="Copy address"
                            >
                              {copiedId === "tx-recip" ? <Check size={11} className="text-[#78F5CF]" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-[#8E9EB5]/10">
                          <span className="text-[#8E9EB5]">Network:</span>
                          <span className="rounded bg-[#F4BB63]/15 px-2 py-0.5 text-[10px] font-semibold text-[#F4BB63]">
                            Local SQLite Ledger (Off-Chain)
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-[#8E9EB5]/10">
                          <span className="text-[#8E9EB5]">Estimated Network Fee:</span>
                          <span className="text-white font-mono">0.00 SIM-USDC (Local Demo)</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-[#8E9EB5]/10">
                          <span className="text-[#8E9EB5]">Total Debit:</span>
                          <span className="font-bold text-[#78F5CF] font-mono">
                            {(message.preparedTx.totalDebit / 100).toFixed(2)} SIM-USDC
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <span className="text-[#8E9EB5]">Status:</span>
                          <span className="font-semibold text-[#F4BB63]">Pending Explicit User Approval</span>
                        </div>
                      </div>

                      {/* Educational Disclaimer Banner */}
                      <div className="mt-3 rounded-lg bg-[#08111F]/80 border border-[#8E9EB5]/15 p-2.5 text-[11px] text-[#8E9EB5] leading-relaxed">
                        <div className="flex items-center gap-1.5 font-semibold text-[#F4BB63] mb-1">
                          <Info size={13} />
                          <span>Educational Simulation Only</span>
                        </div>
                        This transfer runs entirely within your browser&apos;s local SQLite database. SIM-USDC is not a real cryptocurrency, no tokens leave your device, and no blockchain transaction hash is fabricated.
                      </div>

                      {/* Expandable Web3 Target Real-Chain comparison */}
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => setShowRealChainDetails(!showRealChainDetails)}
                          className="text-[10px] text-[#56D9F5] hover:underline flex items-center gap-1"
                        >
                          <span>{showRealChainDetails ? "Hide" : "Inspect"} Week 2 Target Blockchain Flow Details</span>
                          {showRealChainDetails ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>

                        {showRealChainDetails && (
                          <div className="mt-2 rounded-lg bg-[#08111F]/90 p-2.5 text-[10px] text-[#8E9EB5] space-y-1.5 border border-[#8E9EB5]/10">
                            <p>
                              <strong>Target Web3 Architecture:</strong> Real ERC-20 transfers require a connected Ethereum provider (e.g. MetaMask / Wagmi), sufficient testnet ETH for gas, and an on-chain smart contract call.
                            </p>
                            <p>
                              <strong>Implemented On-Chain Element:</strong> DebtTrap Escape implements and verifies the <code className="text-[#56D9F5]">EvidenceHashRegistry.sol</code> smart contract on Ethereum Sepolia at <a href="https://sepolia.etherscan.io/address/0x8638143982BfddAc9a8c60A49A6d119c5a607aBd" target="_blank" rel="noreferrer" className="underline text-[#78F5CF]">0x8638143982BfddAc9a8c60A49A6d119c5a607aBd</a> for immutable document hashing, while financial transfers remain simulated.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Approval Controls */}
                      <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#8E9EB5]/15">
                        <button
                          type="button"
                          onClick={() => onConfirmTransfer(message.preparedTx!)}
                          disabled={chatLoading}
                          className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl bg-[#78F5CF] px-4 py-2 text-xs font-bold text-[#08111F] hover:bg-[#8bf7d5] active:scale-[0.98] transition-all disabled:opacity-50"
                          aria-label="Confirm Transaction"
                        >
                          <CheckCircle2 size={15} />
                          <span>Confirm Transfer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onCancelTransfer(message.preparedTx!)}
                          disabled={chatLoading}
                          className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-xl border border-[#F87171]/40 bg-[#F87171]/10 px-4 py-2 text-xs font-semibold text-[#F87171] hover:bg-[#F87171]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                          aria-label="Cancel Transaction"
                        >
                          <XCircle size={15} />
                          <span>Cancel Transfer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Confirmed Tx Result Banner */}
                  {message.confirmedTxId && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#78F5CF]/10 border border-[#78F5CF]/30 p-2.5 text-xs text-[#78F5CF]">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <div>
                        <span className="font-bold">Transfer Confirmed:</span> Transaction recorded in local SQLite ledger (ID: <code className="font-mono text-[11px] text-white">{message.confirmedTxId}</code>).
                      </div>
                    </div>
                  )}

                  {/* Safety Disclaimer in Agent Footnote */}
                  {isAgent && (
                    <div className="mt-3 pt-2 border-t border-[#8E9EB5]/10 flex items-center gap-1.5 text-[10px] text-[#8E9EB5]/60">
                      <ShieldAlert size={11} className="shrink-0 text-[#F4BB63]" />
                      <span>Educational estimate only. Never share passwords, OTPs, or private keys.</span>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {!isAgent && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#122238] border border-[#39D6C0]/30 text-[#39D6C0] shadow-sm">
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Genuine Agent Activity Indicator */}
          {chatLoading && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-[#56D9F5]/25 bg-[#0D192A]/80 shadow-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#56D9F5]/15 text-[#56D9F5]">
                <Bot size={16} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#56D9F5] animate-ping" />
                  <span>Evaluating loan terms & executing verified tools…</span>
                </div>
                <div className="text-[11px] text-[#8E9EB5] mt-0.5">
                  Calculating monthly EMI, comparative outflow, and cross-referencing red flags.
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Accessible Prompt Composer Footer */}
      <div className="border-t border-[#8E9EB5]/15 bg-[#0D192A] p-4 shrink-0">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Quick Pill Suggestions above input */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E9EB5]/60 shrink-0">
              Quick:
            </span>
            {[
              "Estimate ₹5L loan at 12% for 36 mos",
              "Compare Offer A 11% vs Offer B 13%",
              "Check budget with ₹45k income",
              "Check crypto loan: 2 ETH at $2500",
              "Screen warning signs in text",
            ].map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectPrompt(text)}
                disabled={chatLoading}
                className="shrink-0 rounded-full border border-[#8E9EB5]/20 bg-[#122238]/60 px-2.5 py-1 text-[11px] text-[#CBD5E1] hover:border-[#56D9F5]/40 hover:text-white transition-colors disabled:opacity-50"
              >
                {text}
              </button>
            ))}
          </div>

          {/* Textarea Input Form */}
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <div className="relative flex-1">
              <label htmlFor="agent-prompt-composer" className="sr-only">
                Ask DebtTrap Escape Agent about a loan, comparison, or transfer
              </label>
              <textarea
                ref={textareaRef}
                id="agent-prompt-composer"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about a loan, compare two offers, assess affordability, or prepare a demo transfer… (Enter to send, Shift+Enter for new line)"
                disabled={chatLoading}
                rows={2}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-[#8E9EB5]/25 bg-[#08111F] p-3 pr-12 text-xs md:text-sm text-white placeholder-[#8E9EB5]/50 focus:border-[#56D9F5] focus:outline-none focus:ring-2 focus:ring-[#56D9F5]/20 transition-all disabled:opacity-50 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={chatLoading || !inputValue.trim()}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#78F5CF] text-[#08111F] shadow-lg shadow-[#78F5CF]/20 hover:bg-[#8bf7d5] active:scale-[0.96] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send prompt to AI Agent"
            >
              <Send size={18} className="translate-x-0.5" />
            </button>
          </form>

          {/* Accessibility & Disclaimer Footnote */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-[#8E9EB5]/60">
            <span>
              Press <kbd className="rounded bg-[#122238] px-1 py-0.5 font-mono text-[9px] text-white">Enter</kbd> to submit, <kbd className="rounded bg-[#122238] px-1 py-0.5 font-mono text-[9px] text-white">Shift+Enter</kbd> for new line.
            </span>
            <span>
              All calculations are deterministic estimates. No real on-chain assets moved.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
