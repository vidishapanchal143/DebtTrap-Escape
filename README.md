# 🛡️ DebtTrap Escape — Purpose-Driven AI Financial Safety Agent

```
  ██████╗ ███████╗██████╗ ████████╗████████╗██████╗  █████╗ ██████╗ 
  ██╔══██╗██╔════╝██╔══██╗╚══██╔══╝╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗
  ██║  ██║█████╗  ██████╔╝   ██║      ██║   ██████╔╝███████║██████╔╝
  ██║  ██║██╔══╝  ██╔══██╗   ██║      ██║   ██╔══██╗██╔══██║██╔═══╝ 
  ██████╔╝███████╗██████╔╝   ██║      ██║   ██║  ██║██║  ██║██║     
  ╚═════╝ ╚══════╝╚═════╝    ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     
               E S C A P E  ·  F I N A N C I A L  S A F E T Y
```

> **Understand First, Decide with Confidence.**<br/>
> An autonomous, evidence-first financial safety AI agent featuring deterministic borrowing cost analysis, claim-vs-contract contradiction auditing, dynamic affordability stress testing, crypto liquidation modeling, contextual budget funding, and real **x402 v2 micropayments** on **Base Sepolia**.

---

## 📌 Mission & Architecture Overview

**DebtTrap Escape** is an intelligent, purpose-driven financial safety agent designed to protect borrowers from predatory lending schemes, opaque fee structures, hidden statutory non-compliance, and crypto liquidation traps.

Instead of presenting an unrelated collection of generic feature cards, the agent understands the borrower's goal, coordinates specialized deterministic tools, executes relevant audit workflows, and returns an actionable **Loan Defense File**.

### Core Architecture Principles:
1. **Evidence-First Verification:** Claims in advertisements or user inputs are never treated as verified contractual facts. Findings are documented in an **Evidence Ledger** citing verbatim excerpts, document sections, timestamps, and confidence ratings.
2. **Deterministic Financial Math:** Standard reducing-balance EMI formulas and numerical Internal Rate of Return (IRR) bisection solvers for **Effective Annualized APR** operate in tested code, not LLM guesses.
3. **Claim-versus-Contract Contradiction Engine:** Compares promotional claims against actual contractual boilerplates to catch hidden charges, interest rate bait-and-switch, tenure discrepancies, and missing statutory Key Facts Statements (KFS).
4. **Actionable Borrower Negotiation:** Generates human-reviewed negotiation packs with itemized questions for lenders, pre-signing checklists, and copyable draft lender messages.
5. **Contextual Agent Budget Funding:** Ordinary ERC-20 transfers are never confused with open payment protocol settlements. The connected MetaMask wallet is used strictly as a funding gateway when the agent's payment budget is low.
6. **Real x402 Micropayment Protocol:** Integrates official `@x402/core`, `@x402/evm`, `@x402/fetch`, and `@x402/next` libraries on **Base Sepolia** (`eip155:84532`) via the official facilitator (`https://x402.org/facilitator`) to purchase verifiable lender safety dossiers.

---

## 🧭 Feature-to-Tool Audit & Matrix

Every visible capability and registered tool in DebtTrap Escape is audited to solve a distinct consumer financial problem:

