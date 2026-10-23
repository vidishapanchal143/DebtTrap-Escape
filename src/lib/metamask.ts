// src/lib/metamask.ts
import { ethers } from "ethers";
import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_CHAIN_ID_HEX,
  SEPOLIA_NETWORK_NAME,
  MAX_SEPOLIA_TRANSFER_USDC_STR,
  SUPPORTED_TOKENS,
  ERC20_ABI,
  validateTransferParameters,
} from "./sepolia-config";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_NETWORK_NAME,
  BASE_SEPOLIA_RPC_URL,
  BASE_SEPOLIA_EXPLORER_BASE,
  MAX_BASE_SEPOLIA_TRANSFER_ETH_STR,
  validateBaseSepoliaTransferParameters,
} from "./base-sepolia-config";

// Type definition for Ethereum window object
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

export interface MetaMaskAccountState {
  isInstalled: boolean;
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isSepolia: boolean;
  ethBalance: string;
  tokenBalance: string;
  tokenSymbol: string;
  tokenDecimals: number;
  error: string | null;
}

export function isMetaMaskAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export function getInjectedProvider(): ethers.BrowserProvider | null {
  if (!isMetaMaskAvailable()) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Request account connection through MetaMask
 */
export async function connectMetaMask(): Promise<{ address: string; chainId: number }> {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not installed or available in this browser. Please install the MetaMask extension.");
  }

  const provider = getInjectedProvider()!;
  const accounts: string[] = await provider.send("eth_requestAccounts", []);
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts found. Please unlock your MetaMask wallet.");
  }

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);

  return {
    address: ethers.getAddress(accounts[0]),
    chainId,
  };
}

/**
 * Request network switch to Ethereum Sepolia (Chain ID 11155111 / 0xaa36a7)
 */
export async function switchNetworkToSepolia(): Promise<boolean> {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not available.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    // Error code 4902 indicates chain has not been added to MetaMask
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: SEPOLIA_NETWORK_NAME,
            nativeCurrency: { name: "Sepolia ETH", symbol: "SEP", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
      return true;
    }
    if (err.code === 4001) {
      throw new Error("Network switch to Ethereum Sepolia was rejected by user.");
    }
    throw error;
  }
}

/**
 * Read genuine on-chain balances and token metadata from Sepolia
 */
export async function readSepoliaAccountState(userAddress: string): Promise<{
  ethBalance: string;
  tokenBalance: string;
  tokenSymbol: string;
  tokenDecimals: number;
  chainId: number;
  isSepolia: boolean;
}> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("Browser wallet provider is unavailable.");
  }

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const isSepolia = chainId === SEPOLIA_CHAIN_ID;

  if (!isSepolia) {
    return {
      ethBalance: "0.00",
      tokenBalance: "0.00",
      tokenSymbol: "USDC",
      tokenDecimals: 6,
      chainId,
      isSepolia: false,
    };
  }

  // 1. Read Native Sepolia ETH Balance
  const ethBalanceWei = await provider.getBalance(userAddress);
  const ethBalance = parseFloat(ethers.formatEther(ethBalanceWei)).toFixed(4);

  // 2. Read Token Metadata and Balance from Contract
  const usdcConfig = SUPPORTED_TOKENS.USDC;
  const tokenContract = new ethers.Contract(usdcConfig.contractAddress, ERC20_ABI, provider);

  let tokenBalance = "0.00";
  let tokenSymbol = usdcConfig.symbol;
  let tokenDecimals = usdcConfig.expectedDecimals;

  try {
    const [rawBalance, onChainSymbol, onChainDecimals] = await Promise.all([
      tokenContract.balanceOf(userAddress),
      tokenContract.symbol().catch(() => usdcConfig.symbol),
      tokenContract.decimals().catch(() => usdcConfig.expectedDecimals),
    ]);

    tokenSymbol = onChainSymbol;
    tokenDecimals = Number(onChainDecimals);
    tokenBalance = ethers.formatUnits(rawBalance, tokenDecimals);
  } catch (contractErr) {
    console.warn("Could not read on-chain token balance:", contractErr);
  }

  return {
    ethBalance,
    tokenBalance,
    tokenSymbol,
    tokenDecimals,
    chainId,
    isSepolia: true,
  };
}

