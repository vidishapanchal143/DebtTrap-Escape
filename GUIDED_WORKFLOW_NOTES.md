# Guided Loan Review UX

The homepage now starts with a guided three-step flow instead of making the chat the primary entry point.

1. **Choose your goal:** one loan, two-offer comparison, warning-sign review, or crypto-collateral scenario.
2. **Add your details:** the form changes to ask only for the chosen workflow's inputs and validates them before submitting.
3. **See your review:** the result is rendered in a dedicated report panel with plain-language text formatting, assumptions, and limitations. Backend function names and execution traces are never displayed in the guided UI.

The previous chat stays below the guided workflow as an optional follow-up path. Additional calculators and checklists are grouped after the primary workflow under **More ways to check the details**.

## Accuracy and limitations

- The guided form sends user-entered data to the existing server-side Gemini route; backend calculations remain authoritative for tool-backed numbers.
- Warning-sign review only checks the description supplied by the user; it does not parse an uploaded agreement or verify a lender.
- Crypto results use the user-supplied price/threshold; they are not live market prices or protocol-specific guarantees.
- The interface does not persist a financial profile between sessions.

## Verification status

TypeScript/TSX syntax-transpilation passed for the changed and existing source files. A complete Next.js build could not be run in this environment because `npm ci` timed out. Run `npm run build` locally and manually test all four guided workflows, especially the actual Gemini function-calling responses, before deploying.