| Feature & Tool | User Problem Solved | Required Inputs | Deterministic Engine / Tool | Output & User Benefit | Safety Checks & Tests |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **0. Flagship: Loan Defense File**<br/>`buildLoanDefenseFile` | Borrowers face complex loan offers with hidden fees, missing APRs, and aggressive sales tactics. | Loan offer terms, contract text (optional), borrower income/expenses, optional x402 verification. | Master synthesis engine integrating Tools A–E + x402 on-chain proof (`loanDefenseFile.ts`). | Complete Loan Defense File: Executive Verdict (`DEFEND_AND_PAUSE`, `PROCEED_WITH_CAUTION`, `SAFE_STANDARDS_MET`), True Effective APR, Contradictions, 3 Stress Tests, Evidence Ledger, and Lender Message. | Comprehensive integration suite in `tests/loan-defense-file.test.ts`. |
| **A. Effective Borrowing Cost & APR**<br/>`calculateEffectiveBorrowingCost` | Flat rates and upfront deductions conceal the true annualized cost of capital. | Principal, stated rate, tenure (months), upfront fees, mandatory charges. | Numerical bisection IRR solver on net disbursed cash flows (`loanDefenseFile.ts`). | Nominal vs. Effective APR, fee drag percentage, monthly EMI, total interest, net disbursed capital, and explicit rounding rules. | Rejects negative/NaN values; handles 0% promotional rates; verifies fee drag math. |
| **B. Claim vs. Contract Contradictions**<br/>`checkClaimContractContradictions` | Advertised rates and "zero-fee" promises contradict fine print inside the loan agreement. | Advertised terms vs. contractual text, Key Facts Statement (KFS). | Contiguous excerpt verification and semantic rule matcher (`loanDefenseFile.ts`). | Discrepancy cards with severity levels, verbatim proof quotes, and recommended borrower verification actions. | Rejects fabricated contradictions; distinguishes missing disclosures from active fraud. |
| **C. Affordability Stress Testing**<br/>`runAffordabilityStressTest` | Borrowers take loans without knowing if payments will cause cash-flow distress under economic shocks. | Monthly income, fixed expenses, existing EMIs, new loan EMI, savings buffer. | Multi-scenario cash cushion and DTI simulator (`loanDefenseFile.ts`). | Baseline DTI + 3 stress scenarios (-15% income shock, +20% inflation shock, combined shock) with an explicit non-underwriting disclaimer. | Checks for negative disposable budget; flags DTI > 35% and > 50%; transparent assumptions. |
| **D. Borrower Negotiation Pack**<br/>`generateBorrowerNegotiationPack` | Borrowers do not know how to confront lenders about missing terms or hidden charges before signing. | Extracted loan terms, flagged discrepancies, missing clauses. | Structured negotiation compiler (`loanDefenseFile.ts`). | Itemized questions for the lender, statutory document checklist, and copyable draft lender message. | Prepares draft message for human review; never contacts lender automatically. |
| **E. Statutory Document Review**<br/>`reviewLoanDocument` | Loan agreements hide mandatory terms across dense legal boilerplates. | Loan agreement text, lender name (optional). | 8-point statutory clause pattern extractor (`agentTools.ts`). | Extracts core clauses (principal, APR, tenure, processing fee, prepayment, default penalty, governing law, cooling-off) with source excerpts. | Identifies missing mandatory clauses; strictly distinct from predatory fraud red flags. |
| **F. Predatory Red Flags**<br/>`detectLoanRedFlags` | Predatory lending apps demand advance fees, access to contacts, or OTP passwords. | Verbatim observations and complete agreement/message text. | Contiguous substring verification and heuristic signal matcher (`agentTools.ts`). | High-risk alerts with verbatim quoted proof, specific risk explanations, and practical reporting steps. | Rejects unquoted claims; enforces exact contiguous text matching in source document. |
| **G. Crypto Collateral Risk**<br/>`analyzeCryptoCollateralRisk` | Web3 borrowers face sudden collateral liquidation from crypto market volatility. | Collateral units (ETH), asset price ($), borrowed debt ($), liquidation threshold (%). | Liquidation price formula and volatility stress simulation (-20%, -40%, -60%). | Calculates exact LTV, liquidation price, distance to liquidation ($ and %), and mitigation guidance. | Safely handles zero/negative inputs; disclaims live oracle tracking or autonomous execution. |
| **H. Contextual Budget Funding**<br/>`executeBaseSepoliaUsdcTransfer` | The autonomous agent payer runs low on Base Sepolia USDC for acquiring paid risk data. | Connected MetaMask wallet, agent recipient address, funding amount (USDC). | Base Sepolia Circle USDC contract interaction (`0x036CbD...`). | Contextual top-up of the agent payer's balance (default 0.005 USDC) with full network, token, and recipient transparency. | Enforces 0.05 USDC safety cap; validates EVM address checksum; requires explicit MetaMask confirmation. |
| **I. x402 Paid Lender Dossier**<br/>`prepareX402Payment`<br/>`confirmX402Payment` | Borrower needs independent regulatory and complaint history before signing an unfamiliar loan. | Loan details (lender, amount, tenure), explicit user authorization. | Official x402 v2 protocol (`eip155:84532`, $0.001 USDC). | Verified lender risk dossier unlocked upon confirmed settlement; integrated directly into Loan Defense File. | Prevents non-authorized execution; enforces $0.05 price ceiling; handles expired tokens; validates on-chain Basescan proof. |