/**
 * Estimate gas for ERC-20 transfer
 */
export async function estimateSepoliaTransferGas(
  recipient: string,
  amount: string
): Promise<string> {
  const provider = getInjectedProvider();
  if (!provider) return "~0.000035";

  try {
    const signer = await provider.getSigner();
    const usdcConfig = SUPPORTED_TOKENS.USDC;
    const tokenContract = new ethers.Contract(usdcConfig.contractAddress, ERC20_ABI, signer);
    const parsedAmount = ethers.parseUnits(amount, usdcConfig.expectedDecimals);

    const gasUnits = await tokenContract.transfer.estimateGas(recipient, parsedAmount);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || BigInt(0);
    const totalCostWei = gasUnits * gasPrice;

    return parseFloat(ethers.formatEther(totalCostWei)).toFixed(6);
  } catch {
    return "~0.000035";
  }
}

/**
 * Execute actual ERC-20 token transfer on Ethereum Sepolia
 */
export async function executeSepoliaTransfer(
  recipient: string,
  amount: string,
  onTxHash?: (hash: string) => void
): Promise<{
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  status: "confirmed" | "reverted";
}> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("MetaMask is not available.");
  }

  // 1. Verify Network
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(`Connected to chain ID ${chainId}. Only Ethereum Sepolia (11155111) is allowed for transfers.`);
  }

  // 2. Validate Parameters
  const validation = validateTransferParameters({
    recipient,
    amount,
    tokenSymbol: "USDC",
    chainId: SEPOLIA_CHAIN_ID,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid transfer parameters.");
  }

  // 3. Connect Signer & Contract
  const signer = await provider.getSigner();
  const usdcConfig = SUPPORTED_TOKENS.USDC;
  const tokenContract = new ethers.Contract(usdcConfig.contractAddress, ERC20_ABI, signer);

  // 4. Encode Amount & strictly enforce maximum 0.01 USDC immediately before MetaMask signing
  const parsedAmount = ethers.parseUnits(amount, usdcConfig.expectedDecimals);
  const maxAllowedUnits = ethers.parseUnits(MAX_SEPOLIA_TRANSFER_USDC_STR, usdcConfig.expectedDecimals);
  if (parsedAmount > maxAllowedUnits) {
    throw new Error(
      `Safety guard blocked transaction: amount ${amount} USDC exceeds strict maximum of ${MAX_SEPOLIA_TRANSFER_USDC_STR} USDC. Amounts above 0.01 USDC are prohibited.`
    );
  }

  // 5. Send Transaction (triggers MetaMask signature popup)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tx: any;
  try {
    tx = await tokenContract.transfer(validation.normalizedRecipient!, parsedAmount);
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    if (anyErr?.code === 4001 || anyErr?.code === "ACTION_REJECTED" || anyErr?.message?.includes("rejected")) {
      throw new Error("MetaMask transaction signature was rejected by user.");
    }
    if (anyErr?.message?.includes("insufficient funds")) {
      throw new Error("Insufficient Sepolia ETH to cover gas fees for this transfer.");
    }
    throw new Error(anyErr?.message || "Failed to broadcast transaction to Ethereum Sepolia.");
  }

  if (onTxHash && tx.hash) {
    onTxHash(tx.hash);
  }

  // 6. Wait for on-chain block receipt confirmation
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transaction was broadcast, but no confirmation receipt was returned.");
  }

  if (receipt.status !== 1) {
    throw new Error(`Transaction reverted on Ethereum Sepolia (Status: 0, Tx: ${tx.hash}).`);
  }

  return {
    txHash: receipt.hash || tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "0",
    status: "confirmed",
  };
}

/**
 * Request network switch to Base Sepolia (Chain ID 84532 / 0x14a34)
 */
export async function switchNetworkToBaseSepolia(): Promise<boolean> {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not available. Please install MetaMask to switch networks.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any;
    // Error code 4902 indicates chain has not been added to MetaMask
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
            chainName: BASE_SEPOLIA_NETWORK_NAME,
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [BASE_SEPOLIA_RPC_URL],
            blockExplorerUrls: [BASE_SEPOLIA_EXPLORER_BASE],
          },
        ],
      });
      return true;
    }
    if (err.code === 4001) {
      throw new Error("Network switch to Base Sepolia was rejected by user.");
    }
    throw error;
  }
}

