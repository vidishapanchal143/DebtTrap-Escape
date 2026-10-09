# DebtTrap Escape

A starter for an AI-assisted loan safety product. The current build includes a responsive dashboard, a deterministic loan calculator, a local file-selection demo, and a clearly labelled demo assistant. It does **not** yet verify lender legitimacy or provide legal/financial advice.

## Requirements
- Node.js 20.9+ recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Current status
- [x] Responsive dashboard concept and navigation
- [x] Loan repayment estimate (fixed monthly rate / EMI estimate)
- [x] File picker UI (file is not uploaded to a server in this starter)
- [x] Demo assistant interactions
- [ ] Gemini document extraction (next implementation step)
- [ ] Official-source integrations
- [ ] Automated tests for financial calculations
- [ ] x402 payments and wallet policy controls
- [ ] Testnet evidence-hash registry

## Safety
- Calculations are estimates and depend on the entered terms.
- The demo risk panel is not a real risk assessment.
- Never upload real borrower documents until storage, consent, access control and retention are implemented.
- Never commit `.env` files, API keys or wallet private keys.
