"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  XCircle,
  Copy,
  Check,
  Cpu,
  Layers,
  Globe,
} from "lucide-react";
import { PreparedTransferInfo, SepoliaTransferParams, BaseSepoliaTransferParams } from "@/types/midnight";

interface TaskReviewCardProps {
  preparedTx?: PreparedTransferInfo | null;
  preparedSepoliaTx?: SepoliaTransferParams | null;
  preparedBaseSepoliaTx?: BaseSepoliaTransferParams | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TaskReviewCard({
  preparedTx,
  preparedSepoliaTx,
  preparedBaseSepoliaTx,
  onConfirm,
  onCancel,
  loading = false,
}: TaskReviewCardProps) {
  const [copied, setCopied] = React.useState(false);

  const recipientToCopy = preparedBaseSepoliaTx?.recipient || preparedSepoliaTx?.recipient || preparedTx?.recipient || "";

  const copyAddress = () => {
    if (!recipientToCopy) return;
    navigator.clipboard.writeText(recipientToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // BASE SEPOLIA REAL TESTNET REVIEW CARD
  // ───────────────────────────────────────────────────────────────────────────
  if (preparedBaseSepoliaTx) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#56D9F5]/35 bg-[#0D192A]/95 p-6 shadow-2xl backdrop-blur-md transition-all">
        {/* Header with Authorization Beacon */}
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#8E9EB5]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#56D9F5]/15 text-[#56D9F5]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#F1F5F9]">
                  Base Sepolia On-Chain Transfer Authorization
                </h2>
                <span className="rounded-full bg-[#56D9F5]/20 px-2 py-0.5 text-[10px] font-semibold text-[#56D9F5]">
                  Awaiting Approval
                </span>
              </div>
              <p className="text-xs text-[#8E9EB5]">
                Review the on-chain transfer parameters before authorizing MetaMask to broadcast to Base Sepolia.
              </p>
            </div>
          </div>
        </div>

        {/* Testnet Disclaimer */}
        <div className="mb-5 rounded-xl border border-[#56D9F5]/30 bg-[#56D9F5]/10 p-3.5 text-xs text-[#56D9F5]">
          <div className="flex items-center gap-2 font-semibold text-[#56D9F5]">
            <AlertTriangle size={15} className="shrink-0 text-[#56D9F5]" />
            <span>Base Sepolia Testnet Notice (Native ETH)</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#8E9EB5]">
            This transfer will be broadcast on Base Sepolia testnet (Chain ID 84532) from your connected MetaMask wallet.
            <strong> Base Sepolia testnet ETH carries NO real-world financial value.</strong>
            Continuing will prompt a signature request in your MetaMask extension.
          </p>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-4">
          {/* Recipient */}
          <div>
            <span className="block text-[11px] font-medium text-[#8E9EB5]">Recipient EVM Address</span>
            <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-[#08111F] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9]">
              <span className="truncate">{preparedBaseSepoliaTx.recipient}</span>
              <button
                type="button"
                onClick={copyAddress}
                className="text-[#8E9EB5] hover:text-[#56D9F5] transition-colors cursor-pointer"
                title="Copy address"
              >
                {copied ? <Check size={14} className="text-[#78F5CF]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-lg bg-[#08111F]/70 p-2.5">
              <span className="block text-[10px] uppercase text-[#8E9EB5]">Amount</span>
              <span className="font-mono text-sm font-semibold text-[#F1F5F9]">
                {preparedBaseSepoliaTx.amount} <span className="text-[10px] text-[#8E9EB5]">ETH</span>
              </span>
            </div>
            <div className="rounded-lg bg-[#08111F]/70 p-2.5">
              <span className="block text-[10px] uppercase text-[#8E9EB5]">Est. Gas</span>
              <span className="font-mono text-sm font-semibold text-[#8E9EB5]">
                {preparedBaseSepoliaTx.estimatedGasEth || "~0.000021"} <span className="text-[10px] text-[#8E9EB5]">ETH</span>
              </span>
            </div>
            <div className="rounded-lg border border-[#56D9F5]/30 bg-[#56D9F5]/10 p-2.5">
              <span className="block text-[10px] uppercase font-semibold text-[#56D9F5]">Currency</span>
              <span className="font-mono text-sm font-bold text-[#56D9F5]">
                Native ETH
              </span>
            </div>
          </div>

          {/* Technical Metadata */}
          <div className="mt-2 space-y-1.5 border-t border-[#8E9EB5]/10 pt-2 text-[11px] text-[#8E9EB5]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe size={12} className="text-[#56D9F5]" />
                <span>Target Network</span>
              </span>
              <span className="font-mono text-[#F1F5F9]">{preparedBaseSepoliaTx.networkName} (Chain ID {preparedBaseSepoliaTx.chainId})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu size={12} className="text-[#56D9F5]" />
                <span>RPC Endpoint</span>
              </span>
              <span className="font-mono text-[10px] text-[#8E9EB5]/90">
                {preparedBaseSepoliaTx.rpcUrl}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers size={12} className="text-[#78F5CF]" />
                <span>Sending Wallet</span>
              </span>
              <span className="font-mono text-[10px] text-[#8E9EB5]/90">
                {preparedBaseSepoliaTx.senderAddress.slice(0, 8)}...{preparedBaseSepoliaTx.senderAddress.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Controls */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#8E9EB5]/15 pt-4">
          <button
            id="cancel-transfer-btn"
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[#8E9EB5]/25 px-4 py-2 text-xs font-medium text-[#8E9EB5] hover:bg-[#122238] hover:text-[#F1F5F9] transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle size={14} />
            <span>Cancel</span>
          </button>

          <button
            id="confirm-base-sepolia-transfer-btn"
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#56D9F5] px-5 py-2 text-xs font-semibold text-[#08111F] shadow-lg shadow-[#56D9F5]/20 hover:bg-[#72e1fa] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Waiting for MetaMask..." : "Continue to MetaMask approval"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SEPOLIA REAL TESTNET REVIEW CARD
  // ───────────────────────────────────────────────────────────────────────────
  if (preparedSepoliaTx) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#39D6C0]/35 bg-[#0D192A]/95 p-6 shadow-2xl backdrop-blur-md transition-all">
        {/* Header with Authorization Beacon */}
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#8E9EB5]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#39D6C0]/15 text-[#39D6C0]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#F1F5F9]">
                  Sepolia On-Chain Transfer Authorization
                </h2>
                <span className="rounded-full bg-[#39D6C0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#39D6C0]">
                  Awaiting Approval
                </span>
              </div>
              <p className="text-xs text-[#8E9EB5]">
                Review the on-chain transfer parameters before authorizing MetaMask to broadcast to Ethereum Sepolia.
              </p>
            </div>
          </div>
        </div>

        {/* Testnet Disclaimer */}
        <div className="mb-5 rounded-xl border border-[#39D6C0]/30 bg-[#39D6C0]/10 p-3.5 text-xs text-[#39D6C0]">
          <div className="flex items-center gap-2 font-semibold text-[#78F5CF]">
            <AlertTriangle size={15} className="shrink-0" />
            <span>Ethereum Sepolia Testnet Notice (Circle USDC)</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#8E9EB5]">
            This transfer will be broadcast on Ethereum Sepolia testnet from your connected MetaMask wallet.
            <strong> Sepolia testnet tokens carry NO real-world financial value.</strong>
            Continuing will prompt a separate signature request in your MetaMask extension.
          </p>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-4">
          {/* Recipient */}
          <div>
            <span className="block text-[11px] font-medium text-[#8E9EB5]">Recipient EVM Address</span>
            <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-[#08111F] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9]">
              <span className="truncate">{preparedSepoliaTx.recipient}</span>
              <button
                type="button"
                onClick={copyAddress}
                className="text-[#8E9EB5] hover:text-[#56D9F5] transition-colors cursor-pointer"
                title="Copy address"
              >
                {copied ? <Check size={14} className="text-[#78F5CF]" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-lg bg-[#08111F]/70 p-2.5">
              <span className="block text-[10px] uppercase text-[#8E9EB5]">Amount</span>
              <span className="font-mono text-sm font-semibold text-[#F1F5F9]">
                {preparedSepoliaTx.amount} <span className="text-[10px] text-[#8E9EB5]">USDC</span>
              </span>
            </div>
            <div className="rounded-lg bg-[#08111F]/70 p-2.5">
              <span className="block text-[10px] uppercase text-[#8E9EB5]">Est. Gas</span>
              <span className="font-mono text-sm font-semibold text-[#8E9EB5]">
                {preparedSepoliaTx.estimatedGasEth || "~0.000035"} <span className="text-[10px] text-[#8E9EB5]">ETH</span>
              </span>
            </div>
            <div className="rounded-lg border border-[#39D6C0]/30 bg-[#39D6C0]/10 p-2.5">
              <span className="block text-[10px] uppercase font-semibold text-[#39D6C0]">Token</span>
              <span className="font-mono text-sm font-bold text-[#78F5CF]">
                Circle USDC
              </span>
            </div>
          </div>

          {/* Technical Metadata */}
          <div className="mt-2 space-y-1.5 border-t border-[#8E9EB5]/10 pt-2 text-[11px] text-[#8E9EB5]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe size={12} className="text-[#56D9F5]" />
                <span>Target Network</span>
              </span>
              <span className="font-mono text-[#F1F5F9]">{preparedSepoliaTx.networkName} (Chain ID {preparedSepoliaTx.chainId})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu size={12} className="text-[#39D6C0]" />
                <span>Token Contract</span>
              </span>
              <span className="font-mono text-[10px] text-[#8E9EB5]/90">
                {preparedSepoliaTx.tokenAddress.slice(0, 10)}...{preparedSepoliaTx.tokenAddress.slice(-8)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers size={12} className="text-[#78F5CF]" />
                <span>Sending Wallet</span>
              </span>
              <span className="font-mono text-[10px] text-[#8E9EB5]/90">
                {preparedSepoliaTx.senderAddress.slice(0, 8)}...{preparedSepoliaTx.senderAddress.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Controls */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#8E9EB5]/15 pt-4">
          <button
            id="cancel-transfer-btn"
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[#8E9EB5]/25 px-4 py-2 text-xs font-medium text-[#8E9EB5] hover:bg-[#122238] hover:text-[#F1F5F9] transition-colors cursor-pointer disabled:opacity-50"
          >
            <XCircle size={14} />
            <span>Cancel</span>
          </button>

          <button
            id="confirm-sepolia-transfer-btn"
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#78F5CF] px-5 py-2 text-xs font-semibold text-[#08111F] shadow-lg shadow-[#78F5CF]/20 hover:bg-[#8bf7d5] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Waiting for MetaMask..." : "Continue to MetaMask approval"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOCAL SQLITE SIMULATION REVIEW CARD (SIM-USDC)
  // ───────────────────────────────────────────────────────────────────────────
  if (!preparedTx) return null;

  const formattedAmount = (preparedTx.amountCents / 100).toFixed(2);
  const formattedFee = (preparedTx.feeCents / 100).toFixed(2);
  const formattedTotal = (preparedTx.totalDebit / 100).toFixed(2);

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#39D6C0]/30 bg-[#0D192A]/95 p-6 shadow-2xl backdrop-blur-md transition-all">
      {/* Header with Authorization Beacon */}
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#8E9EB5]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#39D6C0]/15 text-[#39D6C0]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#F1F5F9]">
                Action Authorization Required
              </h2>
              <span className="rounded-full bg-[#39D6C0]/20 px-2 py-0.5 text-[10px] font-semibold text-[#39D6C0]">
                Awaiting Approval
              </span>
            </div>
            <p className="text-xs text-[#8E9EB5]">
              Review the prepared parameters below before granting explicit execution approval.
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Educational Simulation Notice */}
      <div className="mb-5 rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-3.5 text-xs text-[#F4BB63]">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={15} className="shrink-0" />
          <span>Local Simulated Ledger Notice (SIM-USDC)</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-[#F4BB63]/90">
          This operation will record a transaction in your local in-memory SQLite demo ledger.
          <strong> It does NOT interact with Ethereum mainnet or transfer real on-chain assets.</strong>
        </p>
      </div>

      {/* Transaction Details Card */}
      <div className="space-y-3 rounded-xl border border-[#8E9EB5]/15 bg-[#122238]/60 p-4">
        {/* Recipient */}
        <div>
          <span className="block text-[11px] font-medium text-[#8E9EB5]">Recipient Address</span>
          <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-[#08111F] px-2.5 py-1.5 font-mono text-xs text-[#F1F5F9]">
            <span className="truncate">{preparedTx.recipient}</span>
            <button
              type="button"
              onClick={copyAddress}
              className="text-[#8E9EB5] hover:text-[#56D9F5] transition-colors cursor-pointer"
              title="Copy address"
            >
              {copied ? <Check size={14} className="text-[#78F5CF]" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="rounded-lg bg-[#08111F]/70 p-2.5">
            <span className="block text-[10px] uppercase text-[#8E9EB5]">Amount</span>
            <span className="font-mono text-sm font-semibold text-[#F1F5F9]">
              {formattedAmount} <span className="text-[10px] text-[#8E9EB5]">SIM-USDC</span>
            </span>
          </div>
          <div className="rounded-lg bg-[#08111F]/70 p-2.5">
            <span className="block text-[10px] uppercase text-[#8E9EB5]">Est. Fee</span>
            <span className="font-mono text-sm font-semibold text-[#8E9EB5]">
              {formattedFee} <span className="text-[10px] text-[#8E9EB5]">SIM-USDC</span>
            </span>
          </div>
          <div className="rounded-lg border border-[#39D6C0]/30 bg-[#39D6C0]/10 p-2.5">
            <span className="block text-[10px] uppercase font-semibold text-[#39D6C0]">Total Debit</span>
            <span className="font-mono text-sm font-bold text-[#78F5CF]">
              {formattedTotal} <span className="text-[10px] text-[#39D6C0]">SIM-USDC</span>
            </span>
          </div>
        </div>

        {/* Technical Ledger Metadata */}
        <div className="mt-2 space-y-1.5 border-t border-[#8E9EB5]/10 pt-2 text-[11px] text-[#8E9EB5]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu size={12} className="text-[#56D9F5]" />
              <span>Target Environment</span>
            </span>
            <span className="font-mono text-[#F1F5F9]">Local SQLite Ledger</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers size={12} className="text-[#39D6C0]" />
              <span>Idempotency Key</span>
            </span>
            <span className="font-mono text-[10px] text-[#8E9EB5]/80">
              {preparedTx.idempotencyKey.slice(0, 16)}...
            </span>
          </div>
        </div>
      </div>

      {/* Authorization CTA Controls */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#8E9EB5]/15 pt-4">
        <button
          id="cancel-task-btn"
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-[#8E9EB5]/25 px-4 py-2 text-xs font-medium text-[#8E9EB5] hover:bg-[#122238] hover:text-[#F1F5F9] transition-colors cursor-pointer disabled:opacity-50"
        >
          <XCircle size={14} />
          <span>Reject / Cancel</span>
        </button>

        <button
          id="confirm-transfer-btn"
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-[#78F5CF] px-5 py-2 text-xs font-semibold text-[#08111F] shadow-lg shadow-[#78F5CF]/20 hover:bg-[#8bf7d5] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>Authorize Simulated Transfer</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
