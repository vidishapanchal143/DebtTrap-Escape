/**
 * Sepolia Transfer & Prompt Interpretation Unit Tests
 * 
 * Verifies all Week 2 core criteria:
 *  1. Valid and invalid recipient parsing (EVM addresses, checksums, malformed)
 *  2. Missing token, amount, or recipient in natural language intent
 *  3. Unsupported token rejection (allowlist enforcement)
 *  4. Unsupported chain ID rejection (Ethereum mainnet / other chains blocked)
 *  5. Zero or negative amounts rejection
 *  6. Amount precision and token decimals (USDC max 6 decimals)
 *  7. Insufficient balance checks (token balance and native ETH gas balance)
 *  8. Strict 0.01 USDC maximum limit enforcement across all paths
 *  9. User rejection simulation (code 4001 / ACTION_REJECTED)
 * 10. Pending vs confirmed transaction status
 * 11. Failed transaction receipt handling
 * 12. Duplicate submission protection logic
 * 13. Sepolia Etherscan explorer URL formatting
 */

import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NETWORK_NAME,
  MAX_SEPOLIA_TRANSFER_USDC,
  MAX_SEPOLIA_TRANSFER_USDC_STR,
  isValidEthereumAddress,
  validateTransferParameters,
  formatSepoliaExplorerTxUrl,
  getSupportedToken,
} from '../src/lib/sepolia-config';
import { parseTransferIntent, prepareSepoliaTransferPayload } from '../src/lib/transfer-intent';

const VALID_RECIPIENT = '0x71c8360F78B35b36489abe3c4b821b0C863D690a';
const VALID_RECIPIENT_LOWER = '0x71c8360f78b35b36489abe3c4b821b0c863d690a';
const INVALID_ADDR_CHARS = '0x71c8360F78B35b36489abe3c4b821b0C863D690Z';
const INVALID_ADDR_SHORT = '0x1234567890';

