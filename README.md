# DebtTrap Shield

**Understand the cost before you decide.**

DebtTrap Shield is a free, offline-first web app that helps borrowers see a loan's true cost, understand warning signals, and find safer next steps — before they commit to an offer.

> ⚠️ This tool is for financial education only. It is not a lender, regulator, financial adviser, or legal adviser.

---

## Problem

Predatory loan offers obscure the true cost through complex fees, misleading interest rate presentation, and short tenures. Borrowers frequently accept loans without understanding how much extra they will pay.

## Solution

DebtTrap Shield provides a guided 8-screen flow:

1. **Welcome** — Language and accessibility settings, privacy notice
2. **Enter Offer** — Manual entry, sample data, optional image upload
3. **Review Details** — Confirm all numbers before calculation
4. **True Cost** — Visual centerpiece showing full cost breakdown
5. **Cost Signal** — Plain-language explanation of what the cost means
6. **Next Steps** — Calm, practical options without pressure
7. **Harassment Support** — Complaint draft tool if under pressure
8. **Summary and Share** — Save locally, share with family, restart

---

## Features

- Works fully offline — no internet, no account, no API key required
- Manual entry is always the primary path
- "Use sample offer" fills in a realistic ₹5,000 → ₹7,400 example
- All calculations are deterministic local code, never AI output
- English, हिन्दी, and ગુજરાતી fully supported
- Larger text mode and high-contrast mode
- Speech synthesis for key explanations (where browser supports it)
- Locally saved summaries with a clear delete option
- Native browser share sheet or clipboard copy
- Mobile-first, keyboard accessible design
- Optional Gemini image reading (consent-gated, server-side only)

---

## Local Setup

### Prerequisites

- Node.js v18 or later
- npm v9 or later

### 1. Install all dependencies

```bash
npm run install:all
```

### 2. Configure environment (optional — for Gemini)

```bash
cp .env.example .env
```

Open `.env` and paste your Gemini API key (from https://aistudio.google.com/app/apikey, free tier):

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
```

If you leave GEMINI_API_KEY blank, the app works perfectly with manual entry.

### 3. Start the app

```bash
npm run dev
```

- Frontend: Vite's reported local URL (usually http://localhost:5173; if occupied, http://localhost:5174)
- Backend API: http://localhost:3002

---

## Gemini Setup (Optional)

| Detail | Value |
|--------|-------|
| Key location | .env → GEMINI_API_KEY (server only, never sent to browser) |
| Model | gemini-3.8-flash (set as the current default; check Google AI Studio free-tier availability and limits for your account) |
| When used | Only when user clicks "Read with Gemini" and confirms consent |
| Image handling | Never saved, never logged |
| Size limit | 4 MB |

Free-tier quotas can change. The app falls back to manual entry gracefully if quota is exhausted.

---

## Privacy Behavior

- No analytics, no trackers, no login, no cloud sync
- Entries stay on the user's device
- Saved summaries go to localStorage only when explicitly saved
- Uploaded images are never saved to disk or localStorage
- API keys are never sent to the browser or logged

---

## Known Limitations

- Currency is INR only
- The simple annualized illustration is a rough comparison, not an official APR
- Speech synthesis depends on the user's OS and browser; Hindi/Gujarati voices may not be available on all systems
- Gemini extraction is only as accurate as the uploaded image — always review before proceeding
- localStorage can be cleared by the browser

---

## Legal Notice

This tool provides financial education and cost transparency. It does not constitute financial advice, legal advice, or a regulatory assessment.
