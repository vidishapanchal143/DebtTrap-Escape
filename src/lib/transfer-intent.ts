import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NETWORK_NAME,
  MAX_SEPOLIA_TRANSFER_USDC,
  MAX_SEPOLIA_TRANSFER_USDC_STR,
  SUPPORTED_TOKENS,
  getSupportedToken,
  isValidEthereumAddress,
  validateTransferParameters,
} from "./sepolia-config";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_NETWORK_NAME,
  BASE_SEPOLIA_RPC_URL,
  MAX_BASE_SEPOLIA_TRANSFER_ETH,
  MAX_BASE_SEPOLIA_TRANSFER_ETH_STR,
  isValidEVMAddress,
  validateBaseSepoliaTransferParameters,
} from "./base-sepolia-config";
import { z } from "zod";
import type { SepoliaTransferParams, BaseSepoliaTransferParams } from "@/types/midnight";

export interface ParsedTransferIntent {
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  decimals: number;
  amount: string;
  recipient: string;
  network: string;
  chainId: number;
  isTestnet: boolean;
  senderAddress?: string;
  rawPrompt: string;
}

export interface IntentParseResult {
  ok: boolean;
  isValid: boolean;
  intent?: ParsedTransferIntent;
  amount?: string;
  tokenSymbol?: string;
  recipient?: string;
  network?: string;
  missingFields?: Array<"recipient" | "amount" | "token" | "network">;
  error?: string;
  clarificationMessage?: string;
}

/**
 * Deterministically and safely interpret a natural-language transfer prompt.
 * Supports both:
 * 1. Ethereum Sepolia Circle USDC transfers (strict 0.01 USDC max limit)
 * 2. Base Sepolia native ETH transfers (strict 0.05 ETH safety limit)
 */
