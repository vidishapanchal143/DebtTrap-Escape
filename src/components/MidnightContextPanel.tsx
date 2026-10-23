"use client";

import React, { useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  Fingerprint,
  Wallet,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from "lucide-react";
import { LoanCalcSummary, PreparedTransferInfo } from "@/types/midnight";

interface MidnightContextPanelProps {
  calc: LoanCalcSummary;
  activePreparedTx: PreparedTransferInfo | null;
  lastConfirmedTxId: string;
  originalFile: File | null;
  originalHash: string;
  comparisonHash: string;
  walletBalance: { balance: number; asset: string } | null;
  onRefreshBalance: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const money = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(val) ? val : 0);

export function MidnightContextPanel({
  calc,
  activePreparedTx,
  lastConfirmedTxId,
  originalFile,
  originalHash,
  comparisonHash,
  walletBalance,
  onRefreshBalance,
  mobileOpen,
  setMobileOpen,
}: MidnightContextPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [activeTab, setActiveTab] = useState<"finance" | "risk" | "evidence" | "wallet">("finance");

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  };

  const isHighRate = calc.annualRate >= 24;
  const hasFee = calc.upfrontFee > 0;
  const isMatch = originalHash && comparisonHash && originalHash === comparisonHash;
  const isMismatch = originalHash && comparisonHash && originalHash !== comparisonHash;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#08111F]/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 flex w-[340px] flex-col border-l border-[#8E9EB5]/15 bg-[#0D192A] text-[#F1F5F9] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"
        }`}
        aria-label="Financial and Risk Inspector"
      >
        {/* Header */}
        <div className="flex h-[56px] items-center justify-between border-b border-[#8E9EB5]/15 px-4 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-[#56D9F5]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Financial & Risk Inspector
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-[#8E9EB5] hover:bg-[#122238] hover:text-white lg:hidden"
            aria-label="Close Inspector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 border-b border-[#8E9EB5]/15 bg-[#08111F]/50 p-1 text-[11px] font-semibold">
          {[
            { id: "finance", label: "Breakdown" },
            { id: "risk", label: "Risks" },
            { id: "evidence", label: "Evidence" },
            { id: "wallet", label: "Ledger" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`rounded-lg py-1.5 text-center transition-colors ${
                activeTab === tab.id
                  ? "bg-[#122238] text-[#56D9F5] shadow-sm font-bold"
                  : "text-[#8E9EB5] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: FINANCIAL BREAKDOWN */}
          {activeTab === "finance" && (
            <div className="space-y-4">
              {/* Primary Key Metrics Card */}
              <div className="rounded-2xl border border-[#8E9EB5]/20 bg-gradient-to-br from-[#122238] to-[#0D192A] p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#56D9F5]">
                    True Cost Summary
                  </span>
                  <span className="rounded bg-[#56D9F5]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#56D9F5]">
                    Deterministic
                  </span>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] uppercase tracking-wide text-[#8E9EB5]">
                    Amount You Actually Receive
                  </span>
                  <div className="text-xl font-bold text-white tracking-tight">
                    {money(calc.netDisbursed)}
                  </div>
                  {hasFee && (
                    <div className="text-[10px] text-[#F4BB63] mt-0.5">
                      ⚠️ Deducts {money(calc.upfrontFee)} upfront fee from principal
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#8E9EB5]/15 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#8E9EB5]">Monthly EMI</span>
                    <div className="text-base font-bold text-[#78F5CF]">
                      {money(calc.monthlyEmi)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8E9EB5]">Total Repayment</span>
                    <div className="text-base font-bold text-white">
                      {money(calc.totalOutflow)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Rows */}
              <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/40 p-3.5 space-y-2.5 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8E9EB5] pb-1 border-b border-[#8E9EB5]/10">
                  Loan Calculation Parameters
                </div>

                <div className="flex justify-between items-center text-[#CBD5E1]">
                  <span className="text-[#8E9EB5]">Stated Principal:</span>
                  <span className="font-semibold text-white">{money(calc.principal)}</span>
                </div>

                <div className="flex justify-between items-center text-[#CBD5E1]">
                  <span className="text-[#8E9EB5]">Annual Interest Rate:</span>
                  <span className="font-semibold text-white">{calc.annualRate}%</span>
                </div>

                <div className="flex justify-between items-center text-[#CBD5E1]">
                  <span className="text-[#8E9EB5]">Tenure:</span>
                  <span className="font-semibold text-white">
                    {calc.termMonths} mos ({(calc.termMonths / 12).toFixed(1)} yrs)
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#CBD5E1]">
                  <span className="text-[#8E9EB5]">Known Upfront Fee:</span>
                  <span className={`font-semibold ${hasFee ? "text-[#F4BB63]" : "text-white"}`}>
                    {hasFee ? money(calc.upfrontFee) : "None (₹0)"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#CBD5E1] pt-2 border-t border-[#8E9EB5]/10">
                  <span className="text-[#8E9EB5]">Total Interest Outflow:</span>
                  <span className="font-semibold text-[#56D9F5]">{money(calc.totalInterest)}</span>
                </div>

                <div className="flex justify-between items-center text-[#CBD5E1]">
                  <span className="text-[#8E9EB5]">Total Additional Cost:</span>
                  <span className="font-bold text-[#F4BB63]">{money(calc.additionalCost)}</span>
                </div>
              </div>

              {/* Expandable Assumptions & Caveats */}
              <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#08111F]/60 p-3">
                <button
                  type="button"
                  onClick={() => setShowAssumptions(!showAssumptions)}
                  className="flex w-full items-center justify-between text-xs font-semibold text-[#8E9EB5] hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <Info size={13} className="text-[#56D9F5]" />
                    <span>Important Assumptions ({calc.assumptions.length})</span>
                  </span>
                  {showAssumptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAssumptions && (
                  <ul className="mt-2.5 space-y-1.5 border-t border-[#8E9EB5]/15 pt-2 text-[11px] text-[#8E9EB5] leading-relaxed">
                    {calc.assumptions.map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#56D9F5] font-bold select-none">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RISK & WARNINGS */}
          {activeTab === "risk" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/5 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F4BB63] uppercase tracking-wide">
                  <AlertTriangle size={15} />
                  <span>Cost Warnings</span>
                </div>

                {hasFee ? (
                  <div className="text-[11px] text-[#CBD5E1] leading-relaxed">
                    <strong className="text-white">Upfront Fee Deducted:</strong> The lender charges {money(calc.upfrontFee)} upfront. You will only receive {money(calc.netDisbursed)} in your bank account, but pay interest on the full {money(calc.principal)}.
                  </div>
                ) : (
                  <div className="text-[11px] text-[#8E9EB5]">
                    No upfront processing fee was entered. Note that unlisted fees are excluded from this calculation.
                  </div>
                )}

                {isHighRate && (
                  <div className="mt-2 pt-2 border-t border-[#F4BB63]/20 text-[11px] text-[#F4BB63]">
                    <strong>High Nominal Rate:</strong> An annual interest rate of {calc.annualRate}% significantly increases total repayment. Total interest exceeds {money(calc.totalInterest)}.
                  </div>
                )}
              </div>

              {/* Agreement Safety Reminders */}
              <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/40 p-3.5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#78F5CF]" />
                  <span>Crucial Points to Verify</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#8E9EB5] leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#78F5CF]">•</span>
                    <span>Confirm whether rate is reducing-balance or flat rate.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#78F5CF]">•</span>
                    <span>Check Key Facts Statement (KFS) for mandatory insurance or GST.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#78F5CF]">•</span>
                    <span>Verify lender registration independently before paying any advance fee.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE & HASH VAULT */}
          {activeTab === "evidence" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Fingerprint size={15} className="text-[#56D9F5]" />
                  <span>Browser-Side Evidence Vault</span>
                </div>
                <p className="text-[11px] text-[#8E9EB5] leading-relaxed">
                  Files are hashed client-side via the Web Crypto SHA-256 API. No bytes are ever transmitted to a server.
                </p>

                {originalFile ? (
                  <div className="mt-2 space-y-2 rounded-lg bg-[#08111F] p-2.5 border border-[#8E9EB5]/15">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#8E9EB5]">Selected File:</span>
                      <span className="font-semibold text-white truncate max-w-[170px]">
                        {originalFile.name}
                      </span>
                    </div>

                    {originalHash && (
                      <div className="space-y-1 pt-1.5 border-t border-[#8E9EB5]/10">
                        <span className="text-[10px] text-[#56D9F5] font-mono uppercase">SHA-256 Hash:</span>
                        <div className="flex items-center justify-between gap-1 rounded bg-[#122238] p-1.5 text-[10px] font-mono text-[#CBD5E1] break-all">
                          <span>{originalHash.slice(0, 16)}…{originalHash.slice(-8)}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(originalHash, "orig-hash")}
                            className="text-[#8E9EB5] hover:text-white shrink-0"
                            title="Copy full hash"
                            aria-label="Copy hash"
                          >
                            {copiedKey === "orig-hash" ? <Check size={12} className="text-[#78F5CF]" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-[#8E9EB5]/25 p-3 text-center text-[11px] text-[#8E9EB5]">
                    No document hashed in this session. Visit the Evidence Vault tool to select a loan agreement.
                  </div>
                )}

                {/* Comparison Result if available */}
                {isMatch && (
                  <div className="rounded-lg bg-[#78F5CF]/10 border border-[#78F5CF]/30 p-2 text-[11px] text-[#78F5CF] flex items-center gap-1.5">
                    <Check size={13} />
                    <span>Byte-level SHA-256 match confirmed.</span>
                  </div>
                )}
                {isMismatch && (
                  <div className="rounded-lg bg-[#F87171]/10 border border-[#F87171]/30 p-2 text-[11px] text-[#F87171] flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    <span>Hash mismatch: File contents differ.</span>
                  </div>
                )}
              </div>

              {/* On-Chain Sepolia Registry Status */}
              <div className="rounded-xl border border-[#39D6C0]/25 bg-[#0D192A] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span className="flex items-center gap-1.5 text-[#39D6C0]">
                    <ShieldCheck size={14} />
                    Sepolia Evidence Registry
                  </span>
                  <span className="rounded bg-[#39D6C0]/15 px-1.5 py-0.5 text-[9px] text-[#39D6C0] font-bold">
                    Deployed
                  </span>
                </div>
                <p className="text-[10px] text-[#8E9EB5] leading-relaxed">
                  Anchors SHA-256 digests immutably on Ethereum Sepolia testnet without exposing document contents.
                </p>
                <div className="rounded bg-[#08111F] p-2 text-[10px] font-mono text-[#56D9F5] flex items-center justify-between">
                  <span>0x8638143982BfddAc9a8c60A49A6d119c5a607aBd</span>
                  <a
                    href="https://sepolia.etherscan.io/address/0x8638143982BfddAc9a8c60A49A6d119c5a607aBd"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8E9EB5] hover:text-white"
                    aria-label="View smart contract on Etherscan"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DEMO WALLET PREVIEW */}
          {activeTab === "wallet" && (
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <Wallet size={15} className="text-[#39D6C0]" />
                    Simulated Ledger
                  </span>
                  <button
                    type="button"
                    onClick={onRefreshBalance}
                    className="text-[#8E9EB5] hover:text-white p-1"
                    title="Refresh balance"
                    aria-label="Refresh balance"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                <div className="text-xl font-bold text-white font-mono tracking-tight mt-1">
                  {walletBalance ? `${walletBalance.balance.toFixed(2)} ${walletBalance.asset}` : "10,000.00 SIM-USDC"}
                </div>
                <div className="text-[10px] text-[#8E9EB5]">
                  Local SQLite off-chain ledger. SIM-USDC has zero monetary value.
                </div>
              </div>

              {/* Active Transaction Preview Card */}
              {activePreparedTx && (
                <div className="rounded-xl border border-[#F4BB63]/40 bg-[#F4BB63]/5 p-3.5 space-y-2">
                  <div className="text-xs font-bold text-[#F4BB63] uppercase tracking-wide">
                    Active Prepared Transfer
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#8E9EB5]">Amount:</span>
                      <span className="font-semibold text-white">
                        {(activePreparedTx.amountCents / 100).toFixed(2)} SIM-USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9EB5]">To:</span>
                      <span className="font-mono text-[#56D9F5]">
                        {activePreparedTx.recipient.slice(0, 10)}…
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9EB5]">Status:</span>
                      <span className="font-semibold text-[#F4BB63]">Awaiting Confirmation</span>
                    </div>
                  </div>
                </div>
              )}

              {lastConfirmedTxId && (
                <div className="rounded-xl border border-[#78F5CF]/30 bg-[#78F5CF]/5 p-3 space-y-1 text-[11px]">
                  <div className="font-bold text-[#78F5CF]">Last Confirmed Record</div>
                  <div className="font-mono text-[10px] text-[#CBD5E1] break-all">
                    txId: {lastConfirmedTxId}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#8E9EB5]/15 p-3 text-[10px] text-[#8E9EB5]/60 text-center">
          Inspection grounded in local calculations & verified parameters.
        </div>
      </aside>
    </>
  );
}
