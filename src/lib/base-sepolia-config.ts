// src/lib/base-sepolia-config.ts
import { ethers } from "ethers";

/**
 * Base Sepolia Network Configuration
 * 
 * Network Details:
 * - Chain ID: 84532 (0x14a34)
 * - RPC Endpoint: https://sepolia.base.org
 * - Native Currency: ETH (18 decimals)
 * - Block Explorer: https://sepolia.basescan.org
 * - Documentation: https://docs.base.org/network-information
 */

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14a34";
export const BASE_SEPOLIA_NETWORK_NAME = "Base Sepolia";
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";
export const BASE_SEPOLIA_EXPLORER_BASE = "https://sepolia.basescan.org";
export const BASE_SEPOLIA_EXPLORER_TX_BASE = "https://sepolia.basescan.org/tx/";

export const BASE_SEPOLIA_CURRENCY = {
  name: "Base Sepolia Ether",
  symbol: "ETH",
  decimals: 18,
};

/**
 * Safety cap for testnet Base Sepolia ETH transfers.
 * Prevents draining of faucet funds or accidental large amounts.
 */
export const MAX_BASE_SEPOLIA_TRANSFER_ETH = 0.05;
export const MAX_BASE_SEPOLIA_TRANSFER_ETH_STR = "0.05";

/**
 * Helper to validate Ethereum address format (handles lowercase, checksummed, uppercase).
 */
export function isValidEVMAddress(address: string): boolean {
  if (typeof address !== "string") return false;
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return false;
  try {
    ethers.getAddress(trimmed.toLowerCase());
    return true;
  } catch {
    return false;
  }
}

/**
 * Return checksum-normalized address
 */
export function normalizeEVMAddress(address: string): string {
  return ethers.getAddress(address.trim().toLowerCase());
}

export interface BaseSepoliaValidationResult {
  isValid: boolean;
  error?: string;
  normalizedRecipient?: string;
  parsedAmountWei?: bigint;
}

/**
 * Validate Base Sepolia ETH transfer parameters
 */
export function validateBaseSepoliaTransferParameters(params: {
  recipient: string;
  amount: number | string;
  chainId?: number;
  ethBalance?: string;
}): BaseSepoliaValidationResult {
  const { recipient, amount, chainId, ethBalance } = params;

  // 1. Chain ID validation
  if (chainId !== undefined && chainId !== BASE_SEPOLIA_CHAIN_ID) {
    return {
      isValid: false,
      error: `Unsupported network (Chain ID: ${chainId}). Only Base Sepolia (Chain ID: ${BASE_SEPOLIA_CHAIN_ID}) is supported for this action.`,
    };
  }

  // 2. Recipient address validation
  if (!isValidEVMAddress(recipient)) {
    return {
      isValid: false,
      error: "Recipient must be a valid 42-character Ethereum address (0x...).",
    };
  }

  const normalizedRecipient = normalizeEVMAddress(recipient);

  // 3. Amount validation
  if (typeof amount === "string" && !amount.trim()) {
    return {
      isValid: false,
      error: "Transfer amount must be a valid number greater than zero.",
    };
  }

  const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
    return {
      isValid: false,
      error: "Transfer amount must be a valid number greater than zero.",
    };
  }

  const amountStr = typeof amount === "number" ? amount.toString() : amount.trim();
  const decimalParts = amountStr.split(".");
  if (decimalParts.length === 2 && decimalParts[1].length > 18) {
    return {
      isValid: false,
      error: "Amount exceeds ETH precision (maximum 18 decimal places).",
    };
  }

  let parsedAmountWei: bigint;
  try {
    parsedAmountWei = ethers.parseEther(amountStr);
  } catch {
    return {
      isValid: false,
      error: "Failed to parse ETH amount into Wei base units.",
    };
  }

  // 4. Safety maximum enforcement (0.05 ETH limit)
  const maxAllowedWei = ethers.parseEther(MAX_BASE_SEPOLIA_TRANSFER_ETH_STR);
  if (parsedAmountWei > maxAllowedWei) {
    return {
      isValid: false,
      error: `Transfer amount (${amountStr} ETH) exceeds the safety maximum of ${MAX_BASE_SEPOLIA_TRANSFER_ETH_STR} ETH on Base Sepolia.`,
    };
  }

  // 5. Balance check if available
  if (ethBalance !== undefined) {
    const balNum = parseFloat(ethBalance);
    if (!isNaN(balNum) && amountNum > balNum) {
      return {
        isValid: false,
        error: `Insufficient Base Sepolia ETH balance. Your current balance is ${ethBalance} ETH, requested ${amountStr} ETH.`,
      };
    }
  }

  return {
    isValid: true,
    normalizedRecipient,
    parsedAmountWei,
  };
}

/**
 * Format Base Sepolia Basescan transaction explorer URL
 */
export function formatBaseSepoliaExplorerTxUrl(txHash: string): string {
  const cleanHash = txHash.trim();
  return `${BASE_SEPOLIA_EXPLORER_TX_BASE}${cleanHash}`;
}