export function parseTransferIntent(
  prompt: string,
  connectedAddress?: string,
  preferredNetwork?: "sepolia" | "base-sepolia"
): IntentParseResult {
  const trimmed = (prompt || "").trim();
  if (!trimmed) {
    return {
      ok: false,
      isValid: false,
      missingFields: ["amount", "recipient"],
      clarificationMessage: "Please specify an amount and recipient address (e.g. 'Send 0.01 USDC to 0x...' or 'Send 0.001 ETH on Base Sepolia to 0x...').",
    };
  }

  const lower = trimmed.toLowerCase();

  // 1. Detect target network: check for Base Sepolia indicators
  const isBaseIntent = preferredNetwork === "base-sepolia" ||
    /\b(base\s*sepolia|base-sepolia|on\s+base)\b/i.test(lower) ||
    (/\bbase\b/i.test(lower) && !/\bdatabase|base units|based\b/i.test(lower));

  // Reject unsupported mainnets or non-testnet chains
  if (/\b(polygon|bsc|binance|solana|arbitrum|optimism|avalanche)\b/i.test(lower) ||
      (/\bmainnet\b/i.test(lower)) ||
      (/\bbase\s+mainnet\b/i.test(lower))) {
    return {
      ok: false,
      isValid: false,
      error: "Only testnet networks (Ethereum Sepolia and Base Sepolia) are supported. Transfers on mainnet or other chains are rejected for safety.",
    };
  }

  // 2. Extract 0x address (40 hex chars after 0x)
  const addressMatch = trimmed.match(/\b(0x[a-fA-F0-9]{40})\b/);
  const malformedMatch = trimmed.match(/\b(0x[a-fA-F0-9]{1,39}|0x[a-fA-F0-9]{41,})\b/);

  let recipient: string | undefined;
  if (addressMatch) {
    recipient = addressMatch[1];
  } else if (malformedMatch) {
    return {
      ok: false,
      isValid: false,
      missingFields: ["recipient"],
      error: `The recipient address '${malformedMatch[1]}' is invalid. Ethereum addresses must be exactly 42 characters (0x followed by 40 hex digits).`,
    };
  }

  // Strip extracted recipient address before looking for amounts so hex digits aren't mistaken for amounts
  const textWithoutAddress = recipient ? trimmed.replace(recipient, " ") : trimmed;

  // 3. Extract Token Symbol & Network Target
  if (isBaseIntent) {
    // Base Sepolia Native ETH flow
    const tokenMatch = textWithoutAddress.match(/\b(ETH|USDC|USDT|DAI|BTC|SOL)\b/i);
    if (tokenMatch) {
      const rawSymbol = tokenMatch[1].toUpperCase();
      if (rawSymbol !== "ETH") {
        return {
          ok: false,
          isValid: false,
          missingFields: ["token"],
          error: `Unsupported token '${rawSymbol}' for Base Sepolia transfer. Only native Base Sepolia ETH is supported.`,
        };
      }
    }

    // Extract amount
    let amountStr: string | undefined;
    const amountPattern = /\b(\d+(?:\.\d+)?)\s*(?:eth|ether)?\b/i;
    const match = textWithoutAddress.match(amountPattern);
    if (match && match[1]) {
      amountStr = match[1];
    }

    const missing: Array<"recipient" | "amount" | "token" | "network"> = [];
    if (!recipient) missing.push("recipient");
    if (!amountStr) missing.push("amount");

    if (missing.length > 0) {
      let msg = "Missing required transfer parameters: ";
      if (missing.includes("recipient") && missing.includes("amount")) {
        msg = "Please specify the transfer amount and recipient address (e.g. 'Send 0.001 ETH on Base Sepolia to 0x...').";
      } else if (missing.includes("recipient")) {
        msg = "Please specify a valid recipient Ethereum address (0x...).";
      } else if (missing.includes("amount")) {
        msg = "Please specify the amount of native ETH to transfer.";
      }
      return {
        ok: false,
        isValid: false,
        missingFields: missing,
        clarificationMessage: msg,
      };
    }

    const parsedAmountNum = parseFloat(amountStr!);
    if (parsedAmountNum > MAX_BASE_SEPOLIA_TRANSFER_ETH) {
      return {
        ok: false,
        isValid: false,
        error: `Transfer amount (${amountStr} ETH) exceeds the safety maximum of ${MAX_BASE_SEPOLIA_TRANSFER_ETH_STR} ETH on Base Sepolia.`,
      };
    }

    const valResult = validateBaseSepoliaTransferParameters({
      recipient: recipient!,
      amount: amountStr!,
      chainId: BASE_SEPOLIA_CHAIN_ID,
    });

    if (!valResult.isValid) {
      return {
        ok: false,
        isValid: false,
        error: valResult.error,
      };
    }

    return {
      ok: true,
      isValid: true,
      missingFields: [],
      amount: amountStr!,
      tokenSymbol: "ETH",
      recipient: valResult.normalizedRecipient!,
      network: BASE_SEPOLIA_NETWORK_NAME,
      intent: {
        tokenSymbol: "ETH",
        tokenName: "Base Sepolia Ether",
        tokenAddress: "native",
        decimals: 18,
        amount: amountStr!,
        recipient: valResult.normalizedRecipient!,
        network: BASE_SEPOLIA_NETWORK_NAME,
        chainId: BASE_SEPOLIA_CHAIN_ID,
        isTestnet: true,
        senderAddress: connectedAddress && isValidEVMAddress(connectedAddress) ? connectedAddress : undefined,
        rawPrompt: trimmed,
      },
    };
  }

  // Ethereum Sepolia Circle USDC Flow (Default for Sepolia transfers)
  let tokenSymbol = "USDC"; // default expected token
  const tokenMatch = textWithoutAddress.match(/\b(USDC|USDT|DAI|ETH|BTC|SOL|PEPE|SHIB|DOGE)\b/i);
  if (tokenMatch) {
    const rawSymbol = tokenMatch[1].toUpperCase();
    if (rawSymbol !== "USDC") {
      return {
        ok: false,
        isValid: false,
        missingFields: ["token"],
        error: `Unsupported token '${rawSymbol}'. Only Circle USDC on Ethereum Sepolia is supported.`,
      };
    }
    tokenSymbol = rawSymbol;
  }

  const supportedToken = getSupportedToken(tokenSymbol);
  if (!supportedToken) {
    return {
      ok: false,
      isValid: false,
      missingFields: ["token"],
      error: `Token '${tokenSymbol}' is not supported in the allowlist.`,
    };
  }

  // Extract Amount from textWithoutAddress
  let amountStr: string | undefined;
  const amountPattern = /\b(\d+(?:\.\d+)?)\s*(?:usdc|sim-usdc|tokens?)?\b/i;
  const match = textWithoutAddress.match(amountPattern);
  if (match && match[1]) {
    amountStr = match[1];
  }

  // Check missing fields
  const missing: Array<"recipient" | "amount" | "token" | "network"> = [];
  if (!recipient) missing.push("recipient");
  if (!amountStr) missing.push("amount");

  if (missing.length > 0) {
    let msg = "Missing required transfer parameters: ";
    if (missing.includes("recipient") && missing.includes("amount")) {
      msg = "Please specify the transfer amount and recipient address (e.g. 'Send 0.01 USDC to 0x...').";
    } else if (missing.includes("recipient")) {
      msg = "Please specify a valid recipient Ethereum address (0x...).";
    } else if (missing.includes("amount")) {
      msg = "Please specify the amount of USDC to transfer.";
    }
    return {
      ok: false,
      isValid: false,
      missingFields: missing,
      clarificationMessage: msg,
    };
  }

  // Enforce strict 0.01 USDC maximum transfer limit
  const parsedAmountNum = parseFloat(amountStr!);
  if (parsedAmountNum > MAX_SEPOLIA_TRANSFER_USDC) {
    return {
      ok: false,
      isValid: false,
      error: `Transfer amount (${amountStr} USDC) exceeds the strict safety maximum of ${MAX_SEPOLIA_TRANSFER_USDC_STR} USDC. Amounts above 0.01 USDC are prohibited.`,
    };
  }

  // Validate parameters against strict rules
  const valResult = validateTransferParameters({
    recipient: recipient!,
    amount: amountStr!,
    tokenSymbol,
    chainId: SEPOLIA_CHAIN_ID,
  });

  if (!valResult.isValid) {
    return {
      ok: false,
      isValid: false,
      error: valResult.error,
    };
  }

  return {
    ok: true,
    isValid: true,
    missingFields: [],
    amount: amountStr!,
    tokenSymbol: supportedToken.symbol,
    recipient: valResult.normalizedRecipient!,
    network: SEPOLIA_NETWORK_NAME,
    intent: {
      tokenSymbol: supportedToken.symbol,
      tokenName: supportedToken.name,
      tokenAddress: supportedToken.contractAddress,
      decimals: supportedToken.expectedDecimals,
      amount: amountStr!,
      recipient: valResult.normalizedRecipient!,
      network: SEPOLIA_NETWORK_NAME,
      chainId: SEPOLIA_CHAIN_ID,
      isTestnet: true,
      senderAddress: connectedAddress && isValidEthereumAddress(connectedAddress) ? connectedAddress : undefined,
      rawPrompt: trimmed,
    },
  };
}