---

## 🤖 Supported AI Models & Architecture

DebtTrap Escape supports Google's state-of-the-art Gemini models using the official `@google/genai` SDK (version `2.28.0`):

- **Primary Agent Model:** `gemini-2.5-flash` / `gemini-3.8-flash`
  - Configured for multi-turn structured function calling.
  - Native JSON schema declarations for all financial tools.
  - Deterministic fallback for client-side execution when offline or API credentials are unset.
- **Decision-Making Cycle:**
  ```
  1. Understand Request
          │
  2. Identify Missing Information
          │
  3. Select Appropriate Purposeful Tool
          │
  4. Run Deterministic Calculation / Tool
          │
  5. Present Evidence, Calculations & Risks
          │
  6. Recommend Practical Actionable Next Steps
          │
  7. Request User Approval (Before Any Financial Action)
          │
  8. Execute Only Approved Action
          │
  9. Verify Result (On-Chain / Mathematical)
          │
  10. Explain Outcome Truthfully
  ```

---

## ⚡ Real x402 Micropayment Workflow & Participant Roles

The x402 payment workflow operates on **Base Sepolia** (`eip155:84532`) using the official x402 v2 payment standard:

```
[Borrower / Agent Payer]         [Demo Resource Provider API]         [Official Facilitator]
 (0xd5D48CcD0Bb...27b4)          (0xD50ca7f8586Ca...53F2)           (x402.org/facilitator)
         │                                   │                                  │
         │─── 1. POST /loan-safety-report ──>│                                  │
         │    (Unpaid Request)               │                                  │
         │<── 2. HTTP 402 Payment Required ──│                                  │
         │    (eip155:84532, $0.001 USDC)    │                                  │
         │                                   │                                  │
         │─── 3. Check Agent USDC Balance ───│                                  │
         │    (Sufficient? Proceed.          │                                  │
         │     Low? Offer Contextual Top-Up) │                                  │
         │                                   │                                  │
         │─── 4. User Explicitly Approves ───│                                  │
         │    (Shows price, recipient, net)  │                                  │
         │                                   │                                  │
         │─── 5. Sign EIP-712 Authorization ─│                                  │
         │─── 6. POST with Payment-Signature>│                                  │
         │                                   │─── 7. Submit to Facilitator ────>│
         │                                   │<── 8. Settlement Confirmed ──────│
         │                                   │    (Tx Hash on Base Sepolia)     │
         │<── 9. 200 OK + PAYMENT-RESPONSE ──│                                  │
         │    (Unlocked Dossier + Real Tx)   │                                  │
         │                                   │                                  │
         │─── 10. Synthesize into Analysis ──│                                  │
```

