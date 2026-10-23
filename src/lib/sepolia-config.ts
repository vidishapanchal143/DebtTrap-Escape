// src/lib/sepolia-config.ts
import { ethers } from "ethers";

/**
 * Centralized Ethereum Sepolia & Circle USDC Configuration Module
 * 
 * Circle USDC on Sepolia testnet documented contract address:
 * 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
 * Source: https://developers.circle.com/stablecoins/usdc-contract-addresses
 */

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";
export const SEPOLIA_NETWORK_NAME = "Ethereum Sepolia";
export const SEPOLIA_EXPLORER_BASE = "https://sepolia.etherscan.io";
export const SEPOLIA_EXPLORER_TX_BASE = "https://sepolia.etherscan.io/tx/";
export const SEPOLIA_RPC_FALLBACK = "https://rpc.sepolia.org";

/**
 * Strict maximum transfer limit for Sepolia transfers: 0.01 USDC per transaction.
 * Transactions above 0.01 USDC are strictly prohibited.
 */
export const MAX_SEPOLIA_TRANSFER_USDC = 0.01;
export const MAX_SEPOLIA_TRANSFER_USDC_STR = "0.01";

export interface SupportedToken {
  symbol: string;
  name: string;
  contractAddress: string;
  chainId: number;
  expectedDecimals: number;
  isTestnet: boolean;
}

/**
 * Strict allowlist of supported tokens.
 * Arbitrary user-supplied token addresses are forbidden in this implementation.
 */
export const SUPPORTED_TOKENS: Record<string, SupportedToken> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin (Circle Testnet)",
    contractAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    chainId: SEPOLIA_CHAIN_ID,
    expectedDecimals: 6,
    isTestnet: true,
  },
};

/**
 * Minimal Standard ERC-20 ABI for balance checks and transfers
 */
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

/**
 * Validate token symbol against allowlist
 */
export function getSupportedToken(symbol: string): SupportedToken | null {
  const normalized = symbol.trim().toUpperCase();
  return SUPPORTED_TOKENS[normalized] || null;
}

/**
 * Validate Ethereum address (handles lowercase, uppercase, and EIP-55 checksum)
 */
export function isValidEthereumAddress(address: string): boolean {
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
 * Return checksum-normalized Ethereum address
 */
export function normalizeEthereumAddress(address: string): string {
  return ethers.getAddress(address.trim().toLowerCase());
}

/**
 * Validate transfer parameters before initiating any on-chain preparation
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  normalizedRecipient?: string;
  token?: SupportedToken;
  parsedAmountBaseUnits?: bigint;
}

export function validateTransferParameters(params: {
  recipient: string;
  amount: number | string;
  tokenSymbol?: string;
  chainId?: number;
  tokenBalance?: string;
  ethBalance?: string;
}): ValidationResult {
  const { recipient, amount, tokenSymbol = "USDC", chainId } = params;

  // 1. Chain ID validation
  if (chainId !== undefined && chainId !== SEPOLIA_CHAIN_ID) {
    return {
      isValid: false,
      error: `Unsupported network (Chain ID: ${chainId}). Only Ethereum Sepolia (Chain ID: ${SEPOLIA_CHAIN_ID}) is supported.`,
    };
  }

  // 2. Token allowlist validation
  const token = getSupportedToken(tokenSymbol);
  if (!token) {
    return {
      isValid: false,
      error: `Unsupported token '${tokenSymbol}'. Only Circle USDC (${SUPPORTED_TOKENS.USDC.contractAddress}) on Sepolia is supported.`,
    };
  }

  // 3. Recipient address validation
  if (!isValidEthereumAddress(recipient)) {
    return {
      isValid: false,
      error: "Recipient must be a valid 42-character Ethereum address (0x...).",
    };
  }

  const normalizedRecipient = normalizeEthereumAddress(recipient);

  // 4. Amount validation
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
  if (decimalParts.length === 2 && decimalParts[1].length > token.expectedDecimals) {
    return {
      isValid: false,
      error: `Amount exceeds ${token.symbol} precision (maximum ${token.expectedDecimals} decimal places).`,
    };
  }

  let parsedAmountBaseUnits: bigint;
  try {
    parsedAmountBaseUnits = ethers.parseUnits(amountStr, token.expectedDecimals);
  } catch {
    return {
      isValid: false,
      error: `Failed to parse amount into ${token.symbol} base units.`,
    };
  }

  // 5. Strict safety cap: maximum 0.01 USDC per transaction
  if (token.symbol === "USDC") {
    const maxAllowedBaseUnits = ethers.parseUnits(MAX_SEPOLIA_TRANSFER_USDC_STR, token.expectedDecimals);
    if (parsedAmountBaseUnits > maxAllowedBaseUnits) {
      return {
        isValid: false,
        error: `Transfer amount (${amountStr} ${token.symbol}) exceeds the strict safety maximum of ${MAX_SEPOLIA_TRANSFER_USDC_STR} ${token.symbol}. Amounts above 0.01 USDC are prohibited.`,
      };
    }
  }

  // 6. Balance checks if available
  if (params.tokenBalance !== undefined) {
    const balNum = parseFloat(params.tokenBalance);
    if (!isNaN(balNum) && amountNum > balNum) {
      return {
        isValid: false,
        error: `Insufficient ${token.symbol} balance. Your current balance is ${params.tokenBalance} ${token.symbol}, requested ${amountStr} ${token.symbol}.`,
      };
    }
  }

  if (params.ethBalance !== undefined) {
    const ethNum = parseFloat(params.ethBalance);
    if (!isNaN(ethNum) && ethNum < 0.0005) {
      return {
        isValid: false,
        error: "Insufficient Sepolia ETH for gas. You need native testnet ETH to broadcast transactions.",
      };
    }
  }

  return {
    isValid: true,
    normalizedRecipient,
    token,
    parsedAmountBaseUnits,
  };
}

/**
 * Format Sepolia Etherscan transaction URL
 */
export function formatSepoliaExplorerTxUrl(txHash: string): string {
  const cleanHash = txHash.trim();
  return `${SEPOLIA_EXPLORER_TX_BASE}${cleanHash}`;
}