/**
 * Read genuine on-chain native ETH balance on Base Sepolia
 */
export async function readBaseSepoliaAccountState(userAddress: string): Promise<{
  ethBalance: string;
  chainId: number;
  isBaseSepolia: boolean;
}> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("Browser wallet provider is unavailable.");
  }

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  const isBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID;

  if (!isBaseSepolia) {
    return {
      ethBalance: "0.00",
      chainId,
      isBaseSepolia: false,
    };
  }

  // Read native Base Sepolia ETH balance
  const ethBalanceWei = await provider.getBalance(userAddress);
  const ethBalance = parseFloat(ethers.formatEther(ethBalanceWei)).toFixed(4);

  return {
    ethBalance,
    chainId,
    isBaseSepolia: true,
  };
}

/**
 * Estimate gas for Base Sepolia native ETH transfer
 */
export async function estimateBaseSepoliaTransferGas(
  recipient: string,
  amountEth: string
): Promise<string> {
  const provider = getInjectedProvider();
  if (!provider) return "~0.000021";

  try {
    const signer = await provider.getSigner();
    const parsedAmount = ethers.parseEther(amountEth || "0.001");
    const gasUnits = await signer.estimateGas({
      to: recipient,
      value: parsedAmount,
    });
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || BigInt(0);
    const totalCostWei = gasUnits * gasPrice;

    return parseFloat(ethers.formatEther(totalCostWei)).toFixed(6);
  } catch {
    return "~0.000021";
  }
}

/**
 * Execute genuine native ETH transfer on Base Sepolia testnet
 */
export async function executeBaseSepoliaEthTransfer(
  recipient: string,
  amount: string,
  onTxHash?: (hash: string) => void
): Promise<{
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  status: "confirmed" | "reverted";
}> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("MetaMask is not available.");
  }

  // 1. Verify Network
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error(`Connected to chain ID ${chainId}. Only Base Sepolia (84532) is allowed for this transfer.`);
  }

  // 2. Validate Parameters
  const validation = validateBaseSepoliaTransferParameters({
    recipient,
    amount,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || "Invalid transfer parameters.");
  }

  // 3. Connect Signer
  const signer = await provider.getSigner();

  // 4. Encode Amount & strictly enforce safety cap immediately before MetaMask signing
  const parsedAmountWei = ethers.parseEther(amount);
  const maxAllowedWei = ethers.parseEther(MAX_BASE_SEPOLIA_TRANSFER_ETH_STR);
  if (parsedAmountWei > maxAllowedWei) {
    throw new Error(
      `Safety guard blocked transaction: amount ${amount} ETH exceeds strict maximum of ${MAX_BASE_SEPOLIA_TRANSFER_ETH_STR} ETH on Base Sepolia.`
    );
  }

  // 5. Send Native ETH Transaction (triggers MetaMask signature popup)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tx: any;
  try {
    tx = await signer.sendTransaction({
      to: validation.normalizedRecipient!,
      value: parsedAmountWei,
    });
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any;
    if (anyErr?.code === 4001 || anyErr?.code === "ACTION_REJECTED" || anyErr?.message?.includes("rejected")) {
      throw new Error("MetaMask transaction signature was rejected by user.");
    }
    if (anyErr?.message?.includes("insufficient funds")) {
      throw new Error("Insufficient Base Sepolia ETH to cover amount and gas fees.");
    }
    throw new Error(anyErr?.message || "Failed to broadcast transaction to Base Sepolia.");
  }

  if (onTxHash && tx.hash) {
    onTxHash(tx.hash);
  }

  // 6. Wait for on-chain block receipt confirmation
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error("Transaction was broadcast, but no confirmation receipt was returned.");
  }

  if (receipt.status !== 1) {
    throw new Error(`Transaction reverted on Base Sepolia (Status: 0, Tx: ${tx.hash}).`);
  }

  return {
    txHash: receipt.hash || tx.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : "21000",
    status: "confirmed",
  };
}
