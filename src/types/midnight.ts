export type AgentTaskStatus =
  | "idle"
  | "planning"
  | "running"
  | "needs_input"
  | "awaiting_approval"
  | "completed"
  | "error";

export type AgentFlowState =
  | "welcoming"
  | "idle"
  | "attentive"
  | "collecting_input"
  | "needs_clarification"
  | "reviewing"
  | "running"
  | "awaiting_approval"
  | "result_ready"
  | "answering_question"
  | "error";

export type TaskType =
  | "loan_cost"
  | "compare_offers"
  | "affordability"
  | "crypto_risk"
  | "red_flags"
  | "doc_review"
  | "evidence_hash"
  | "wallet_transfer";

export interface ToolExecutionEvent {
  name: string;
  status: "completed" | "failed";
  summary: string;
  timestamp?: string;
}

export interface PreparedTransferInfo {
  recipient: string;
  amountCents: number;
  feeCents: number;
  totalDebit: number;
  idempotencyKey: string;
  asset?: string;
  network?: string;
  note?: string;
  disclaimer?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: string;
  toolEvents?: ToolExecutionEvent[];
  preparedTx?: PreparedTransferInfo | null;
  confirmedTxId?: string;
  isError?: boolean;
}

export interface LoanCalcSummary {
  principal: number;
  annualRate: number;
  termMonths: number;
  upfrontFee: number;
  netDisbursed: number;
  monthlyEmi: number;
  totalInstallments: number;
  totalInterest: number;
  totalOutflow: number;
  additionalCost: number;
  assumptions: string[];
}

export interface OfferComparisonResult {
  principal: number;
  termMonths: number;
  offerA: {
    rate: number;
    fee: number;
    emi: number;
    totalInterest: number;
    totalOutflow: number;
  };
  offerB: {
    rate: number;
    fee: number;
    emi: number;
    totalInterest: number;
    totalOutflow: number;
  };
  difference: number;
  cheaperOffer: "A" | "B" | "equal";
  assumptions: string[];
}

export interface AffordabilityResult {
  income: number;
  expenses: number;
  existingEmis: number;
  newEmi: number;
  totalEmis: number;
  emiToIncomeRatio: number;
  disposableLeftover: number;
  isAffordableIndicator: boolean;
  limitations: string[];
}

export interface CryptoRiskResult {
  collateralQuantity: number;
  collateralPriceUsd: number;
  loanAmountUsdc: number;
  liquidationThresholdPercent: number;
  collateralValueUsd: number;
  loanToValuePercent: number;
  estimatedLiquidationPriceUsd: number;
  priceDropToThresholdPercent: number;
  risk: "Low" | "Medium" | "High";
  thresholdReached: boolean;
  stressTests: Array<{
    assumedPriceDropPercent: number;
    stressedCollateralPriceUsd: number;
    stressedLoanToValuePercent: number;
    assumedThresholdReached: boolean;
  }>;
  assumptions: string[];
}

export interface RedFlagsResult {
  verifiedFlags: Array<{
    signal: string;
    label: string;
    severity: "high" | "medium";
    evidenceQuote: string;
    reason: string;
    nextStep: string;
  }>;
  checkedTextLength: number;
  countVerified: number;
  limitations: string[];
}

export interface EvidenceHashResult {
  fileName: string;
  fileSizeBytes: number;
  sha256Hash: string;
  comparisonFileName?: string;
  comparisonHash?: string;
  isMatch?: boolean;
  registryContractAddress: string;
}

export interface DocumentReviewResult {
  totalClausesChecked: number;
  totalRequiredClauses: number;
  checkedClauses: string[];
  missingClauses: string[];
  isFullyDisclosed: boolean;
  documentExcerpt?: string;
  flaggedConcerns: string[];
  recommendations: string[];
  limitations: string[];
}

export interface SepoliaTransferParams {
  recipient: string;
  amount: string;
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  senderAddress: string;
  chainId: number;
  networkName: string;
  estimatedGasEth?: string;
  rawPrompt?: string;
}

export interface SepoliaTransferResult {
  txHash: string;
  blockNumber?: number;
  recipient: string;
  amount: string;
  tokenSymbol: string;
  tokenAddress: string;
  senderAddress: string;
  chainId: number;
  networkName: string;
  explorerUrl: string;
  status: "confirmed" | "reverted";
  gasUsed?: string;
  timestamp: string;
  isTestnet: boolean;
}

export interface BaseSepoliaTransferParams {
  recipient: string;
  amount: string;
  tokenSymbol: "ETH";
  senderAddress: string;
  chainId: number;
  networkName: string;
  rpcUrl: string;
  estimatedGasEth?: string;
  rawPrompt?: string;
}

export interface BaseSepoliaTransferResult {
  txHash: string;
  blockNumber?: number;
  recipient: string;
  amount: string;
  tokenSymbol: "ETH";
  senderAddress: string;
  chainId: number;
  networkName: string;
  explorerUrl: string;
  status: "confirmed" | "reverted";
  gasUsed?: string;
  timestamp: string;
  isTestnet: boolean;
}

export interface TaskResultContext {
  taskType: TaskType;
  title: string;
  timestamp: string;
  inputs: Record<string, unknown>;
  loanCalc?: LoanCalcSummary;
  comparison?: OfferComparisonResult;
  affordability?: AffordabilityResult;
  cryptoRisk?: CryptoRiskResult;
  redFlags?: RedFlagsResult;
  docReview?: DocumentReviewResult;
  evidenceHash?: EvidenceHashResult;
  preparedTransfer?: PreparedTransferInfo;
  confirmedTxId?: string;
  preparedSepoliaTx?: SepoliaTransferParams;
  sepoliaTransfer?: SepoliaTransferResult;
  preparedBaseSepoliaTx?: BaseSepoliaTransferParams;
  baseSepoliaTransfer?: BaseSepoliaTransferResult;
  summaryText: string;
  suggestedQuestions: string[];
}

export interface RecentSession {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  category: "loan" | "compare" | "wallet" | "crypto" | "warning";
  payload?: {
    amount?: string;
    rate?: string;
    months?: string;
    fee?: string;
    prompt?: string;
  };
}

export type MidnightNavSection =
  | "workspace"
  | "guided-review"
  | "loan-calc"
  | "compare"
  | "crypto"
  | "document-review"
  | "evidence"
  | "wallet";
