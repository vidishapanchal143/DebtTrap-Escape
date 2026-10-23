/**
 * Base Sepolia Crypto Capability & Transfer Safety Test Suite (Week 3)
 *
 * Verifies:
 * 1. Base Sepolia configuration (Chain ID 84532, RPC, currency, explorer)
 * 2. EVM recipient validation and checksum normalization
 * 3. Native ETH transfer amount validation & 0.05 ETH safety ceiling
 * 4. Natural-language intent parsing for Base Sepolia vs Ethereum Sepolia
 * 5. Agent tool payload preparation (prepareBaseSepoliaTransfer)
 * 6. Wallet connection & wrong network handling (Chain ID 84532 switch/add)
 * 7. User cancellation & signature rejection handling
 * 8. On-chain transaction receipt verification & Basescan formatting
 */

import { BrowserProvider } from "ethers";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_NETWORK_NAME,
  BASE_SEPOLIA_RPC_URL,
  BASE_SEPOLIA_EXPLORER_BASE,
  MAX_BASE_SEPOLIA_TRANSFER_ETH_STR,
  isValidEVMAddress,
  normalizeEVMAddress,
  validateBaseSepoliaTransferParameters,
  formatBaseSepoliaExplorerTxUrl,
} from "../src/lib/base-sepolia-config";
import {
  parseTransferIntent,
  prepareBaseSepoliaTransferPayload,
} from "../src/lib/transfer-intent";
import {
  switchNetworkToBaseSepolia,
  executeBaseSepoliaEthTransfer,
} from "../src/lib/metamask";
import { SEPOLIA_CHAIN_ID } from "../src/lib/sepolia-config";

const VALID_ADDRESS = "0x71c8360F78B35b36489abe3c4b821b0C863D690a";
const VALID_ADDRESS_LOWER = "0x71c8360f78b35b36489abe3c4b821b0c863d690a";
const INVALID_ADDRESS = "0x1234567890abcdef";
const INVALID_CHARS = "0x71c8360F78B35b36489abe3c4b821b0C863D690Z";

