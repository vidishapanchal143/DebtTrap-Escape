# 🛡️ DebtTrap Escape

> **Understand First, Decide with Confidence.**<br/>
> An AI-powered loan safety and crypto collateral risk analyzer with dual-mode simulated and on-chain Ethereum Sepolia verification.

---

## 📌 Project Overview & Description

**DebtTrap Escape** is an intelligent loan safety platform built to protect borrowers from predatory lending, unclear debt agreements, and crypto liquidation traps.

The application pairs a deterministic financial mathematics engine with a multi-turn, tool-calling **Google Gemini** AI agent and browser-side Web3 tooling. It enables borrowers to calculate exact loan obligations, compare competing credit offers, screen contracts for predatory clauses with verbatim quote validation, simulate liquidation stress tests on crypto collateral, and safely prepare on-chain transactions with strict limits.

---

## 🎯 Problem Solved

Predatory lending and obscure financial agreements place borrowers at high risk:
1. **Opaque Fees & Misleading Rates:** Borrowers are frequently lured by flat monthly rates that mask exorbitant annualized percentage rates (APR) and upfront deductions.
2. **Unbalanced Loan Agreements:** Loan contracts often hide severe late-payment penalties, immediate signing pressure, or demands for personal credentials (OTP, passwords, seed phrases).
3. **DeFi & Crypto Loan Liquidation Risks:** Borrowers using crypto as collateral (e.g., ETH to borrow USDC) lack accessible tools to understand how market volatility triggers liquidation.
4. **Careless Blockchain Transfers:** Users interacting with Web3 protocols are vulnerable to blind-signing transactions, sending funds to incorrect addresses, or transferring unsupported tokens.

**DebtTrap Escape solves this by:**
- Enforcing deterministic reducing-balance EMI calculations where no numbers or fees are hallucinated.
- Screen-testing loan warning signs only when backed by verbatim evidence quotes from the agreement.
- Stress-testing crypto collateral under 20%, 40%, and 60% price drops.
- Providing dual-rail transfer capabilities: an educational in-memory SQLite demo ledger and a real Ethereum Sepolia testnet transfer module strictly capped at **0.01 USDC** with mandatory MetaMask review.

---

