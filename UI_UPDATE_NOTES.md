# Customer-facing UI update

The primary homepage flow is now a guided three-step loan review rather than a chat-first experience.

1. **Choose your goal:** understand one loan, compare two offers, review described warning signs, or estimate crypto-collateral scenarios.
2. **Add relevant details:** the form changes based on the task and validates key inputs before submitting.
3. **See your review:** a dedicated result panel shows a plain-language report with readable headings and lists. No internal function names, tool calls, or backend execution trace is shown to the user.

The chat has been demoted to an optional follow-up area lower on the page. Existing cost calculator, comparison/red-flag tools, agreement checklist, crypto stress test, and SHA-256 evidence utility are retained as optional tools in a clearer order.

## Functional notes and limitations

- Guided review sends its structured request to the existing server-side Gemini route.
- Loan and offer values are user-supplied estimates; no live lender verification is performed.
- Warning-sign review checks the description entered by the user. It does not parse an uploaded contract or independently verify a lender.
- Crypto scenarios use user-supplied collateral price and liquidation threshold. They are not live price quotes or protocol-specific guarantees.
- Persistent financial memory and proactive monitoring are not implemented.

## Verification

- TypeScript/TSX syntax-transpilation passed for all 8 source files.
- CSS brace-balance and ZIP integrity checks passed.
- A fresh Next.js production build could not be run in this environment because `npm ci` timed out. Run `npm run build` locally and test all four guided workflows with a valid server-side Gemini API key before deployment.
