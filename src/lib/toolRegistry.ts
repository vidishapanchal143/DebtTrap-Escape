// src/lib/toolRegistry.ts
import { calculateLoanCost, compareLoanOffers, assessAffordability, analyzeCryptoCollateralRisk, detectLoanRedFlags } from './agentTools';

export const toolRegistry = {
  calculateLoanCost,
  compareLoanOffers,
  assessAffordability,
  analyzeCryptoCollateralRisk,
  detectLoanRedFlags,
};

export type ToolName = keyof typeof toolRegistry;