describe("Base Sepolia Crypto Capability Suite (Week 3)", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1. Network Configuration
  // ───────────────────────────────────────────────────────────────────────────
  describe("1. Base Sepolia Network Configuration", () => {
    test("has correct Chain ID: 84532", () => {
      expect(BASE_SEPOLIA_CHAIN_ID).toBe(84532);
      expect(BASE_SEPOLIA_CHAIN_ID_HEX).toBe("0x14a34");
    });

    test("has correct RPC endpoint: https://sepolia.base.org", () => {
      expect(BASE_SEPOLIA_RPC_URL).toBe("https://sepolia.base.org");
    });

    test("has correct Basescan explorer URLs", () => {
      expect(BASE_SEPOLIA_EXPLORER_BASE).toBe("https://sepolia.basescan.org");
      const sampleTx = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      expect(formatBaseSepoliaExplorerTxUrl(sampleTx)).toBe(
        `https://sepolia.basescan.org/tx/${sampleTx}`
      );
    });

    test("network name is Base Sepolia", () => {
      expect(BASE_SEPOLIA_NETWORK_NAME).toBe("Base Sepolia");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Recipient Address Validation
  // ───────────────────────────────────────────────────────────────────────────
  describe("2. Recipient EVM Address Validation", () => {
    test("accepts valid checksummed EVM address", () => {
      expect(isValidEVMAddress(VALID_ADDRESS)).toBe(true);
    });

    test("accepts valid lowercase EVM address", () => {
      expect(isValidEVMAddress(VALID_ADDRESS_LOWER)).toBe(true);
    });

    test("normalizes lowercase address to checksummed format", () => {
      expect(normalizeEVMAddress(VALID_ADDRESS_LOWER)).toBe(VALID_ADDRESS);
    });

    test("rejects short or malformed addresses", () => {
      expect(isValidEVMAddress(INVALID_ADDRESS)).toBe(false);
      expect(isValidEVMAddress(INVALID_CHARS)).toBe(false);
      expect(isValidEVMAddress("")).toBe(false);
      expect(isValidEVMAddress("vitalik.eth")).toBe(false);
    });

    test("validateBaseSepoliaTransferParameters rejects invalid recipient", () => {
      const res = validateBaseSepoliaTransferParameters({
        recipient: "not-an-address",
        amount: "0.001",
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/recipient/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Amount Validation & Safety Limits
  // ───────────────────────────────────────────────────────────────────────────
  describe("3. Amount Validation & Safety Caps", () => {
    test("accepts valid small ETH amounts", () => {
      const res = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: "0.001",
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(true);
      expect(res.normalizedRecipient).toBe(VALID_ADDRESS);
      expect(res.parsedAmountWei).toBeDefined();
    });

    test("rejects zero or negative amounts", () => {
      const zero = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: "0",
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });
      expect(zero.isValid).toBe(false);
      expect(zero.error).toMatch(/greater than zero/i);

      const neg = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: "-0.01",
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });
      expect(neg.isValid).toBe(false);
      expect(neg.error).toMatch(/greater than zero/i);
    });

    test("enforces strict maximum safety cap of 0.05 ETH on Base Sepolia", () => {
      const overLimit = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: "0.06",
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });
      expect(overLimit.isValid).toBe(false);
      expect(overLimit.error).toMatch(/exceeds the safety maximum/i);

      // Border check: 0.05 is allowed
      const border = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: MAX_BASE_SEPOLIA_TRANSFER_ETH_STR,
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });
      expect(border.isValid).toBe(true);
    });

    test("rejects amounts exceeding 18 decimals precision", () => {
      const tooPrecise = "0." + "1".repeat(19);
      const res = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: tooPrecise,
        chainId: BASE_SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/precision/i);
    });

    test("checks user ETH balance if provided", () => {
      const insufficient = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: "0.01",
        chainId: BASE_SEPOLIA_CHAIN_ID,
        ethBalance: "0.0005",
      });
      expect(insufficient.isValid).toBe(false);
      expect(insufficient.error).toMatch(/insufficient/i);
    });

    test("rejects mismatched chain ID", () => {
      const wrongChain = validateBaseSepoliaTransferParameters({
        recipient: VALID_ADDRESS,
        amount: "0.001",
        chainId: 1, // Mainnet
      });
      expect(wrongChain.isValid).toBe(false);
      expect(wrongChain.error).toMatch(/unsupported network/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Natural-Language Intent Parsing
  // ───────────────────────────────────────────────────────────────────────────
  describe("4. Natural Language Transfer Intent Parsing", () => {
    test("parses Base Sepolia prompt with native ETH", () => {
      const prompt = `Send 0.001 ETH to ${VALID_ADDRESS} on Base Sepolia`;
      const parsed = parseTransferIntent(prompt);

      expect(parsed.ok).toBe(true);
      expect(parsed.tokenSymbol).toBe("ETH");
      expect(parsed.network).toBe("Base Sepolia");
      expect(parsed.amount).toBe("0.001");
      expect(parsed.recipient).toBe(VALID_ADDRESS);
      expect(parsed.intent?.chainId).toBe(BASE_SEPOLIA_CHAIN_ID);
    });

    test("parses Base Sepolia prompt with preferredNetwork parameter", () => {
      const prompt = `Transfer 0.005 ETH to ${VALID_ADDRESS}`;
      const parsed = parseTransferIntent(prompt, undefined, "base-sepolia");

      expect(parsed.ok).toBe(true);
      expect(parsed.tokenSymbol).toBe("ETH");
      expect(parsed.network).toBe("Base Sepolia");
      expect(parsed.amount).toBe("0.005");
      expect(parsed.recipient).toBe(VALID_ADDRESS);
    });

    test("detects missing recipient in Base Sepolia prompt", () => {
      const prompt = "Send 0.001 ETH on Base Sepolia";
      const parsed = parseTransferIntent(prompt);

      expect(parsed.ok).toBe(false);
      expect(parsed.missingFields).toContain("recipient");
    });

    test("detects missing amount in Base Sepolia prompt", () => {
      const prompt = `Send ETH to ${VALID_ADDRESS} on Base Sepolia`;
      const parsed = parseTransferIntent(prompt);

      expect(parsed.ok).toBe(false);
      expect(parsed.missingFields).toContain("amount");
    });

    test("rejects amount exceeding 0.05 ETH on Base Sepolia in prompt", () => {
      const prompt = `Send 0.1 ETH to ${VALID_ADDRESS} on Base Sepolia`;
      const parsed = parseTransferIntent(prompt);

      expect(parsed.ok).toBe(false);
      expect(parsed.error).toMatch(/exceeds the safety maximum/i);
    });

    test("preserves separation: Ethereum Sepolia USDC transfers still work under 0.01 limit", () => {
      const prompt = `Send 0.01 USDC to ${VALID_ADDRESS}`;
      const parsed = parseTransferIntent(prompt);

      expect(parsed.ok).toBe(true);
      expect(parsed.tokenSymbol).toBe("USDC");
      expect(parsed.network).toBe("Ethereum Sepolia");
      expect(parsed.amount).toBe("0.01");
      expect(parsed.intent?.chainId).toBe(SEPOLIA_CHAIN_ID);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Agent Tool Payload Preparation (prepareBaseSepoliaTransferPayload)
  // ───────────────────────────────────────────────────────────────────────────
  describe("5. Agent Tool Payload Preparation", () => {
    test("prepares valid Base Sepolia payload for user review", () => {
      const args = {
        recipient: VALID_ADDRESS,
        amount: 0.002,
      };
      const res = prepareBaseSepoliaTransferPayload(args, "Send 0.002 ETH on Base Sepolia", VALID_ADDRESS);

      expect(res.result.ok).toBe(true);
      expect(res.preparedBaseSepoliaTx).toBeDefined();
      expect(res.preparedBaseSepoliaTx?.tokenSymbol).toBe("ETH");
      expect(res.preparedBaseSepoliaTx?.amount).toBe("0.002");
      expect(res.preparedBaseSepoliaTx?.chainId).toBe(BASE_SEPOLIA_CHAIN_ID);
      expect(res.preparedBaseSepoliaTx?.networkName).toBe(BASE_SEPOLIA_NETWORK_NAME);
      expect(res.preparedBaseSepoliaTx?.rpcUrl).toBe(BASE_SEPOLIA_RPC_URL);
      expect(res.event.status).toBe("completed");
    });

    test("rejects tool args exceeding 0.05 ETH limit", () => {
      const args = {
        recipient: VALID_ADDRESS,
        amount: 0.06,
      };
      const res = prepareBaseSepoliaTransferPayload(args);

      expect(res.result.ok).toBe(false);
      expect(res.result.error).toMatch(/exceeds the safety maximum/i);
      expect(res.event.status).toBe("failed");
    });

    test("rejects tool args with invalid recipient", () => {
      const args = {
        recipient: "invalid-address",
        amount: 0.001,
      };
      const res = prepareBaseSepoliaTransferPayload(args);

      expect(res.result.ok).toBe(false);
      expect(res.event.status).toBe("failed");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. MetaMask Wallet Connection & Network Handling
  // ───────────────────────────────────────────────────────────────────────────
  describe("6. Wallet Connection & Network Switch Handling", () => {
    beforeEach(() => {
      // Clean window.ethereum mock
      delete (global as unknown as { window?: { ethereum?: unknown } }).window;
    });

    test("throws helpful error when MetaMask is not installed", async () => {
      await expect(switchNetworkToBaseSepolia()).rejects.toThrow(/MetaMask is not available/i);
    });

    test("handles wallet_switchEthereumChain for Base Sepolia (0x14a34)", async () => {
      const mockRequest = jest.fn().mockResolvedValue(null);
      (global as unknown as { window: { ethereum: { request: typeof mockRequest } } }).window = {
        ethereum: { request: mockRequest },
      };

      const switched = await switchNetworkToBaseSepolia();
      expect(switched).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
      });
    });

    test("falls back to wallet_addEthereumChain when chain is not added (error 4902)", async () => {
      const mockRequest = jest
        .fn()
        .mockRejectedValueOnce({ code: 4902, message: "Unrecognized chain" })
        .mockResolvedValueOnce(null);

      (global as unknown as { window: { ethereum: { request: typeof mockRequest } } }).window = {
        ethereum: { request: mockRequest },
      };

      const switched = await switchNetworkToBaseSepolia();
      expect(switched).toBe(true);
      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(mockRequest).toHaveBeenLastCalledWith({
        method: "wallet_addEthereumChain",
        params: [
          expect.objectContaining({
            chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
            chainName: BASE_SEPOLIA_NETWORK_NAME,
            rpcUrls: [BASE_SEPOLIA_RPC_URL],
            blockExplorerUrls: [BASE_SEPOLIA_EXPLORER_BASE],
          }),
        ],
      });
    });

    test("handles user rejection of network switch (error 4001)", async () => {
      const mockRequest = jest.fn().mockRejectedValue({ code: 4001, message: "User rejected" });
      (global as unknown as { window: { ethereum: { request: typeof mockRequest } } }).window = {
        ethereum: { request: mockRequest },
      };

      await expect(switchNetworkToBaseSepolia()).rejects.toThrow(/rejected by user/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. User Cancellation & Receipt Verification Simulation
  // ───────────────────────────────────────────────────────────────────────────
  describe("7. User Cancellation & Receipt Verification", () => {
    test("handles user rejection in MetaMask signing (code 4001)", async () => {
      const mockRequest = jest.fn().mockImplementation(async ({ method }: { method: string }) => {
        if (method === "eth_chainId") return BASE_SEPOLIA_CHAIN_ID_HEX;
        if (method === "eth_accounts" || method === "eth_requestAccounts") return [VALID_ADDRESS];
        return null;
      });

      (global as unknown as { window: { ethereum: { request: typeof mockRequest } } }).window = {
        ethereum: { request: mockRequest },
      };

      const mockSigner = {
        sendTransaction: jest.fn().mockRejectedValue({
          code: 4001,
          message: "MetaMask Tx Signature: User denied transaction signature.",
        }),
      };

      const signerSpy = jest
        .spyOn(BrowserProvider.prototype, "getSigner")
        .mockResolvedValue(mockSigner as unknown as ReturnType<BrowserProvider["getSigner"]>);

      await expect(
        executeBaseSepoliaEthTransfer(VALID_ADDRESS, "0.001")
      ).rejects.toThrow(/rejected by user/i);

      signerSpy.mockRestore();
    });

    test("verifies mined on-chain block receipt before success", async () => {
      const sampleTxHash = "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef";
      const mockRequest = jest.fn().mockImplementation(async ({ method }: { method: string }) => {
        if (method === "eth_chainId") return BASE_SEPOLIA_CHAIN_ID_HEX;
        if (method === "eth_accounts" || method === "eth_requestAccounts") return [VALID_ADDRESS];
        return null;
      });

      (global as unknown as { window: { ethereum: { request: typeof mockRequest } } }).window = {
        ethereum: { request: mockRequest },
      };

      const mockReceipt = {
        status: 1,
        blockNumber: 1234567,
        hash: sampleTxHash,
        gasUsed: BigInt(21000),
      };
      const mockTx = {
        hash: sampleTxHash,
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };
      const mockSigner = {
        sendTransaction: jest.fn().mockResolvedValue(mockTx),
      };

      const signerSpy = jest
        .spyOn(BrowserProvider.prototype, "getSigner")
        .mockResolvedValue(mockSigner as unknown as ReturnType<BrowserProvider["getSigner"]>);

      const onTxHash = jest.fn();
      const result = await executeBaseSepoliaEthTransfer(VALID_ADDRESS, "0.001", onTxHash);

      expect(onTxHash).toHaveBeenCalledWith(sampleTxHash);
      expect(result.status).toBe("confirmed");
      expect(result.txHash).toBe(sampleTxHash);
      expect(result.blockNumber).toBe(1234567);
      expect(result.gasUsed).toBe("21000");

      signerSpy.mockRestore();
    });

    test("handles reverted transaction receipt (status 0)", async () => {
      const sampleTxHash = "0xrevertedhash1234567890abcdef1234567890abcdef1234567890abcdef1234";
      const mockRequest = jest.fn().mockImplementation(async ({ method }: { method: string }) => {
        if (method === "eth_chainId") return BASE_SEPOLIA_CHAIN_ID_HEX;
        if (method === "eth_accounts" || method === "eth_requestAccounts") return [VALID_ADDRESS];
        return null;
      });

      (global as unknown as { window: { ethereum: { request: typeof mockRequest } } }).window = {
        ethereum: { request: mockRequest },
      };

      const mockReceipt = {
        status: 0, // Reverted!
        blockNumber: 1234568,
        hash: sampleTxHash,
      };
      const mockTx = {
        hash: sampleTxHash,
        wait: jest.fn().mockResolvedValue(mockReceipt),
      };
      const mockSigner = {
        sendTransaction: jest.fn().mockResolvedValue(mockTx),
      };

      const signerSpy = jest
        .spyOn(BrowserProvider.prototype, "getSigner")
        .mockResolvedValue(mockSigner as unknown as ReturnType<BrowserProvider["getSigner"]>);

      await expect(
        executeBaseSepoliaEthTransfer(VALID_ADDRESS, "0.001")
      ).rejects.toThrow(/reverted on Base Sepolia/i);

      signerSpy.mockRestore();
    });
  });
});