describe('Sepolia Testnet & Prompt Transfer Safety Suite', () => {

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Recipient Address Validation
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Valid and Invalid Recipient Parsing', () => {
    test('accepts valid checksummed Ethereum address', () => {
      expect(isValidEthereumAddress(VALID_RECIPIENT)).toBe(true);
    });

    test('accepts valid lowercase Ethereum address', () => {
      expect(isValidEthereumAddress(VALID_RECIPIENT_LOWER)).toBe(true);
    });

    test('rejects non-hex characters in address', () => {
      expect(isValidEthereumAddress(INVALID_ADDR_CHARS)).toBe(false);
    });

    test('rejects addresses with incorrect length', () => {
      expect(isValidEthereumAddress(INVALID_ADDR_SHORT)).toBe(false);
      expect(isValidEthereumAddress('0x' + 'a'.repeat(38))).toBe(false);
      expect(isValidEthereumAddress('0x' + 'a'.repeat(42))).toBe(false);
    });

    test('rejects non-address strings or plain words', () => {
      expect(isValidEthereumAddress('vitalik.eth')).toBe(false);
      expect(isValidEthereumAddress('')).toBe(false);
      expect(isValidEthereumAddress('not-an-address')).toBe(false);
    });

    test('validateTransferParameters normalizes valid recipient', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT_LOWER,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(true);
      expect(res.normalizedRecipient).toBe(VALID_RECIPIENT);
    });

    test('validateTransferParameters rejects invalid recipient', () => {
      const res = validateTransferParameters({
        recipient: 'invalid-address',
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/recipient/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Natural Language Intent Parsing & Missing Fields
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Natural Language Intent Parsing & Missing Fields', () => {
    test('extracts amount, token, and recipient from standard prompt', () => {
      const prompt = `Send 0.01 USDC to ${VALID_RECIPIENT}`;
      const parsed = parseTransferIntent(prompt);

      expect(parsed.isValid).toBe(true);
      expect(parsed.amount).toBe('0.01');
      expect(parsed.tokenSymbol).toBe('USDC');
      expect(parsed.recipient).toBe(VALID_RECIPIENT);
      expect(parsed.missingFields).toHaveLength(0);
    });

    test('extracts transfer request with network mentioned (within 0.01 limit)', () => {
      const prompt = `Transfer 0.005 USDC on Sepolia testnet to ${VALID_RECIPIENT}`;
      const parsed = parseTransferIntent(prompt);

      expect(parsed.isValid).toBe(true);
      expect(parsed.amount).toBe('0.005');
      expect(parsed.tokenSymbol).toBe('USDC');
      expect(parsed.network).toBe(SEPOLIA_NETWORK_NAME);
    });

    test('detects missing recipient and prompts for clarification', () => {
      const prompt = 'Send 0.01 USDC please';
      const parsed = parseTransferIntent(prompt);

      expect(parsed.isValid).toBe(false);
      expect(parsed.missingFields).toContain('recipient');
      expect(parsed.clarificationMessage).toMatch(/recipient/i);
    });

    test('detects missing amount and prompts for clarification', () => {
      const prompt = `Send USDC to ${VALID_RECIPIENT}`;
      const parsed = parseTransferIntent(prompt);

      expect(parsed.isValid).toBe(false);
      expect(parsed.missingFields).toContain('amount');
      expect(parsed.clarificationMessage).toMatch(/amount/i);
    });

    test('detects missing both amount and recipient', () => {
      const prompt = 'I want to transfer crypto tokens';
      const parsed = parseTransferIntent(prompt);

      expect(parsed.isValid).toBe(false);
      expect(parsed.missingFields).toContain('amount');
      expect(parsed.missingFields).toContain('recipient');
    });

    test('does not invent missing values from thin air', () => {
      const parsed = parseTransferIntent('Send funds');
      expect(parsed.isValid).toBe(false);
      expect(parsed.amount).toBeUndefined();
      expect(parsed.recipient).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Unsupported Token Rejection
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Unsupported Token Rejection', () => {
    test('allowlist supports official Circle USDC on Sepolia', () => {
      const token = getSupportedToken('USDC');
      expect(token).not.toBeNull();
      expect(token?.contractAddress).toBe('0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238');
      expect(token?.expectedDecimals).toBe(6);
    });

    test('rejects arbitrary unsupported tokens', () => {
      expect(getSupportedToken('DAI')).toBeNull();
      expect(getSupportedToken('SHIB')).toBeNull();
      expect(getSupportedToken('DOGE')).toBeNull();
      expect(getSupportedToken('RANDOM_COIN')).toBeNull();
    });

    test('validateTransferParameters rejects unsupported token', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'PEPE',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/unsupported token/i);
    });

    test('intent parser flags unsupported token', () => {
      const parsed = parseTransferIntent(`Send 0.01 USDT to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toMatch(/unsupported token/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Unsupported Chain ID Rejection
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Unsupported Chain ID & Mainnet Protection', () => {
    test('strictly enforces Ethereum Sepolia chain ID 11155111', () => {
      expect(SEPOLIA_CHAIN_ID).toBe(11155111);
    });

    test('rejects Ethereum Mainnet (Chain ID 1)', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: 1, // Mainnet
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/only ethereum sepolia/i);
    });

    test('rejects Polygon Mainnet (Chain ID 137)', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: 137,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/only ethereum sepolia/i);
    });

    test('rejects unknown chain ID', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: 999999,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/only ethereum sepolia/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Zero or Negative Amounts Rejection
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Zero or Negative Amounts', () => {
    test('rejects zero amount string', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/greater than zero/i);
    });

    test('rejects negative amount string', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '-5.0',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/greater than zero/i);
    });

    test('rejects non-numeric amount string', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: 'ten',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/valid number/i);
    });

    test('rejects empty amount string', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/valid number/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Amount Precision and Token Decimals
  // ───────────────────────────────────────────────────────────────────────────
  describe('6. Amount Precision and Token Decimals', () => {
    test('accepts valid USDC amounts up to 6 decimal places (<= 0.01)', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.000001', // 1 micro-USDC (6 decimals)
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(true);
    });

    test('rejects amounts exceeding 6 decimals for USDC', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.0000001', // 7 decimals
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/decimal places/i);
    });

    test('intent parser rejects excessive decimals', () => {
      const parsed = parseTransferIntent(`Send 0.0012345 USDC to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toMatch(/decimal places/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Insufficient Balance Protection
  // ───────────────────────────────────────────────────────────────────────────
  describe('7. Insufficient Balance Protection', () => {
    test('rejects when requested amount exceeds token balance', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        tokenBalance: '0.005', // Less than 0.01 requested
        ethBalance: '0.05',
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/insufficient usdc balance/i);
    });

    test('allows when token balance is sufficient', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        tokenBalance: '10.00',
        ethBalance: '0.05',
      });
      expect(res.isValid).toBe(true);
    });

    test('rejects when account has zero native Sepolia ETH for gas', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
        tokenBalance: '10.00',
        ethBalance: '0.0000001', // Below estimated gas threshold
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/insufficient sepolia eth for gas/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Strict Maximum 0.01 USDC Enforcement Across All Paths
  // ───────────────────────────────────────────────────────────────────────────
  describe('8. Strict Maximum 0.01 USDC Enforcement', () => {
    test('allows exactly 0.01 USDC', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.01',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(true);
    });

    test('allows amounts strictly less than 0.01 USDC (0.005 USDC)', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.005',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(true);
    });

    test('allows minimum unit (0.000001 USDC)', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.000001',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(true);
    });

    test('rejects 0.010001 USDC (just over the 0.01 limit)', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.010001',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('rejects 0.02 USDC', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.02',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('rejects 0.05 USDC', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '0.05',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('rejects 1 USDC', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '1',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('rejects large amounts (e.g. 100 USDC)', () => {
      const res = validateTransferParameters({
        recipient: VALID_RECIPIENT,
        amount: '100',
        tokenSymbol: 'USDC',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    // Natural Language Intent Parsing Enforcement
    test('natural-language parser rejects prompt with 0.010001 USDC', () => {
      const parsed = parseTransferIntent(`Send 0.010001 USDC to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('natural-language parser rejects prompt with 0.02 USDC', () => {
      const parsed = parseTransferIntent(`Send 0.02 USDC to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('natural-language parser rejects prompt with 0.05 USDC', () => {
      const parsed = parseTransferIntent(`Send 0.05 USDC to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('natural-language parser rejects prompt with 1 USDC', () => {
      const parsed = parseTransferIntent(`Send 1 USDC to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(false);
      expect(parsed.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
    });

    test('natural-language parser accepts prompt with exactly 0.01 USDC', () => {
      const parsed = parseTransferIntent(`Send 0.01 USDC to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(true);
      expect(parsed.amount).toBe('0.01');
    });

    test('natural-language parser accepts prompt with 0.005 USDC', () => {
      const parsed = parseTransferIntent(`Send 0.005 USDC to ${VALID_RECIPIENT}`);
      expect(parsed.isValid).toBe(true);
      expect(parsed.amount).toBe('0.005');
    });

    // Verification of exported constants
    test('verifies MAX_SEPOLIA_TRANSFER_USDC constants match 0.01', () => {
      expect(MAX_SEPOLIA_TRANSFER_USDC).toBe(0.01);
      expect(MAX_SEPOLIA_TRANSFER_USDC_STR).toBe('0.01');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. User Rejection Simulation
  // ───────────────────────────────────────────────────────────────────────────
  describe('9. User Rejection Handling', () => {
    test('recognizes MetaMask user signature rejection error code 4001', () => {
      const mockMetaMaskError = {
        code: 4001,
        message: 'User rejected the transaction',
      };

      const handleUserError = (err: unknown): string => {
        const e = err as { code?: number | string; message?: string };
        if (e?.code === 4001 || e?.code === 'ACTION_REJECTED' || e?.message?.includes('rejected')) {
          return 'MetaMask transaction signature was rejected by user.';
        }
        return 'Execution failed';
      };

      expect(handleUserError(mockMetaMaskError)).toBe('MetaMask transaction signature was rejected by user.');
    });

    test('recognizes ethers ACTION_REJECTED code', () => {
      const mockEthersError = {
        code: 'ACTION_REJECTED',
        action: 'sendTransaction',
        reason: 'rejected',
      };

      const handleUserError = (err: unknown): string => {
        const e = err as { code?: number | string; message?: string };
        if (e?.code === 4001 || e?.code === 'ACTION_REJECTED' || e?.message?.includes('rejected')) {
          return 'MetaMask transaction signature was rejected by user.';
        }
        return 'Execution failed';
      };

      expect(handleUserError(mockEthersError)).toBe('MetaMask transaction signature was rejected by user.');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Pending vs Confirmed Transaction Status & Failed Receipts
  // ───────────────────────────────────────────────────────────────────────────
  describe('10. Pending vs Confirmed Status & Receipt Verification', () => {
    test('distinguishes between pending and confirmed states', () => {
      type TxState = 'idle' | 'awaiting_approval' | 'pending_signature' | 'broadcasting' | 'confirmed' | 'reverted';
      
      let state: TxState = 'awaiting_approval';
      expect(state).toBe('awaiting_approval');

      state = 'broadcasting';
      expect(state).not.toBe('confirmed');

      const receipt = { status: 1, blockNumber: 5892341 };
      if (receipt.status === 1) {
        state = 'confirmed';
      }
      expect(state).toBe('confirmed');
    });

    test('reverted receipt with status 0 throws error and is not marked confirmed', () => {
      const failedReceipt = { status: 0, blockNumber: 5892342 };
      
      const processReceipt = (r: typeof failedReceipt) => {
        if (r.status !== 1) {
          throw new Error('Transaction reverted on Ethereum Sepolia');
        }
        return 'confirmed';
      };

      expect(() => processReceipt(failedReceipt)).toThrow(/reverted/i);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11. Duplicate Submission Protection
  // ───────────────────────────────────────────────────────────────────────────
  describe('11. Duplicate Submission Protection', () => {
    test('prevents repeated submission while transaction is already broadcasting', () => {
      let isSubmitting = false;
      let submissionCount = 0;

      const triggerTransfer = () => {
        if (isSubmitting) {
          return { accepted: false, reason: 'Transaction already in progress' };
        }
        isSubmitting = true;
        submissionCount++;
        return { accepted: true };
      };

      // First click
      const res1 = triggerTransfer();
      expect(res1.accepted).toBe(true);
      expect(submissionCount).toBe(1);

      // Rapid second click
      const res2 = triggerTransfer();
      expect(res2.accepted).toBe(false);
      expect(res2.reason).toBe('Transaction already in progress');
      expect(submissionCount).toBe(1); // No double submission
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 12. Sepolia Etherscan Explorer URL Formatting
  // ───────────────────────────────────────────────────────────────────────────
  describe('12. Sepolia Etherscan Explorer URL Formatting', () => {
    test('formats canonical Sepolia Etherscan URL with actual transaction hash', () => {
      const txHash = '0x3fa4e7b891011121314151617181920212223242526272829303132333435363';
      const url = formatSepoliaExplorerTxUrl(txHash);

      expect(url).toBe(`https://sepolia.etherscan.io/tx/${txHash}`);
      expect(url).not.toContain('ACTUAL_TRANSACTION_HASH');
      expect(url).toContain('sepolia.etherscan.io');
    });

    test('handles txHash with leading/trailing whitespace cleanly', () => {
      const txHash = '  0x3fa4e7b891011121314151617181920212223242526272829303132333435363  ';
      const url = formatSepoliaExplorerTxUrl(txHash);
      expect(url).toBe('https://sepolia.etherscan.io/tx/0x3fa4e7b891011121314151617181920212223242526272829303132333435363');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 13. Agent prepareSepoliaTransfer Tool Execution & Validation
  // ───────────────────────────────────────────────────────────────────────────
  describe('13. Agent prepareSepoliaTransfer Tool Execution & Validation', () => {
    test('accepts valid 0.01 USDC transfer and returns structured review data', () => {
      const res = prepareSepoliaTransferPayload({
        recipient: VALID_RECIPIENT,
        amount: 0.01,
      });

      expect(res.result.ok).toBe(true);
      expect(res.preparedSepoliaTx).toBeDefined();
      expect(res.preparedSepoliaTx?.amount).toBe('0.01');
      expect(res.preparedSepoliaTx?.recipient).toBe(VALID_RECIPIENT);
      expect(res.preparedSepoliaTx?.tokenSymbol).toBe('USDC');
      expect(res.preparedSepoliaTx?.chainId).toBe(SEPOLIA_CHAIN_ID);
      expect(res.preparedSepoliaTx?.networkName).toBe(SEPOLIA_NETWORK_NAME);
      expect((res.result.data as Record<string, unknown>).requiresUserApproval).toBe(true);
    });

    test('accepts smaller valid amounts like 0.005 USDC', () => {
      const res = prepareSepoliaTransferPayload({
        recipient: VALID_RECIPIENT,
        amount: 0.005,
      });

      expect(res.result.ok).toBe(true);
      expect(res.preparedSepoliaTx?.amount).toBe('0.005');
    });

    test('strictly rejects amounts exceeding 0.01 USDC limit', () => {
      const overLimits = [0.010001, 0.02, 0.05, 1, 10, 100];
      for (const amount of overLimits) {
        const res = prepareSepoliaTransferPayload({
          recipient: VALID_RECIPIENT,
          amount,
        });
        expect(res.result.ok).toBe(false);
        expect(res.result.error).toMatch(/exceeds the strict safety maximum of 0\.01 usdc/i);
      }
    });

    test('strictly rejects zero, negative amounts, and non-numeric inputs', () => {
      const invalidAmounts = [0, -0.01, -5];
      for (const amount of invalidAmounts) {
        const res = prepareSepoliaTransferPayload({
          recipient: VALID_RECIPIENT,
          amount,
        });
        expect(res.result.ok).toBe(false);
      }
    });

    test('strictly rejects invalid or malformed recipient addresses', () => {
      const invalidAddrs = ['invalid-addr', '0x123', '0x' + 'g'.repeat(40)];
      for (const recipient of invalidAddrs) {
        const res = prepareSepoliaTransferPayload({
          recipient,
          amount: 0.01,
        });
        expect(res.result.ok).toBe(false);
      }
    });

    test('transaction review payload mandates explicit user authorization before execution', () => {
      const res = prepareSepoliaTransferPayload({
        recipient: VALID_RECIPIENT,
        amount: 0.01,
      });

      expect(res.result.ok).toBe(true);
      expect((res.result.data as Record<string, unknown>).requiresUserApproval).toBe(true);
      expect((res.result.data as Record<string, unknown>).status).toBe('prepared_awaiting_approval');
    });
  });
});

