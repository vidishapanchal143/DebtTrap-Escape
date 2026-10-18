# 🛡️ DebtTrap Escape

**Understand First, Decide with Confidence.**

## 📌 About the Project

DebtTrap Escape is an AI-powered loan safety web application with an integrated Gemini AI assistant. It helps users understand loan costs, compare offers, assess crypto collateral risks, and identify potential warning signs before making financial decisions.

## 🎯 Problem Statement

Loan terms, hidden fees, repayment penalties, and crypto collateral risks can be difficult to understand. DebtTrap Escape brings financial calculations and loan safety utilities together to help users make more informed decisions.

## 🧰 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **UI:** React 19, Tailwind CSS
- **AI:** Google Gemini API (`@google/genai`)
- **Simulated Wallet DB:** SQLite via `better-sqlite3`
- **Web Crypto:** Browser SHA-256 document hashing
- **Testing:** Jest + ts-jest
- **Validation:** Zod
- **Blockchain:** Ethereum Sepolia (smart contract authored; deployment pending network access — see [BLOCKCHAIN.md](./BLOCKCHAIN.md))

For exact dependency versions, refer to `package.json` and the lockfile.

## 🤖 AI Model & Tools

- **Provider:** Google Gemini
- **Primary Model:** `gemini-3.8-flash` (configured via `GEMINI_MODEL_AGENT`)
- **Fallback chain:** `gemini-3.6-flash` → `gemini-3.5-flash-lite` (automatic on 503)
- **Function-calling loop:** Up to 6 tool calls per request
- **SDK:** `@google/genai` ^2.28.0

### Supported AI Agent Tools (5 total)

| Tool | Description |
|---|---|
| `calculateLoanCost` | Estimates EMI, total interest, and outflow in INR |
| `compareLoanOffers` | Compares two offers on the same principal and tenure |
| `assessAffordability` | Cash-flow and EMI-to-income indicators from user-provided values |
| `analyzeCryptoCollateralRisk` | LTV, liquidation price, and 20/40/60% price-drop stress tests |
| `detectLoanRedFlags` | Evidence-verified warning sign screening from quoted user text |

All tools are validated server-side with Zod before execution. Evidence quotes in red-flag detection are verified against the actual user message.

## 🏦 Simulated Wallet (Week 2)

A local SQLite ledger provides a demo wallet for learning about transfer workflows:

- `prepareTransfer` — validates and returns a prepared object (no DB write)
- `confirmTransfer` — atomically debits/credits and writes a `confirmed` record
- `cancelTransfer` — atomically cancels; idempotent; rejects confirmed transactions (HTTP 409); never modifies balances

The simulated wallet is completely separate from any real blockchain or real funds.

## 🔗 Smart Contract (Week 2)

**Contract:** `EvidenceHashRegistry.sol` — anchors SHA-256 document hashes on Ethereum Sepolia testnet.  
**Status:** **Deployed and verified on Ethereum Sepolia**  
**Contract address:** `0x8638143982BfddAc9a8c60A49A6d119c5a607aBd`  
**Transaction hash:** `0x3cd02face0889e72c5e4e72a5bfdeded9148320c3b618fbcdc4e8005b986de83`  
**Etherscan:** [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x8638143982BfddAc9a8c60A49A6d119c5a607aBd)  

See [BLOCKCHAIN.md](./BLOCKCHAIN.md) for deployment record, architecture, and verification details.

## 🛠️ App Features

- Crypto Loan Risk Analyzer
- Loan EMI and Cost Calculator (local + AI-assisted)
- Loan Document Review Checklist
- AI Loan Safety Assistant (Gemini with function calling)
- Loan Offer Comparator
- Loan Red-Flag Checker (evidence-verified)
- Crypto Evidence Vault (browser-side SHA-256 hashing)
- Simulated Wallet (prepare / confirm / cancel transfers)

## 🧪 Tests

```bash
npm test          # Jest tests for wallet workflow (9 scenarios)
npm run typecheck # TypeScript strict mode check
npm run lint      # ESLint
npm run build     # Production build (verifies compilation)
```

Test scenarios cover: starting balance, prepare, balance-unchanged after prepare, cancel, balance-unchanged after cancel, history shows cancelled status, late-confirmation rejection, idempotent repeated cancel, concurrent confirm/cancel race safety.

## 🚀 Running Locally

```bash
# In DebtTrap-Escape/
npm install
# Copy .env.example to .env.local and add your Gemini API key
npm run dev
```
Open http://localhost:3000

Set `GEMINI_API_KEY` in `.env.local`. The AI assistant degrades gracefully to a local EMI calculator when no key is provided.

<<<<<<< HEAD
## 🚀 Future Scope

### Week 2
- Improve AI-agent tool integration.
- Enhance loan document analysis and input validation.
- Improve usability and error handling.
=======
## 🎥 Demo Video and Weekly Submissions

**Week 1 (DebtTrapEscape.v1):**

https://drive.google.com/drive/folders/1WbMNvAZPOxpLzgSSSwdtlUTy4pjLIW6O?usp=sharing

**Live Demo:** Add the deployed website URL here when available.

## 🔮 Future Scope
>>>>>>> 3e105b9 (Fix wallet workflow and restore AI agent interface)

### Week 3
- Zero-Knowledge (ZK) proof integrations
- x402 payment workflows
- Live crypto price data integrations
- Deploy `EvidenceHashRegistry` to Sepolia; record address and transaction hash

## 🌐 Social Media Links

**X (Twitter) Profile:**  
https://x.com/Vdsa143

**Project Posts:**

1. [DebtTrap Escape — Post 1](https://x.com/Vdsa143/status/2109343990252556665)
2. [DebtTrap Escape — Post 2](https://x.com/Vdsa143/status/2109344030039654676)
3. [DebtTrap Escape — Post 3](https://x.com/Vdsa143/status/2109344092329312486)

## ⚠️ Disclaimer

DebtTrap Escape provides educational information and estimates, not professional financial or legal advice. Crypto risk calculations depend on user-provided inputs. The application does not execute real blockchain transactions or guarantee the legitimacy of lenders. The simulated wallet uses local SQLite and holds no real funds.

---

**Built for better-informed financial decisions.**
