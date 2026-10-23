"use client";

import React, { useState, useEffect } from "react";
import {
  Calculator,
  Scale,
  PieChart,
  Coins,
  ShieldAlert,
  Wallet,
  ArrowLeft,
  Play,
  Info,
  AlertCircle,
  ClipboardCheck,
  Check,
} from "lucide-react";
import { TaskType } from "@/types/midnight";
import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NETWORK_NAME,
  MAX_SEPOLIA_TRANSFER_USDC,
  MAX_SEPOLIA_TRANSFER_USDC_STR,
  SUPPORTED_TOKENS,
  validateTransferParameters,
} from "@/lib/sepolia-config";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_NETWORK_NAME,
  BASE_SEPOLIA_RPC_URL,
  MAX_BASE_SEPOLIA_TRANSFER_ETH,
  MAX_BASE_SEPOLIA_TRANSFER_ETH_STR,
  validateBaseSepoliaTransferParameters,
} from "@/lib/base-sepolia-config";
import { parseTransferIntent } from "@/lib/transfer-intent";
import {
  isMetaMaskAvailable,
  connectMetaMask,
  switchNetworkToSepolia,
  switchNetworkToBaseSepolia,
  readSepoliaAccountState,
  readBaseSepoliaAccountState,
  estimateSepoliaTransferGas,
  estimateBaseSepoliaTransferGas,
} from "@/lib/metamask";

interface TaskInputCardProps {
  taskType: TaskType;
  initialPrompt?: string;
  onCancel: () => void;
  onSubmit: (params: Record<string, unknown>) => void;
  loading?: boolean;
}