## 🧰 Technology Stack & Versions

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router) | `15.1.0` (Runtime `15.5.27`) | React Server Components, API routes, and static asset handling |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `5.7.2` | End-to-end static typing and interface contracts |
| **User Interface** | [React](https://react.dev/) | `19.0.0` | Declarative UI state, smooth transitions, and reactive forms |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `3.4.17` | Responsive high-contrast dark aesthetic (`#08111F`, `#39D6C0`, `#78F5CF`) |
| **Icons** | [Lucide React](https://lucide.dev/) | `0.468.0` | Accessible vector iconography |
| **AI SDK** | [@google/genai](https://www.npmjs.com/package/@google/genai) | `^2.28.0` | Google Gemini multi-turn function calling and tool execution |
| **Schema Validation** | [Zod](https://zod.dev/) | `^4.6.5` | Runtime parameter schemas and tool input validation |
| **Blockchain Client** | [Ethers.js](https://docs.ethers.org/) | `^6.9.0` | Ethereum provider connection, ERC-20 contract calls, and unit conversion |
| **Smart Contracts** | [Solidity](https://soliditylang.org/) / [Hardhat](https://hardhat.org/) | `^0.8.24` / `^2.29.1` | Smart contract development and compilation |
| **Local Database** | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | `12.11.1` | Local in-memory demo ledger for simulated transfers |
| **Unit Testing** | [Jest](https://jestjs.io/) & [ts-jest](https://kulshekhar.github.io/ts-jest/) | `^29.7.0` / `^29.2.5` | Automated test suite for wallet workflows and transfer safety |

---

## 🤖 Verified AI Model & Architecture

- **AI Provider:** Google Gemini API
- **Verified Active Model:** `gemini-3.8-flash`
- **Configuration Key:** `GEMINI_MODEL_AGENT=gemini-3.8-flash` in `.env.local`
- **Fallback Chain:** `gemini-3.6-flash` → `gemini-3.5-flash-lite` (handles temporary 503 overloads with exponential backoff)
- **Offline Fallback:** If no API key is provided, the system degrades to a deterministic local loan calculation formula without failing.
- **Tool-Call Budget:** Strict ceiling of 6 function calls per request to prevent runaway loops.

---

## 🛠️ Complete Working Tools List

The agent operates under a function-calling loop with 12 distinct tools:

### Financial Analysis & Safety Tools
1. **`calculateLoanCost`**: Computes estimated monthly EMI, total interest, total instalments, and total outflow in Indian Rupees (INR) using a reducing-balance formula. Clearly labels omitted or unknown fees.
2. **`compareLoanOffers`**: Compares two credit offers with matching principal and tenure. Discloses differences in total outflows and ranks lower-cost options provisionally if fees are unknown.
3. **`assessAffordability`**: Takes monthly take-home income, essential living expenses, existing debt EMIs, and the proposed new EMI to compute remaining net cash flow and Debt-to-Income (DTI) ratio.
4. **`analyzeCryptoCollateralRisk`**: Analyzes ETH-backed loans against USDC borrowing. Computes Loan-to-Value (LTV), liquidation threshold price, and simulates 20%, 40%, and 60% price drops.
5. **`detectLoanRedFlags`**: Evaluates 7 predatory lending warning signs (e.g. upfront fee guarantee, password/seed phrase request, undisclosed fees, urgency pressure). **Requires an exact, contiguous quote from the user's message; unverified claims are rejected.**

### Blockchain & Crypto Transfer Tools (Weeks 2 & 3)
6. **`prepareBaseSepoliaTransfer` (Week 3)**: Interprets and validates native ETH transfers on **Base Sepolia testnet** (Chain ID `84532`). Enforces a strict safety ceiling of `0.05 ETH`. Prepares a transaction review payload and requires explicit MetaMask signature and mined block confirmation (`status: 1`).
7. **`prepareSepoliaTransfer` (Week 2)**: Validates and prepares an on-chain Circle USDC transfer on **Ethereum Sepolia testnet** (Chain ID `11155111`). Enforces a strict ceiling of `0.01 USDC`. Returns review payload and requires explicit MetaMask signature.
8. **`registerEvidenceHash`**: Prepares registration of a 32-byte SHA-256 document hash on-chain via the authored `EvidenceHashRegistry` contract interface.

### Simulated Wallet Tools (Local Demo)
9. **`getWalletBalance`**: Returns the current demo wallet balance (starts at `1,000.00 SIM-USDC`) from the local SQLite ledger.
10. **`prepareWalletTransfer`**: Validates simulated transfer parameters and returns an idempotency key without debiting the wallet.
11. **`confirmWalletTransfer`**: Atomically debits sender and credits recipient for a prepared transfer key.
12. **`cancelWalletTransfer`**: Cancels a pending prepared transfer key. Idempotent; returns HTTP 409 if already confirmed.
13. **`getTransactionHistory`**: Retrieves past simulated transfer transactions from the SQLite ledger.

---

## ⚡ Key Features

- **Natural Language Command Interface:** Speak or type requests naturally on the DebtTrap Escape agent landing screen (e.g., *"Compare two loan offers"*, *"Analyze 2 ETH collateral at $2500 for a 2000 USDC loan"*, *"Send 0.002 ETH to 0x... on Base Sepolia"*, *"Send 0.01 USDC to 0x..."*).
- **Multi-Rail Transfer Safety Architecture:** Three-way isolated execution modes:
  1. **Base Sepolia (ETH) [Week 3]:** Real Layer-2 testnet native ETH transfers capped at `0.05 ETH`.
  2. **Ethereum Sepolia (USDC) [Week 2]:** Real Layer-1 testnet Circle USDC ERC-20 transfers capped at `0.01 USDC`.
  3. **Simulated (SIM-USDC) [Local]:** Risk-free local in-memory SQLite demo ledger.
- **Strict Safety Limits:** Base Sepolia transfers are hard-capped at **0.05 ETH** and Ethereum Sepolia USDC transfers at **0.01 USDC** across 5 independent defense layers (Gemini prompt guidelines, Zod schema, intent parser, React UI validation, and pre-MetaMask signer check).
- **MetaMask Interactive Authorization:** No transaction is ever signed or broadcast automatically. Users review all parameters on the **TaskReviewCard** before invoking MetaMask. Request access only after user click.
- **Truthful Transaction Receipt Handling:** Verified block receipt verification (`status: 1`), gas usage, and direct Basescan (`https://sepolia.basescan.org`) or Etherscan explorer links are generated only when an actual blockchain transaction is mined. Zero fabricated transaction hashes.
- **Client-Side SHA-256 Evidence Vault:** Generates cryptographic digests of loan contracts in the browser without uploading sensitive borrower documents to any remote server.

---

## 🔗 Crypto-Transfer Feature Details (Multi-Rail)

| Attribute | Base Sepolia Native ETH (Week 3) | Ethereum Sepolia USDC (Week 2) | Simulated Wallet (`SIM-USDC`) |
| :--- | :--- | :--- | :--- |
| **Network** | Base Sepolia Testnet | Ethereum Sepolia Testnet | Local SQLite demo ledger |
| **Chain ID** | `84532` (`0x14a34`) | `11155111` (`0xaa36a7`) | N/A (In-memory/local) |
| **RPC URL** | `https://sepolia.base.org` | `https://rpc.sepolia.org` | N/A |
| **Explorer** | `https://sepolia.basescan.org` | `https://sepolia.etherscan.io` | N/A |
| **Token Asset** | Native ETH | Official Circle USDC (`0x1c7D...7238`) | `SIM-USDC` (Simulated credits) |
| **Decimals** | 18 decimals | 6 decimals | 2 decimals |
| **Safety Ceiling** | **Strict maximum 0.05 ETH** | **Strict maximum 0.01 USDC** | Up to 100,000 SIM-USDC |
| **Signing Mechanism** | Interactive MetaMask approval | Interactive MetaMask approval | Local SQLite atomic update |
| **Real Funds at Risk** | None (Testnet ETH carries no value) | None (Testnet USDC carries no value) | None (Educational sandbox) |

### Smart Contract Integration Status
- **Contract Name:** `EvidenceHashRegistry.sol`
- **Source File:** `contracts/EvidenceHashRegistry.sol`
- **Compiler:** Solidity `^0.8.24` via Hardhat
- **Deployment Status:** Deployed and verified on Ethereum Sepolia testnet (Chain ID `11155111`).
- **Contract Address:** `0x8638143982BfddAc9a8c60A49A6d119c5a607aBd`
- **Deployment Transaction Hash:** `0x3cd02face0889e72c5e4e72a5bfdeded9148320c3b618fbcdc4e8005b986de83`
- **Deployment Block:** `11942390`
- **Deployer Address:** `0xa22F4B4Fc51e80b7370568EC5778B777586929C0`
- **Etherscan Verification:** [https://sepolia.etherscan.io/address/0x8638143982BfddAc9a8c60A49A6d119c5a607aBd](https://sepolia.etherscan.io/address/0x8638143982BfddAc9a8c60A49A6d119c5a607aBd)
- **Live Transfer Transaction Status:** The interactive Sepolia USDC transfer mechanism is fully implemented with MetaMask authorization and a strict 0.01 USDC safety ceiling. Live transfer broadcast and recording of an actual on-chain user receipt remain a manual demo task to be performed during video recording.

---

## 🎥 Demo Video and Weekly Submissions

### Week 1 Submission
- **Link Name:** `Week 1 (DebtTrapEscape.v1)`
- **URL:** [https://drive.google.com/drive/folders/1WbMNvAZPOxpLzgSSSwdtlUTy4pjLIW6O?usp=drive_link](https://drive.google.com/drive/folders/1WbMNvAZPOxpLzgSSSwdtlUTy4pjLIW6O?usp=drive_link)

### Week 2 Submission
- **Link Name:** `Week 2 (DebtTrapEscape.v2)`
- **URL:** *[Pending manual recording and upload — follow WEEK2_DEMO_SCRIPT.md]*

### Week 3 Submission
- **Link Name:** `Week 3 (DebtTrapEscape.v3)`
- **URL:** *[Pending manual recording and upload — follow WEEK3_DEMO_SCRIPT.md]*

### Live Deployment
- **Link Name:** `DebtTrap Escape Live Demo`
- **URL:** *[Pending manual hosting deployment]*

---

## 🌐 Social Media Links

- **X (Twitter) Profile:** [@Vdsa143](https://x.com/Vdsa143)
- **Project Post 1:** [DebtTrap Escape — Update 1](https://x.com/Vdsa143/status/2109343990252556665)
- **Project Post 2:** [DebtTrap Escape — Update 2](https://x.com/Vdsa143/status/2109344030039654676)
- **Project Post 3:** [DebtTrap Escape — Update 3](https://x.com/Vdsa143/status/2109344092329312486)
- **Week 2 Post:** *[To be posted upon demo completion]*
- **Week 3 Post:** *[To be posted upon demo completion]*

---

## 🚀 Local Setup & Installation

### Prerequisites
- Node.js `20.9+` or `22.x`
- npm `10+`
- MetaMask browser extension (for Ethereum Sepolia and Base Sepolia testnet interactions)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Step-by-Step Installation
```bash
# 1. Clone repository and enter directory
git clone https://github.com/vidishapanchal143/DebtTrap-Escape.git
cd DebtTrap-Escape

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

### Environment Configuration (`.env.local`)
Edit `.env.local` with your configuration:
```env
# Gemini API Key (Required for AI agent)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_AGENT=gemini-3.8-flash

# Base Sepolia RPC (Chain ID: 84532 - Week 3)
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Ethereum Sepolia RPC (Chain ID: 11155111 - Week 2)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
DEPLOYER_PRIVATE_KEY=your_testnet_private_key
EVIDENCE_HASH_REGISTRY_ADDRESS=0x8638143982BfddAc9a8c60A49A6d119c5a607aBd
```
> **Security Reminder:** Never commit `.env.local` or share private keys or seed phrases.

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the **DebtTrap Escape agent landing screen**.

### Run Automated Unit Tests
```bash
npm test
```
Executes all 101 test scenarios across 3 suites (`wallet-workflow.test.ts`, `sepolia-transfer.test.ts`, `base-sepolia-transfer.test.ts`) covering prompt parsing, address verification, Base Sepolia ETH limits (`0.05 ETH`), Sepolia USDC limits (`0.01 USDC`), network switching (`84532` & `11155111`), user signature cancellation, and mined block receipt verification.

---

## 🔮 Future Scope & Post-Week 3 Roadmap

1. **Zero-Knowledge (ZK) Income Verification:** Allow borrowers to prove income thresholds without exposing bank statements or private employer data.
2. **ERC-4337 Account Abstraction & Smart Accounts:** Gasless user experience with session keys and programmable spending limits.
3. **x402 Paywall Payment Integration:** Micro-payments for specialized contract verification and legal database lookups.
4. **Live Decentralized Oracle Price Feeds:** Chainlink oracle feeds for real-time collateral pricing and dynamic liquidation warnings.
5. **Mainnet L2 Expansion:** Expanding production contracts to Base Mainnet and Arbitrum One with audited multi-sig safety modules.

---

## ⚠️ Disclaimer

DebtTrap Escape provides educational loan cost calculations, risk simulations, and contract screening for informational purposes only. It does not provide certified legal, investment, or financial advice. Crypto calculations rely on user-supplied assumptions. Testnet tokens on Ethereum Sepolia and Base Sepolia carry zero financial value. Always verify loan terms with official regulatory registries and independent advisors.