/**
 * Validate and prepare an on-chain Sepolia USDC transfer payload for the Gemini agent.
 * Strictly enforces that amount <= 0.01 USDC and requires explicit user authorization before execution.
 */
export function prepareSepoliaTransferPayload(
  rawArgs: unknown,
  userMessage?: string,
  connectedAddress?: string
): {
  result: Record<string, unknown>;
  event: { name: string; status: "completed" | "failed"; summary: string };
  preparedSepoliaTx?: SepoliaTransferParams;
} {
  const name = "prepareSepoliaTransfer";
  try {
    const SepoliaPrepareSchema = z.object({
      recipient: z.string().min(1, "Recipient address is required."),
      amount: z.number().finite().positive("Transfer amount must be greater than zero."),
    });
    const input = SepoliaPrepareSchema.parse(rawArgs);
    const amountStr = String(input.amount);

    if (input.amount > MAX_SEPOLIA_TRANSFER_USDC) {
      throw new Error(
        `Transfer amount (${amountStr} USDC) exceeds the strict safety maximum of ${MAX_SEPOLIA_TRANSFER_USDC_STR} USDC. Amounts above 0.01 USDC are prohibited.`
      );
    }

    const valResult = validateTransferParameters({
      recipient: input.recipient,
      amount: amountStr,
      tokenSymbol: "USDC",
      chainId: SEPOLIA_CHAIN_ID,
    });

    if (!valResult.isValid) {
      throw new Error(valResult.error || "Sepolia transfer validation failed.");
    }

    const preparedSepolia: SepoliaTransferParams = {
      recipient: valResult.normalizedRecipient!,
      amount: amountStr,
      tokenSymbol: "USDC",
      tokenAddress: SUPPORTED_TOKENS.USDC.contractAddress,
      tokenDecimals: SUPPORTED_TOKENS.USDC.expectedDecimals,
      senderAddress: connectedAddress && isValidEthereumAddress(connectedAddress) ? connectedAddress : "",
      chainId: SEPOLIA_CHAIN_ID,
      networkName: SEPOLIA_NETWORK_NAME,
      rawPrompt: userMessage,
    };

    return {
      result: {
        ok: true,
        tool: name,
        data: {
          ...preparedSepolia,
          status: "prepared_awaiting_approval",
          requiresUserApproval: true,
          disclaimer: "Sepolia testnet only. Tokens have no real value. Requires explicit MetaMask authorization.",
        },
      },
      event: {
        name,
        status: "completed",
        summary: `Prepared Sepolia transfer of ${amountStr} USDC to ${valResult.normalizedRecipient}. Awaiting explicit user approval in MetaMask.`,
      },
      preparedSepoliaTx: preparedSepolia,
    };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Tool arguments failed validation. Recipient must be a valid EVM address and amount must be positive."
      : error instanceof Error
        ? error.message
        : "Failed to prepare Sepolia transfer.";
    return {
      result: { ok: false, tool: name, error: message },
      event: { name, status: "failed", summary: message },
    };
  }
}