export function TaskInputCard({
  taskType,
  initialPrompt,
  onCancel,
  onSubmit,
  loading = false,
}: TaskInputCardProps) {
  // Form state for Loan Cost
  const [loanPrincipal, setLoanPrincipal] = useState("500000");
  const [loanRate, setLoanRate] = useState("13.5");
  const [loanMonths, setLoanMonths] = useState("36");
  const [loanFee, setLoanFee] = useState("5000");

  // Form state for Compare Offers
  const [cmpPrincipal, setCmpPrincipal] = useState("500000");
  const [cmpMonths, setCmpMonths] = useState("36");
  const [cmpRateA, setCmpRateA] = useState("12.0");
  const [cmpFeeA, setCmpFeeA] = useState("7500");
  const [cmpRateB, setCmpRateB] = useState("13.2");
  const [cmpFeeB, setCmpFeeB] = useState("0");

  // Form state for Affordability
  const [affIncome, setAffIncome] = useState("85000");
  const [affExpenses, setAffExpenses] = useState("35000");
  const [affExistingEmis, setAffExistingEmis] = useState("10000");
  const [affNewEmi, setAffNewEmi] = useState("15000");

  // Form state for Crypto Risk
  const [cryptoQty, setCryptoQty] = useState("2");
  const [cryptoPrice, setCryptoPrice] = useState("3000");
  const [cryptoLoan, setCryptoLoan] = useState("3500");
  const [cryptoThreshold, setCryptoThreshold] = useState("80");

  // Form state for Red Flags
  const [redFlagText, setRedFlagText] = useState(
    initialPrompt ||
      "Congratulations! Your ₹3,00,000 personal loan is 100% guaranteed approval regardless of eligibility. Please pay ₹4,500 advance processing fee first to unlock disbursement. You must sign immediately today or the offer expires."
  );

  // Form state for Document Review
  const defaultDocClauses = [
    "Interest rate and APR are clearly stated",
    "Processing fees and other charges are disclosed",
    "EMI amount and repayment dates are specified",
    "Late-payment penalties are explained",
    "Prepayment or foreclosure charges are disclosed",
    "The lender's legal name and contact details are provided",
    "Default, collection and collateral terms are understandable",
    "You can keep a copy of the final loan agreement",
  ];
  const [docCheckedClauses, setDocCheckedClauses] = useState<string[]>(defaultDocClauses);
  const [docExcerpt, setDocExcerpt] = useState("");

  // Form state for Wallet Transfer
  const [transferMode, setTransferMode] = useState<"base_sepolia" | "sepolia" | "simulated">("base_sepolia");
  const [walletRecipient, setWalletRecipient] = useState(
    "0x71C8360f78B35b36489aBE3C4B821b0C863d690a"
  );
  const [walletAmount, setWalletAmount] = useState("0.001");
  const [walletNote, setWalletNote] = useState("Safety reserve buffer");
  const [naturalTransferText, setNaturalTransferText] = useState(initialPrompt || "");

  // MetaMask & On-Chain State
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isSepoliaNetwork, setIsSepoliaNetwork] = useState(false);
  const [isBaseSepoliaNetwork, setIsBaseSepoliaNetwork] = useState(false);
  const [ethGasBalance, setEthGasBalance] = useState("0.00");
  const [baseEthBalance, setBaseEthBalance] = useState("0.00");
  const [usdcTokenBalance, setUsdcTokenBalance] = useState("0.00");
  const [estimatedGas, setEstimatedGas] = useState("~0.000021");
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  useEffect(() => {
    setMetaMaskAvailable(isMetaMaskAvailable());
  }, []);

  const handleConnectWallet = async () => {
    try {
      setIsWalletConnecting(true);
      setValidationError(null);
      const { address, chainId } = await connectMetaMask();
      setConnectedAddress(address);
      setCurrentChainId(chainId);
      const isSep = chainId === SEPOLIA_CHAIN_ID;
      const isBase = chainId === BASE_SEPOLIA_CHAIN_ID;
      setIsSepoliaNetwork(isSep);
      setIsBaseSepoliaNetwork(isBase);

      if (isBase) {
        const state = await readBaseSepoliaAccountState(address);
        setBaseEthBalance(state.ethBalance);
        const estGas = await estimateBaseSepoliaTransferGas(walletRecipient, walletAmount || "0.001");
        setEstimatedGas(estGas);
      } else if (isSep) {
        const state = await readSepoliaAccountState(address);
        setEthGasBalance(state.ethBalance);
        setUsdcTokenBalance(state.tokenBalance);
        const estGas = await estimateSepoliaTransferGas(walletRecipient, walletAmount || "0.01");
        setEstimatedGas(estGas);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect MetaMask.";
      setValidationError(msg);
    } finally {
      setIsWalletConnecting(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      setIsNetworkSwitching(true);
      setValidationError(null);

      if (transferMode === "base_sepolia") {
        await switchNetworkToBaseSepolia();
        setCurrentChainId(BASE_SEPOLIA_CHAIN_ID);
        setIsBaseSepoliaNetwork(true);
        setIsSepoliaNetwork(false);
        if (connectedAddress) {
          const state = await readBaseSepoliaAccountState(connectedAddress);
          setBaseEthBalance(state.ethBalance);
          const estGas = await estimateBaseSepoliaTransferGas(walletRecipient, walletAmount || "0.001");
          setEstimatedGas(estGas);
        }
      } else {
        await switchNetworkToSepolia();
        setCurrentChainId(SEPOLIA_CHAIN_ID);
        setIsSepoliaNetwork(true);
        setIsBaseSepoliaNetwork(false);
        if (connectedAddress) {
          const state = await readSepoliaAccountState(connectedAddress);
          setEthGasBalance(state.ethBalance);
          setUsdcTokenBalance(state.tokenBalance);
          const estGas = await estimateSepoliaTransferGas(walletRecipient, walletAmount || "0.01");
          setEstimatedGas(estGas);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to switch network.";
      setValidationError(msg);
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  const handleDisconnectWallet = () => {
    setConnectedAddress(null);
    setCurrentChainId(null);
    setIsSepoliaNetwork(false);
    setIsBaseSepoliaNetwork(false);
    setEthGasBalance("0.00");
    setBaseEthBalance("0.00");
    setUsdcTokenBalance("0.00");
  };

  const handleNaturalTransferChange = (text: string) => {
    setNaturalTransferText(text);
    if (!text.trim()) return;

    const parsed = parseTransferIntent(
      text,
      connectedAddress || undefined,
      transferMode === "base_sepolia" ? "base-sepolia" : "sepolia"
    );
    if (parsed.ok && parsed.intent) {
      setWalletRecipient(parsed.intent.recipient);
      setWalletAmount(parsed.intent.amount);
      setValidationError(null);
      if (parsed.intent.chainId === BASE_SEPOLIA_CHAIN_ID && transferMode !== "base_sepolia") {
        setTransferMode("base_sepolia");
      } else if (parsed.intent.chainId === SEPOLIA_CHAIN_ID && transferMode !== "sepolia") {
        setTransferMode("sepolia");
      }
    } else {
      const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
      if (addressMatch) setWalletRecipient(addressMatch[0]);
      if (parsed.error && (parsed.error.includes("exceeds") || parsed.error.includes("Unsupported"))) {
        setValidationError(parsed.error);
      }
    }
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    switch (taskType) {
      case "loan_cost": {
        const principal = parseFloat(loanPrincipal);
        const rate = parseFloat(loanRate);
        const parsedMonths = parseFloat(loanMonths);
        const months = Math.round(parsedMonths);
        const fee = loanFee.trim() ? parseFloat(loanFee) : 0;

        if (isNaN(principal) || principal <= 0) {
          setValidationError("Principal must be a positive number.");
          return;
        }
        if (isNaN(rate) || rate < 0) {
          setValidationError("Interest rate must be a non-negative number.");
          return;
        }
        if (isNaN(months) || months <= 0) {
          setValidationError("Tenure must be at least 1 month.");
          return;
        }
        onSubmit({ principal, annualRatePercent: rate, months, upfrontFee: fee });
        break;
      }

      case "compare_offers": {
        const principal = parseFloat(cmpPrincipal);
        const months = parseInt(cmpMonths, 10);
        const rateA = parseFloat(cmpRateA);
        const feeA = cmpFeeA.trim() ? parseFloat(cmpFeeA) : 0;
        const rateB = parseFloat(cmpRateB);
        const feeB = cmpFeeB.trim() ? parseFloat(cmpFeeB) : 0;

        if (isNaN(principal) || principal <= 0 || isNaN(months) || months <= 0) {
          setValidationError("Principal and tenure must be positive numbers.");
          return;
        }
        if (isNaN(rateA) || rateA < 0 || isNaN(rateB) || rateB < 0) {
          setValidationError("Rates must be non-negative.");
          return;
        }
        onSubmit({
          principal,
          tenureMonths: months,
          offerAAnnualInterestRatePercent: rateA,
          offerAUpfrontFees: feeA,
          offerBAnnualInterestRatePercent: rateB,
          offerBUpfrontFees: feeB,
        });
        break;
      }

      case "affordability": {
        const income = parseFloat(affIncome);
        const expenses = parseFloat(affExpenses);
        const existing = parseFloat(affExistingEmis);
        const newEmi = parseFloat(affNewEmi);

        if (isNaN(income) || income <= 0) {
          setValidationError("Monthly income must be greater than zero.");
          return;
        }
        if (isNaN(expenses) || expenses < 0 || isNaN(existing) || existing < 0 || isNaN(newEmi) || newEmi < 0) {
          setValidationError("Expenses and EMIs must be non-negative.");
          return;
        }
        onSubmit({
          monthlyTakeHomeIncome: income,
          monthlyEssentialExpenses: expenses,
          existingMonthlyEmis: existing,
          newLoanEmi: newEmi,
        });
        break;
      }

      case "crypto_risk": {
        const qty = parseFloat(cryptoQty);
        const price = parseFloat(cryptoPrice);
        const loan = parseFloat(cryptoLoan);
        const threshold = parseFloat(cryptoThreshold);

        if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0 || isNaN(loan) || loan <= 0) {
          setValidationError("Quantity, price, and loan amount must be positive.");
          return;
        }
        if (isNaN(threshold) || threshold <= 0 || threshold > 100) {
          setValidationError("Liquidation threshold must be between 1% and 100%.");
          return;
        }
        onSubmit({
          collateralQuantity: qty,
          collateralPriceUsd: price,
          loanAmountUsdc: loan,
          liquidationThresholdPercent: threshold,
        });
        break;
      }

      case "red_flags": {
        if (!redFlagText.trim()) {
          setValidationError("Please paste or type the loan text or message to analyze.");
          return;
        }
        onSubmit({
          text: redFlagText.trim(),
        });
        break;
      }

      case "doc_review": {
        if (docCheckedClauses.length === 0 && !docExcerpt.trim()) {
          setValidationError("Please select at least one verified clause or provide agreement text.");
          return;
        }
        onSubmit({
          checkedClauses: docCheckedClauses,
          documentExcerpt: docExcerpt.trim(),
        });
        break;
      }

      case "wallet_transfer": {
        const recipient = walletRecipient.trim();
        const amount = walletAmount.trim();

        if (transferMode === "base_sepolia") {
          if (!connectedAddress) {
            setValidationError("Please connect your Base Sepolia MetaMask wallet before submitting a transfer.");
            return;
          }

          if (!isBaseSepoliaNetwork) {
            setValidationError(`MetaMask is currently on Chain ID ${currentChainId}. You must switch to Base Sepolia (${BASE_SEPOLIA_CHAIN_ID}).`);
            return;
          }

          const numAmount = parseFloat(amount);
          if (isNaN(numAmount) || numAmount <= 0) {
            setValidationError("Transfer amount must be a valid number greater than zero.");
            return;
          }

          if (numAmount > MAX_BASE_SEPOLIA_TRANSFER_ETH) {
            setValidationError(
              `Transfer amount (${amount} ETH) exceeds the safety maximum of ${MAX_BASE_SEPOLIA_TRANSFER_ETH_STR} ETH on Base Sepolia.`
            );
            return;
          }

          const validation = validateBaseSepoliaTransferParameters({
            recipient,
            amount,
            chainId: currentChainId || BASE_SEPOLIA_CHAIN_ID,
            ethBalance: baseEthBalance !== "0.00" ? baseEthBalance : undefined,
          });

          if (!validation.isValid) {
            setValidationError(validation.error || "Invalid transfer parameters.");
            return;
          }

          onSubmit({
            transferMode: "base_sepolia",
            recipient: validation.normalizedRecipient,
            amount,
            tokenSymbol: "ETH",
            senderAddress: connectedAddress,
            chainId: BASE_SEPOLIA_CHAIN_ID,
            networkName: BASE_SEPOLIA_NETWORK_NAME,
            rpcUrl: BASE_SEPOLIA_RPC_URL,
            estimatedGasEth: estimatedGas,
            rawPrompt: naturalTransferText.trim() || undefined,
          });
          break;
        }

        if (transferMode === "sepolia") {
          if (!connectedAddress) {
            setValidationError("Please connect your MetaMask wallet before submitting a Sepolia transfer.");
            return;
          }

          if (!isSepoliaNetwork) {
            setValidationError(`MetaMask is currently on Chain ID ${currentChainId}. You must switch to Ethereum Sepolia (11155111).`);
            return;
          }

          const numAmount = parseFloat(amount);
          if (isNaN(numAmount) || numAmount <= 0) {
            setValidationError("Transfer amount must be a valid number greater than zero.");
            return;
          }

          if (numAmount > MAX_SEPOLIA_TRANSFER_USDC) {
            setValidationError(
              `Transfer amount (${amount} USDC) exceeds the strict safety maximum of ${MAX_SEPOLIA_TRANSFER_USDC_STR} USDC. Amounts above 0.01 USDC are prohibited.`
            );
            return;
          }

          const validation = validateTransferParameters({
            recipient,
            amount,
            tokenSymbol: "USDC",
            chainId: currentChainId || SEPOLIA_CHAIN_ID,
            tokenBalance: usdcTokenBalance !== "0.00" ? usdcTokenBalance : undefined,
            ethBalance: ethGasBalance !== "0.00" ? ethGasBalance : undefined,
          });

          if (!validation.isValid) {
            setValidationError(validation.error || "Invalid transfer parameters.");
            return;
          }

          onSubmit({
            transferMode: "sepolia",
            recipient: validation.normalizedRecipient,
            amount,
            tokenSymbol: "USDC",
            tokenAddress: SUPPORTED_TOKENS.USDC.contractAddress,
            tokenDecimals: SUPPORTED_TOKENS.USDC.expectedDecimals,
            senderAddress: connectedAddress,
            chainId: SEPOLIA_CHAIN_ID,
            networkName: SEPOLIA_NETWORK_NAME,
            estimatedGasEth: estimatedGas,
            rawPrompt: naturalTransferText.trim() || undefined,
          });
          break;
        }

        // Simulated local SQLite transfer mode
        const simAmount = parseFloat(amount);
        if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
          setValidationError("Recipient must be a valid 42-character Ethereum/EVM hex address (0x...).");
          return;
        }
        if (isNaN(simAmount) || simAmount <= 0) {
          setValidationError("Amount must be a positive number.");
          return;
        }

        onSubmit({
          transferMode: "simulated",
          recipient,
          amount: simAmount,
          note: walletNote.trim(),
        });
        break;
      }
    }
  };

  const getTaskHeader = () => {
    switch (taskType) {
      case "loan_cost":
        return {
          title: "Loan Cost & Amortization Parameters",
          icon: Calculator,
          color: "text-[#56D9F5]",
          desc: "Provide nominal loan figures to calculate reducing-balance EMI and true interest outflow.",
        };
      case "compare_offers":
        return {
          title: "Compare Two Loan Offers",
          icon: Scale,
          color: "text-[#39D6C0]",
          desc: "Side-by-side comparison under identical principal and tenure with fee accounting.",
        };
      case "affordability":
        return {
          title: "Cash-Flow & Repayment Stress Test",
          icon: PieChart,
          color: "text-[#78F5CF]",
          desc: "Evaluate proposed EMI against monthly take-home income and nondiscretionary commitments.",
        };
      case "crypto_risk":
        return {
          title: "Crypto Collateral Risk Modeling",
          icon: Coins,
          color: "text-[#56D9F5]",
          desc: "Simulate liquidation thresholds and stress-test collateral price-drop shocks.",
        };
      case "red_flags":
        return {
          title: "Screen Agreement for Predatory Red Flags",
          icon: ShieldAlert,
          color: "text-[#F4BB63]",
          desc: "Verifies advance fee traps, secrecy demands, and pressure tactics against verbatim evidence.",
        };
      case "doc_review":
        return {
          title: "Loan Agreement Document Review",
          icon: ClipboardCheck,
          color: "text-[#78F5CF]",
          desc: "Verify mandatory terms and disclosure clarity before signing any loan agreement.",
        };
      case "wallet_transfer":
        return {
          title: "Simulated Wallet Transfer Preparation",
          icon: Wallet,
          color: "text-[#39D6C0]",
          desc: "Prepare a simulated SIM-USDC transaction on the local ledger. Requires explicit review.",
        };
      default:
        return {
          title: "Task Parameters",
          icon: Info,
          color: "text-[#56D9F5]",
          desc: "Complete the required fields for execution.",
        };
    }
  };

  const header = getTaskHeader();
  const HeaderIcon = header.icon;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#8E9EB5]/25 bg-[#0D192A]/90 p-6 shadow-2xl backdrop-blur-md transition-all">
      {/* Top Bar with Back and Header */}
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#8E9EB5]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#122238] ${header.color}`}>
            <HeaderIcon size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#F1F5F9]">{header.title}</h2>
            <p className="text-xs text-[#8E9EB5]">{header.desc}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-[#8E9EB5] hover:bg-[#122238] hover:text-[#F1F5F9] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      </div>

      {validationError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#F4BB63]/40 bg-[#F4BB63]/10 px-3 py-2 text-xs text-[#F4BB63]">
          <AlertCircle size={14} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        {/* Loan Cost Form */}
        {taskType === "loan_cost" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Loan Principal (₹)
              </label>
              <input
                type="number"
                step="any"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(e.target.value)}
                placeholder="500000"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                step="any"
                value={loanRate}
                onChange={(e) => setLoanRate(e.target.value)}
                placeholder="13.5"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Repayment Tenure (Months)
              </label>
              <input
                type="number"
                step="any"
                value={loanMonths}
                onChange={(e) => setLoanMonths(e.target.value)}
                placeholder="36"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Known Upfront Processing Fee (₹)
              </label>
              <input
                type="number"
                step="any"
                value={loanFee}
                onChange={(e) => setLoanFee(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Compare Offers Form */}
        {taskType === "compare_offers" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                  Common Principal (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={cmpPrincipal}
                  onChange={(e) => setCmpPrincipal(e.target.value)}
                  className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                  Common Tenure (Months)
                </label>
                <input
                  type="number"
                  step="any"
                  value={cmpMonths}
                  onChange={(e) => setCmpMonths(e.target.value)}
                  className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-[#8E9EB5]/15 pt-3">
              {/* Offer A */}
              <div className="space-y-2.5 rounded-xl border border-[#56D9F5]/25 bg-[#122238]/50 p-3.5">
                <span className="text-xs font-bold text-[#56D9F5] uppercase tracking-wider block">
                  Offer A Terms
                </span>
                <div>
                  <label className="block text-[10px] text-[#8E9EB5] mb-1">Annual Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cmpRateA}
                    onChange={(e) => setCmpRateA(e.target.value)}
                    className="w-full rounded-lg border border-[#8E9EB5]/20 bg-[#08111F] px-2.5 py-1.5 text-xs text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8E9EB5] mb-1">Upfront Fee (₹)</label>
                  <input
                    type="number"
                    value={cmpFeeA}
                    onChange={(e) => setCmpFeeA(e.target.value)}
                    className="w-full rounded-lg border border-[#8E9EB5]/20 bg-[#08111F] px-2.5 py-1.5 text-xs text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
                  />
                </div>
              </div>

              {/* Offer B */}
              <div className="space-y-2.5 rounded-xl border border-[#39D6C0]/25 bg-[#122238]/50 p-3.5">
                <span className="text-xs font-bold text-[#39D6C0] uppercase tracking-wider block">
                  Offer B Terms
                </span>
                <div>
                  <label className="block text-[10px] text-[#8E9EB5] mb-1">Annual Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cmpRateB}
                    onChange={(e) => setCmpRateB(e.target.value)}
                    className="w-full rounded-lg border border-[#8E9EB5]/20 bg-[#08111F] px-2.5 py-1.5 text-xs text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8E9EB5] mb-1">Upfront Fee (₹)</label>
                  <input
                    type="number"
                    value={cmpFeeB}
                    onChange={(e) => setCmpFeeB(e.target.value)}
                    className="w-full rounded-lg border border-[#8E9EB5]/20 bg-[#08111F] px-2.5 py-1.5 text-xs text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Affordability Form */}
        {taskType === "affordability" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Monthly Take-Home Income (₹)
              </label>
              <input
                type="number"
                value={affIncome}
                onChange={(e) => setAffIncome(e.target.value)}
                placeholder="85000"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#78F5CF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Essential Living Expenses (₹)
              </label>
              <input
                type="number"
                value={affExpenses}
                onChange={(e) => setAffExpenses(e.target.value)}
                placeholder="35000"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#78F5CF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Existing Monthly Debt EMIs (₹)
              </label>
              <input
                type="number"
                value={affExistingEmis}
                onChange={(e) => setAffExistingEmis(e.target.value)}
                placeholder="10000"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#78F5CF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Proposed New Loan EMI (₹)
              </label>
              <input
                type="number"
                value={affNewEmi}
                onChange={(e) => setAffNewEmi(e.target.value)}
                placeholder="15000"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#78F5CF] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Crypto Risk Form */}
        {taskType === "crypto_risk" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Collateral Quantity (e.g. ETH)
              </label>
              <input
                type="number"
                step="0.01"
                value={cryptoQty}
                onChange={(e) => setCryptoQty(e.target.value)}
                placeholder="2.0"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Current Collateral Price (USD)
              </label>
              <input
                type="number"
                value={cryptoPrice}
                onChange={(e) => setCryptoPrice(e.target.value)}
                placeholder="3000"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Borrowed / Loan Amount (USDC)
              </label>
              <input
                type="number"
                value={cryptoLoan}
                onChange={(e) => setCryptoLoan(e.target.value)}
                placeholder="3500"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Protocol Liquidation Threshold (%)
              </label>
              <input
                type="number"
                value={cryptoThreshold}
                onChange={(e) => setCryptoThreshold(e.target.value)}
                placeholder="80"
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Red Flags Form */}
        {taskType === "red_flags" && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Loan Offer Text, Message, or Agreement Excerpt:
              </label>
              <textarea
                rows={4}
                value={redFlagText}
                onChange={(e) => setRedFlagText(e.target.value)}
                placeholder="Paste lender messages, WhatsApp quotes, or agreement clauses here..."
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 p-3 text-xs text-[#F1F5F9] focus:border-[#F4BB63] focus:outline-none leading-relaxed"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[#8E9EB5]/70 mr-1">Load sample:</span>
              <button
                type="button"
                onClick={() =>
                  setRedFlagText(
                    "Your ₹2,50,000 loan is guaranteed approval. Pay ₹3,500 advance fee now and share your OTP."
                  )
                }
                className="rounded-md border border-[#F4BB63]/30 bg-[#122238] px-2 py-0.5 text-[10px] text-[#F4BB63] hover:bg-[#F4BB63]/10 cursor-pointer"
              >
                Advance Fee + OTP
              </button>
              <button
                type="button"
                onClick={() =>
                  setRedFlagText(
                    "You must sign the agreement immediately today without reading or the rate increases. Fees are not disclosed."
                  )
                }
                className="rounded-md border border-[#F4BB63]/30 bg-[#122238] px-2 py-0.5 text-[10px] text-[#F4BB63] hover:bg-[#F4BB63]/10 cursor-pointer"
              >
                Pressure to Sign + Hidden Fees
              </button>
              <button
                type="button"
                onClick={() =>
                  setRedFlagText(
                    "Lender registration is clear. Interest rate is 11.5% with itemized processing fee of ₹2,000. 30 days cooling off period."
                  )
                }
                className="rounded-md border border-[#39D6C0]/30 bg-[#122238] px-2 py-0.5 text-[10px] text-[#39D6C0] hover:bg-[#39D6C0]/10 cursor-pointer"
              >
                Transparent Offer
              </button>
            </div>
          </div>
        )}

        {/* Document Review Form */}
        {taskType === "doc_review" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#78F5CF]/20 bg-[#78F5CF]/5 p-3.5 text-xs text-[#F1F5F9]/90">
              <span className="font-semibold block mb-1 text-[#78F5CF]">Pre-Signing Disclosure Checklist</span>
              <p className="text-[11px] text-[#8E9EB5]">
                Review the lender&apos;s physical or digital draft agreement against these 8 critical consumer protection provisions. Mark each clause once confirmed.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-medium text-[#8E9EB5]">
                Essential Terms Disclosed in Agreement:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {defaultDocClauses.map((clause) => {
                  const isChecked = docCheckedClauses.includes(clause);
                  return (
                    <label
                      key={clause}
                      className={`flex items-center gap-3 rounded-xl border p-2.5 text-xs transition-all cursor-pointer ${
                        isChecked
                          ? "border-[#78F5CF]/40 bg-[#122238]/90 text-[#F1F5F9]"
                          : "border-[#8E9EB5]/15 bg-[#0D192A]/50 text-[#8E9EB5] hover:border-[#8E9EB5]/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDocCheckedClauses((prev) => [...prev, clause]);
                          } else {
                            setDocCheckedClauses((prev) => prev.filter((c) => c !== clause));
                          }
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isChecked
                            ? "border-[#78F5CF] bg-[#78F5CF] text-[#08111F]"
                            : "border-[#8E9EB5]/40 bg-transparent"
                        }`}
                      >
                        {isChecked && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span className="flex-1">{clause}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                Agreement Excerpt or Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={docExcerpt}
                onChange={(e) => setDocExcerpt(e.target.value)}
                placeholder="Paste specific clauses or excerpt for predatory clause screening..."
                className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 p-3 text-xs text-[#F1F5F9] focus:border-[#78F5CF] focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Wallet Transfer Form */}
        {taskType === "wallet_transfer" && (
          <div className="space-y-4">
            {/* Mode Selector Toggle */}
            <div className="flex rounded-xl bg-[#08111F] p-1 border border-[#8E9EB5]/20 gap-1">
              <button
                id="mode-base-sepolia-btn"
                type="button"
                onClick={() => {
                  setTransferMode("base_sepolia");
                  setValidationError(null);
                  if (walletAmount === "0.01") setWalletAmount("0.001");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  transferMode === "base_sepolia"
                    ? "bg-[#56D9F5] text-[#08111F] shadow-md shadow-[#56D9F5]/20"
                    : "text-[#8E9EB5] hover:text-[#F1F5F9]"
                }`}
              >
                <span>Base Sepolia (ETH)</span>
                <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                  transferMode === "base_sepolia" ? "bg-[#08111F]/25 text-[#08111F]" : "bg-[#56D9F5]/15 text-[#56D9F5]"
                }`}>
                  WEEK 3
                </span>
              </button>

              <button
                id="mode-sepolia-btn"
                type="button"
                onClick={() => {
                  setTransferMode("sepolia");
                  setValidationError(null);
                  if (walletAmount === "0.001") setWalletAmount("0.01");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  transferMode === "sepolia"
                    ? "bg-[#39D6C0] text-[#08111F] shadow-md shadow-[#39D6C0]/20"
                    : "text-[#8E9EB5] hover:text-[#F1F5F9]"
                }`}
              >
                <span>Sepolia (USDC)</span>
                <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                  transferMode === "sepolia" ? "bg-[#08111F]/25 text-[#08111F]" : "bg-[#39D6C0]/15 text-[#39D6C0]"
                }`}>
                  WEEK 2
                </span>
              </button>

              <button
                id="mode-simulated-btn"
                type="button"
                onClick={() => {
                  setTransferMode("simulated");
                  setValidationError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  transferMode === "simulated"
                    ? "bg-[#F4BB63] text-[#08111F] shadow-md shadow-[#F4BB63]/20"
                    : "text-[#8E9EB5] hover:text-[#F1F5F9]"
                }`}
              >
                <span>Simulated (SIM-USDC)</span>
                <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                  transferMode === "simulated" ? "bg-[#08111F]/25 text-[#08111F]" : "bg-[#F4BB63]/15 text-[#F4BB63]"
                }`}>
                  SQLITE
                </span>
              </button>
            </div>

            {/* BASE SEPOLIA REAL TESTNET MODE */}
            {transferMode === "base_sepolia" && (
              <div className="space-y-3.5">
                {/* Network & Safety Info */}
                <div className="rounded-xl border border-[#56D9F5]/25 bg-[#56D9F5]/5 p-3 text-xs text-[#56D9F5]/90">
                  <div className="flex items-center gap-1.5 font-semibold text-[#56D9F5] mb-1">
                    <Info size={14} />
                    <span>Base Sepolia Testnet Transfer (Native ETH)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#8E9EB5]">
                    Initiates an on-chain native ETH transfer on Base Sepolia testnet (
                    <code className="text-[#56D9F5] font-mono">Chain ID: 84532</code>, RPC:{" "}
                    <code className="text-[#56D9F5] font-mono">https://sepolia.base.org</code>). Explorer:{" "}
                    <a href="https://sepolia.basescan.org" target="_blank" rel="noopener noreferrer" className="text-[#56D9F5] underline">
                      sepolia.basescan.org
                    </a>. Testnet ETH carries no real financial value.
                  </p>
                </div>

                {/* MetaMask Connection & Base Sepolia Balances */}
                {!metaMaskAvailable ? (
                  <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-3 text-xs text-[#F4BB63]">
                    <span className="font-semibold block mb-0.5">MetaMask Not Detected</span>
                    Please install or activate the MetaMask browser extension to read balances and authorize Base Sepolia testnet transfers.
                  </div>
                ) : !connectedAddress ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#56D9F5]/30 bg-[#122238]/80 p-3">
                    <div>
                      <span className="block text-xs font-semibold text-[#F1F5F9]">MetaMask Wallet Disconnected</span>
                      <span className="block text-[11px] text-[#8E9EB5]">Connect your wallet to read balances and authorize Base Sepolia transfers.</span>
                    </div>
                    <button
                      id="connect-base-sepolia-wallet-btn"
                      type="button"
                      onClick={() => void handleConnectWallet()}
                      disabled={isWalletConnecting}
                      className="rounded-lg bg-[#56D9F5] px-3.5 py-1.5 text-xs font-semibold text-[#08111F] hover:bg-[#72e1fa] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isWalletConnecting ? "Connecting..." : "Connect Base Sepolia Wallet"}
                    </button>
                  </div>
                ) : !isBaseSepoliaNetwork ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3">
                    <div>
                      <span className="block text-xs font-semibold text-[#FCA5A5]">
                        Wrong Network (Chain ID: {currentChainId})
                      </span>
                      <span className="block text-[11px] text-[#8E9EB5]">
                        Transfers in this tab are restricted to Base Sepolia (84532).
                      </span>
                    </div>
                    <button
                      id="switch-to-base-sepolia-btn"
                      type="button"
                      onClick={handleSwitchNetwork}
                      disabled={isNetworkSwitching}
                      className="rounded-lg bg-[#EF4444] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#dc2626] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isNetworkSwitching ? "Switching..." : "Switch to Base Sepolia"}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#56D9F5]/30 bg-[#122238]/80 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-[#8E9EB5]/15 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#56D9F5] animate-pulse" />
                        <span className="font-mono text-xs font-semibold text-[#F1F5F9]">
                          {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                        </span>
                        <span className="rounded bg-[#56D9F5]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#56D9F5]">
                          Base Sepolia Verified
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnectWallet}
                        className="text-[10px] text-[#8E9EB5] hover:text-[#EF4444] transition-colors cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-lg bg-[#08111F]/70 p-2 text-center col-span-2">
                        <span className="block text-[10px] text-[#8E9EB5]">Base Sepolia Native Balance</span>
                        <span className="font-mono text-sm font-bold text-[#56D9F5]">{baseEthBalance} ETH</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Natural Language Request */}
                <div>
                  <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                    Natural language transfer request (Auto-extracts parameters)
                  </label>
                  <input
                    type="text"
                    value={naturalTransferText}
                    onChange={(e) => handleNaturalTransferChange(e.target.value)}
                    placeholder="e.g. 'Send 0.001 ETH to 0x71C8360f78B35b36489aBE3C4B821b0C863d690a on Base Sepolia'"
                    className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-xs text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[#8E9EB5]/60">
                    Interpreted values are validated against Base Sepolia parameters and safety limits.
                  </p>
                </div>

                {/* Recipient Address */}
                <div>
                  <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                    Recipient Address (Ethereum EVM Hex 0x...)
                  </label>
                  <input
                    type="text"
                    value={walletRecipient}
                    onChange={(e) => setWalletRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full font-mono rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-xs text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
                  />
                </div>

                {/* Token & Amount Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                      Currency (Native)
                    </label>
                    <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#08111F]/60 px-3 py-2 text-xs text-[#F1F5F9] flex items-center justify-between">
                      <span className="font-semibold text-[#56D9F5]">Native ETH</span>
                      <span className="text-[10px] text-[#8E9EB5] font-mono">18 Decimals</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-[#8E9EB5]">
                        Amount (ETH)
                      </label>
                      <span className="text-[10px] text-[#F4BB63] font-mono font-semibold">
                        Strict Max: 0.05 ETH
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.000000000000000001"
                      max="0.05"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder="0.001"
                      className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#56D9F5] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Balance alerts */}
                {connectedAddress && isBaseSepoliaNetwork && parseFloat(walletAmount) > parseFloat(baseEthBalance) && (
                  <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-2.5 text-[11px] text-[#F4BB63]">
                    ⚠️ Requested amount ({walletAmount} ETH) exceeds your Base Sepolia balance ({baseEthBalance} ETH). Acquire Base Sepolia faucet ETH to broadcast live transactions.
                  </div>
                )}
                {connectedAddress && isBaseSepoliaNetwork && parseFloat(baseEthBalance) <= 0 && (
                  <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-2.5 text-[11px] text-[#F4BB63]">
                    ⚠️ Your account has 0.00 Base Sepolia ETH. You need testnet ETH to pay transaction amount and gas fees on Base Sepolia.
                  </div>
                )}
              </div>
            )}

            {/* SEPOLIA REAL TESTNET MODE */}
            {transferMode === "sepolia" && (
              <div className="space-y-3.5">
                {/* Testnet Disclaimers & Info */}
                <div className="rounded-xl border border-[#39D6C0]/25 bg-[#39D6C0]/5 p-3 text-xs text-[#39D6C0]/90">
                  <div className="flex items-center gap-1.5 font-semibold text-[#78F5CF] mb-1">
                    <Info size={14} />
                    <span>Ethereum Sepolia Testnet Transfer (Circle USDC)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#8E9EB5]">
                    Initiates an on-chain ERC-20 transfer using the official Circle USDC contract on Sepolia (
                    <code className="text-[#39D6C0] font-mono">0x1c7D...7238</code>). Sepolia tokens have no real financial value.
                  </p>
                </div>

                {/* MetaMask Connection & Real On-Chain Balances */}
                {!metaMaskAvailable ? (
                  <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-3 text-xs text-[#F4BB63]">
                    <span className="font-semibold block mb-0.5">MetaMask Not Detected</span>
                    Please install or activate the MetaMask browser extension to read balances and authorize Sepolia testnet transfers.
                  </div>
                ) : !connectedAddress ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#56D9F5]/30 bg-[#122238]/80 p-3">
                    <div>
                      <span className="block text-xs font-semibold text-[#F1F5F9]">MetaMask Wallet Disconnected</span>
                      <span className="block text-[11px] text-[#8E9EB5]">Connect your wallet to read balances and authorize Sepolia transfers.</span>
                    </div>
                    <button
                      id="connect-metamask-btn"
                      type="button"
                      onClick={handleConnectWallet}
                      disabled={isWalletConnecting}
                      className="rounded-lg bg-[#56D9F5] px-3.5 py-1.5 text-xs font-semibold text-[#08111F] hover:bg-[#72e1fa] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isWalletConnecting ? "Connecting..." : "Connect MetaMask"}
                    </button>
                  </div>
                ) : !isSepoliaNetwork ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3">
                    <div>
                      <span className="block text-xs font-semibold text-[#FCA5A5]">
                        Wrong Network (Chain ID: {currentChainId})
                      </span>
                      <span className="block text-[11px] text-[#8E9EB5]">
                        Transfers are restricted to Ethereum Sepolia (11155111).
                      </span>
                    </div>
                    <button
                      id="switch-network-btn"
                      type="button"
                      onClick={handleSwitchNetwork}
                      disabled={isNetworkSwitching}
                      className="rounded-lg bg-[#EF4444] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#dc2626] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isNetworkSwitching ? "Switching..." : "Switch to Sepolia"}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#39D6C0]/30 bg-[#122238]/80 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-[#8E9EB5]/15 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#78F5CF] animate-pulse" />
                        <span className="font-mono text-xs font-semibold text-[#F1F5F9]">
                          {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                        </span>
                        <span className="rounded bg-[#39D6C0]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#39D6C0]">
                          Sepolia Verified
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnectWallet}
                        className="text-[10px] text-[#8E9EB5] hover:text-[#EF4444] transition-colors cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-lg bg-[#08111F]/70 p-2 text-center">
                        <span className="block text-[10px] text-[#8E9EB5]">Circle USDC (Sepolia)</span>
                        <span className="font-mono text-xs font-bold text-[#78F5CF]">{usdcTokenBalance} USDC</span>
                      </div>
                      <div className="rounded-lg bg-[#08111F]/70 p-2 text-center">
                        <span className="block text-[10px] text-[#8E9EB5]">Sepolia ETH (Gas Fuel)</span>
                        <span className="font-mono text-xs font-bold text-[#56D9F5]">{ethGasBalance} ETH</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Natural Language Request */}
                <div>
                  <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                    Natural language transfer request (Auto-extracts parameters)
                  </label>
                  <input
                    type="text"
                    value={naturalTransferText}
                    onChange={(e) => handleNaturalTransferChange(e.target.value)}
                    placeholder="e.g. 'Send 0.01 USDC to 0x71C8360f78B35b36489aBE3C4B821b0C863d690a'"
                    className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-xs text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[#8E9EB5]/60">
                    Interpreted values are validated against the Sepolia allowlist and filled below.
                  </p>
                </div>

                {/* Recipient Address */}
                <div>
                  <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                    Recipient Address (Ethereum EVM Hex 0x...)
                  </label>
                  <input
                    type="text"
                    value={walletRecipient}
                    onChange={(e) => setWalletRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full font-mono rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-xs text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                  />
                </div>

                {/* Token & Amount Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                      Token (Allowlist Verified)
                    </label>
                    <div className="rounded-xl border border-[#8E9EB5]/20 bg-[#08111F]/60 px-3 py-2 text-xs text-[#F1F5F9] flex items-center justify-between">
                      <span className="font-semibold text-[#78F5CF]">Circle USDC</span>
                      <span className="text-[10px] text-[#8E9EB5] font-mono">6 Decimals</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-[#8E9EB5]">
                        Amount (USDC)
                      </label>
                      <span className="text-[10px] text-[#F4BB63] font-mono font-semibold">
                        Strict Max: 0.01 USDC
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      max="0.01"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder="0.01"
                      className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Balance & Gas alerts */}
                {connectedAddress && isSepoliaNetwork && parseFloat(walletAmount) > parseFloat(usdcTokenBalance) && (
                  <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-2.5 text-[11px] text-[#F4BB63]">
                    ⚠️ Requested amount ({walletAmount} USDC) exceeds your Sepolia balance ({usdcTokenBalance} USDC). Get testnet USDC from the Circle faucet to test live execution.
                  </div>
                )}
                {connectedAddress && isSepoliaNetwork && parseFloat(ethGasBalance) <= 0 && (
                  <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-2.5 text-[11px] text-[#F4BB63]">
                    ⚠️ Your account has 0.00 Sepolia ETH. You need testnet ETH to pay transaction gas fees on Ethereum Sepolia.
                  </div>
                )}
              </div>
            )}

            {/* SIMULATED LOCAL SQLITE MODE */}
            {transferMode === "simulated" && (
              <div className="space-y-3.5">
                <div className="rounded-xl border border-[#F4BB63]/30 bg-[#F4BB63]/10 p-3 text-xs text-[#F4BB63]">
                  <span className="font-semibold block mb-0.5">⚠️ Local SQLite Simulation Mode (SIM-USDC)</span>
                  This operates strictly on a local in-memory SQLite demo ledger. It does NOT interact with Ethereum mainnet or transfer real on-chain assets.
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                    Natural language request (optional)
                  </label>
                  <input
                    type="text"
                    value={naturalTransferText}
                    onChange={(e) => handleNaturalTransferChange(e.target.value)}
                    placeholder="e.g. 'Send 10 USDC to 0x70997970C51812dc3A010C7d01b50e0d17dc79C8'"
                    className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-xs text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[#8E9EB5]/60">
                    Initiates a simulation task. Values are parsed directly into the parameters below.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                    Recipient Address (0x...)
                  </label>
                  <input
                    type="text"
                    value={walletRecipient}
                    onChange={(e) => setWalletRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full font-mono rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-xs text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                      Amount (SIM-USDC)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder="25.00"
                      className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#8E9EB5] mb-1">
                      Transfer Note
                    </label>
                    <input
                      type="text"
                      value={walletNote}
                      onChange={(e) => setWalletNote(e.target.value)}
                      placeholder="Security buffer"
                      className="w-full rounded-xl border border-[#8E9EB5]/20 bg-[#122238]/80 px-3 py-2 text-sm text-[#F1F5F9] focus:border-[#39D6C0] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#8E9EB5]/15">
          <button
            id="cancel-task-btn"
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[#8E9EB5]/20 px-4 py-2 text-xs font-medium text-[#8E9EB5] hover:bg-[#122238] hover:text-[#F1F5F9] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="execute-analysis-btn"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#78F5CF] px-5 py-2 text-xs font-semibold text-[#08111F] shadow-lg shadow-[#78F5CF]/20 hover:bg-[#8bf7d5] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play size={14} className="fill-current" />
            <span>{taskType === "wallet_transfer" ? "Prepare & Review Transfer" : "Execute Analysis"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
