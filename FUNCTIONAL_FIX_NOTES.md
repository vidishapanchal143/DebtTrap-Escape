# Functional reliability fixes

## Guided review
- The guided review now calculates loan EMI, total interest, total instalments and known-fee outflow locally using the shared `estimateLoan` function. It no longer depends on Gemini returning prose before the results panel can show a result.
- Offer comparison uses the same deterministic calculation for both offers.
- Crypto collateral review uses the shared deterministic scenario calculator and labels the price/threshold as user-supplied assumptions.
- Warning-sign review uses transparent keyword patterns against the text the user typed. It is a basic screen only, not fraud detection, contract reading, legal advice, or external lender verification.
- Budget indicators use only income, expenses and existing EMI values supplied by the user.

## Chat
- The Gemini function-calling agent remains the primary chat path.
- Temporary Gemini 503 overload responses now trigger retry delays, followed by automatic attempts with `gemini-3.6-flash` and `gemini-3.5-flash-lite` if the configured model remains unavailable. This reduces interruptions but cannot guarantee availability if all provider models are overloaded.
- If Gemini is unavailable, a fully specified EMI/loan-cost question can still return a clearly labeled calculation-only fallback. It does not claim Gemini ran.
- Other conversational questions still require a valid Gemini API configuration and provider availability. If those fail, check the terminal running `npm run dev` for `Agent request failed` and verify `GEMINI_API_KEY`, model access, and quota. Never paste the API key into chat or commit `.env.local`.

## Verification
- TypeScript/TSX syntax-transpilation checks passed for the changed page and API route.
- The overload retry/failover code passed syntax-transpilation checks; full dependency-based type-check/build remains to be run locally.
- A full `npm ci` / production build could not be run in this environment because dependency installation timed out. Run `npm ci` and `npm run build` on the user's machine before deployment.
