# DebtTrap Escape agent smoke tests

Run these after adding a newly created Gemini key to `.env.local` and starting the app. Do not use a real borrower's personal or financial details. The UI intentionally does not disclose internal tool names or execution steps; evaluate the user-facing results and inspect server-side traces only in a local test environment if needed.

## Test 1 — Loan cost answer

Prompt:

> Calculate an estimate for a ₹500,000 loan at 12% annual interest for 36 months. There is no upfront fee.

Pass conditions:
- The response reports an EMI of approximately ₹16,607.15 per month.
- The estimated interest is approximately ₹97,857.58 and instalments total approximately ₹597,857.58, subject to rounding.
- It does not claim this is an official APR or lender quote.

## Test 2 — Compare two offers

Prompt:

> Compare two offers for the same ₹100,000 principal and 24-month tenure. Offer A is 12% annually with ₹2,000 upfront fees. Offer B is 15% annually with ₹1,000 upfront fees.

Pass conditions:
- It reports Offer A's estimated outflow at about ₹114,976.33 and Offer B's at about ₹117,367.96.
- It identifies Offer A as lower by about ₹2,391.63 based on the listed terms, while disclosing excluded charges and limitations.

## Test 3 — Multi-step affordability workflow

Prompt:

> I take home ₹35,000 per month, my essential expenses are ₹14,000, and I already pay ₹2,000 in EMIs. Calculate the cost of a ₹500,000 loan at 12% annually for 36 months and assess the cash flow if I take it. There is no upfront fee.

Pass conditions:
- The EMI-to-take-home ratio is about 53.16% for existing plus proposed EMIs.
- The remaining amount after reported essential expenses and all EMIs is about ₹2,392.85 per month.
- It does not call the loan safe or approve it based on this calculation alone.

## Test 4 — Missing data should trigger a question

Prompt:

> Can I afford a ₹500,000 loan at 12% for 36 months? My take-home income is ₹35,000.

Pass conditions:
- The agent may calculate the EMI, but it asks for essential monthly expenses and existing EMIs before running an affordability assessment.
- It does not invent either missing value.

## Test 5 — Evidence-linked warning sign

Prompt:

> The lender told me: "Pay an upfront fee to guarantee approval." Is that a warning sign?

Pass conditions:
- The returned evidence quote is a literal quote from the current user message.
- The response calls it a warning sign requiring verification, not conclusive proof of fraud.

## Test 6 — Quote cannot be verified

Prompt:

> The lender seems suspicious, but I cannot point to anything specific.

Pass conditions:
- It asks what the lender actually said or did, or explains that there is not enough specific evidence.
- It does not invent a quote or claim to have verified a red flag.

## Important test boundary

The agreement checklist is manual and does not upload or parse documents. Do not use this test suite to claim PDF/image agreement extraction, live lender verification, live crypto prices, persistent memory, or proactive notifications.


## Test 7 — Crypto-collateral risk estimate

Prompt:

> Estimate the risk for 2 ETH collateral at a user-assumed price of $2,500 per ETH, a 2,000 USDC loan, and an 80% liquidation threshold. Include price-drop stress tests.

Pass conditions:
- It calculates collateral value around $5,000, LTV around 40%, and an estimated threshold price around $1,250 per ETH.
- It shows 20%, 40%, and 60% price-drop scenarios, with the 60% drop reaching the assumed threshold under these inputs.
- It says the price and threshold are user-supplied assumptions, not live or protocol-verified data.