/**
 * Validate and prepare an on-chain Base Sepolia native ETH transfer payload for the Gemini agent.
 * Strictly enforces that amount <= 0.05 ETH and requires explicit user authorization before execution.
 */
export function prepareBaseSepoliaTransferPayload(
  rawArgs: unknown,
  userMessage?: string,
  connectedAddress?: string
): {
  result: Record<string, unknown>;
  event: { name: string; status: "completed" | "failed"; summary: string };
  preparedBaseSepoliaTx?: BaseSepoliaTransferParams;
} {
  const name = "prepareBaseSepoliaTransfer";
  try {
    const BaseSepoliaPrepareSchema = z.object({
      recipient: z.string().min(1, "Recipient address is required."),
      amount: z.number().finite().positive("Transfer amount must be greater than zero."),
    });
    const input = BaseSepoliaPrepareSchema.parse(rawArgs);
    const amountStr = String(input.amount);

    if (input.amount > MAX_BASE_SEPOLIA_TRANSFER_ETH) {
      throw new Error(
        `Transfer amount (${amountStr} ETH) exceeds the safety maximum of ${MAX_BASE_SEPOLIA_TRANSFER_ETH_STR} ETH on Base Sepolia.`
      );
    }

    const valResult = validateBaseSepoliaTransferParameters({
      recipient: input.recipient,
      amount: amountStr,
      chainId: BASE_SEPOLIA_CHAIN_ID,
    });

    if (!valResult.isValid) {
      throw new Error(valResult.error || "Base Sepolia transfer validation failed.");
    }

    const preparedBaseSepolia: BaseSepoliaTransferParams = {
      recipient: valResult.normalizedRecipient!,
      amount: amountStr,
      tokenSymbol: "ETH",
      senderAddress: connectedAddress && isValidEVMAddress(connectedAddress) ? connectedAddress : "",
      chainId: BASE_SEPOLIA_CHAIN_ID,
      networkName: BASE_SEPOLIA_NETWORK_NAME,
      rpcUrl: BASE_SEPOLIA_RPC_URL,
      rawPrompt: userMessage,
    };

    return {
      result: {
        ok: true,
        tool: name,
        data: {
          ...preparedBaseSepolia,
          status: "prepared_awaiting_approval",
          requiresUserApproval: true,
          disclaimer: "Base Sepolia testnet only. Native ETH has no real value. Requires explicit MetaMask authorization.",
        },
      },
      event: {
        name,
        status: "completed",
        summary: `Prepared Base Sepolia transfer of ${amountStr} ETH to ${valResult.normalizedRecipient}. Awaiting explicit user approval in MetaMask.`,
      },
      preparedBaseSepoliaTx: preparedBaseSepolia,
    };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Tool arguments failed validation. Recipient must be a valid EVM address and amount must be positive."
      : error instanceof Error
        ? error.message
        : "Failed to prepare Base Sepolia transfer.";
    return {
      result: { ok: false, tool: name, error: message },
      event: { name, status: "failed", summary: message },
    };
  }
}