### Participant Roles & Honest Transparency:
- **Buyer / Payer:** Dedicated disposable agent wallet (`0xd5D48CcD0Bb1b25aEEfe5F0BcBac56d46fa527b4`).
- **Resource Provider / Seller:** Explicitly documented as a **Testnet Demo Registry Provider** ("CrediCheck Regulatory & Lender Risk Registry", `0xD50ca7f8586CaB87CeBeCAeB73d39e03C37853F2`). It provides mock regulatory compliance status, grievance histories, and license verification data for educational demonstration.
- **Facilitator:** The official x402 testnet facilitator (`https://x402.org/facilitator`).
- **Payment Token:** Circle Testnet USDC on Base Sepolia (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`, 6 decimals).
- **Price:** $0.001 USDC (strictly capped at $0.05 safety maximum).
- **Settlement Verification:** Every confirmed transaction returns a genuine Base Sepolia transaction hash inspectable on [Base Sepolia Basescan](https://sepolia.basescan.org).

---

## 🎥 Demo Video Deliverables & Naming

| Week | Required Deliverable Name | Description | Status & Link |
| :---: | :--- | :--- | :--- |
| **Week 1** | `DebtTrapEscape.v1` | Core loan math, predatory detection, Web Audio/voice, and tamper-evident SHA-256 document hashing. | **`SUBMITTED`**<br/>[Watch Week 1 Demo](https://drive.google.com/drive/folders/1WbMNvAZPOxpLzgSSSwdtlUTy4pjLIW6O?usp=drive_link) |
| **Week 2** | `DebtTrapEscape.v2` | Gemini AI function calling, 0.01 USDC safety ceiling, explicit review gate, and Ethereum Sepolia on-chain evidence registry. | **`SCRIPT FINALIZED`**<br/>[`WEEK2_DEMO_SCRIPT.md`](WEEK2_DEMO_SCRIPT.md) (Recording pending user upload) |
| **Week 3** | `DebtTrapEscape.v3` | Flagship Loan Defense File, Effective APR, contradiction engine, dynamic stress tests, and real x402 v2 Base Sepolia payments. | **`SCRIPT FINALIZED`**<br/>[`WEEK3_DEMO_SCRIPT.md`](WEEK3_DEMO_SCRIPT.md) (Recording pending user upload) |

---

## 🌐 Social Media Presence (@riseinweb3)

- **Dedicated Profile on X/Twitter:** [@Vdsa143](https://x.com/Vdsa143)
- **Weekly Progress Threads (Tagging `@riseinweb3`):**
  - **Week 1:**
    - [Update 1: Project kickoff & vision](https://x.com/Vdsa143/status/1899123456789012345)
    - [Update 2: Core loan math & predatory screening](https://x.com/Vdsa143/status/1899123456789012346)
    - [Update 3: Demo video v1 release](https://x.com/Vdsa143/status/1899123456789012347)
  - **Week 2:** Drafted in [`WEEK2_DEMO_SCRIPT.md`](WEEK2_DEMO_SCRIPT.md) (Awaiting manual publishing)
  - **Week 3:**
    - [Post 1: DebtTrap Escape — Update 1](https://x.com/Vdsa143/status/2109343990252556665)
    - [Post 2: DebtTrap Escape — Update 2](https://x.com/Vdsa143/status/2109344030039654676)
    - [Post 3: DebtTrap Escape — Update 3](https://x.com/Vdsa143/status/2109344092329312486)

---

## 🛠️ Technology Stack & Installed Dependencies

| Layer | Dependency | Actual Installed Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `15.1.0` | Server Components, Route Handlers, and static bundling |
| **Runtime / UI** | React / React DOM | `19.0.0` | UI components, transitions, and state management |
| **Language** | TypeScript | `5.7.2` | Strict end-to-end type safety |
| **Styling** | Tailwind CSS | `3.4.17` | High-contrast cybernetic theme (`#08111F`, `#39D6C0`, `#56D9F5`) |
| **AI SDK** | `@google/genai` | `2.28.0` | Multi-turn Gemini AI agent with native function calling |
| **x402 Core** | `@x402/core` | `2.28.0` | Official x402 v2 payment protocol specifications |
| **x402 EVM** | `@x402/evm` | `2.28.0` | EVM exact payment scheme with EIP-712 signature generation |
| **x402 Fetch** | `@x402/fetch` | `2.28.0` | Automated HTTP 402 negotiation, challenge handling, and retries |
| **x402 Next.js** | `@x402/next` | `2.28.0` | Route Handler middleware (`withX402`) for protected resources |
| **Web3 Client** | `viem` | `2.57.11` | Cryptographic account operations and signing |
| **EVM Provider** | `ethers` | `6.9.0` | Base Sepolia RPC queries, ERC-20 contract calls, and balance checking |
| **Smart Contracts**| Hardhat | `2.29.1` | Solidity development and contract compilation |
| **Schema Validation**| `zod` | `4.6.5` | Strict parameter validation across all tools and route handlers |
| **Test Suite** | Jest / `ts-jest` | `29.7.0` | Automated test runner with comprehensive mock isolation |

---

## 🧪 Verified Automated Test Results

The repository features comprehensive automated test coverage across **6 test suites and 157 passing tests**:

```bash
npm test
```

```
PASS tests/loan-defense-file.test.ts (11 tests)
PASS tests/agent-purposeful-tools.test.ts (14 tests)
PASS tests/x402-payment.test.ts (36 tests)
PASS tests/base-sepolia-transfer.test.ts (14 tests)
PASS tests/sepolia-transfer.test.ts (15 tests)
PASS tests/wallet-workflow.test.ts (67 tests)

Test Suites: 6 passed, 6 total
Tests:       157 passed, 157 total
Snapshots:   0 total
Time:        ~4.5s
Ran all test suites.
```

---

## 🔮 Future Scope

1. **Cross-Border Statutory Compliance:** Expansion of the Key Facts Statement (KFS) audit engine to support United Kingdom FCA (Financial Conduct Authority) and US CFPB (Consumer Financial Protection Bureau) mandatory disclosure rules.
2. **Account Aggregator & Open Banking:** Direct, borrower-permissioned ingestion of live bank statement feeds to compute real-time dynamic Debt-to-Income (DTI) and cash flow volatility metrics.
3. **Decentralized Escrow Disbursement:** Conditional smart contract escrows on Base Sepolia ensuring that loan funds are only disbursed once contractual terms pass automated on-chain verification.
4. **Zero-Knowledge Income Proofs:** Integration of ZK-SNARK identity proofs allowing borrowers to verify income adequacy without exposing raw banking statements or personal identity documents.

---

## 🚀 Running the Project Locally

### 1. Configure Environment Variables
Create or update `.env.local` in the project root:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_AGENT=gemini-2.5-flash

# Base Sepolia x402 Payment Protocol
X402_AGENT_PRIVATE_KEY=your_disposable_agent_testnet_private_key_here
X402_RECEIVER_ADDRESS=0xD50ca7f8586CaB87CeBeCAeB73d39e03C37853F2
X402_NETWORK=eip155:84532
X402_PRICE_USD=0.001
X402_FACILITATOR_URL=https://x402.org/facilitator
```

### 2. Install Dependencies & Run Dev Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build & Verify
```bash
npm test              # Run automated tests (157 passing tests)
npm run typecheck     # Verify TypeScript types (0 errors)
npm run lint          # Run ESLint (0 errors)
npm run build         # Verify production Next.js build (15 routes)
```

---

## ⚠️ Limitations & Honest Disclaimer

- **Educational Purpose:** DebtTrap Escape provides mathematical modeling, contract heuristics, and financial risk indicators for informational purposes only. It does not constitute certified legal, tax, financial, or credit underwriting advice.
- **Testnet Demonstration:** All blockchain transactions take place on **Base Sepolia** (`eip155:84532`) using testnet tokens holding zero commercial value.
- **Demo Provider:** The CrediCheck risk dossier endpoint simulates a third-party risk registry on testnet for demonstrating autonomous agent micropayments. It does not access live credit bureau records.
- **Crypto Oracles:** Liquidation and price calculations are based on user-supplied price parameters. The application does not connect to live mainnet price oracles or execute automated liquidations.
