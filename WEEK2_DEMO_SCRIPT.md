# 🎬 DebtTrap Escape — Week 2 Demo Video Script & Recording Checklist

**Video Duration:** ~2:00 – 2:30 Minutes  
**Target Audience:** Evaluators, Hackathon Judges, and Community  
**Demonstration Scope:** Natural language request, Gemini tool selection, pre-popup safety rejection (0.02 USDC limit), transaction review screen, explicit MetaMask authorization, and verified transaction receipt handling.

---

## 📋 Pre-Recording Checklist

Before you hit record, ensure the following items are ready on your desktop:

- [ ] **Next.js Dev Server Running:** Run `npm run dev` (inside the `DebtTrap-Escape` directory) and verify [http://localhost:3000](http://localhost:3000) opens to the **DebtTrap Escape agent landing screen**.
- [ ] **MetaMask Installed & Configured:**
  - MetaMask extension is installed in your browser.
  - Network is set to **Ethereum Sepolia** (Chain ID: `11155111`).
  - *Note on Multi-Rail Tabs:* The transfer module now supports 3 isolated modes: **Base Sepolia (ETH) [WEEK 3]**, **Sepolia (USDC) [WEEK 2]**, and **Simulated (SIM-USDC) [SQLITE]**. For this Week 2 video, ensure the **Sepolia (USDC)** tab is selected. For Base Sepolia, refer to `WEEK3_DEMO_SCRIPT.md`.
  - *For Option A (Full on-chain broadcast):* Test account has a small balance of Sepolia ETH (for gas from [sepoliafaucet.com](https://sepoliafaucet.com) or [cloud.google.com/application/web3/faucet/ethereum/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)) and Circle Sepolia USDC test tokens from [faucet.circle.com](https://faucet.circle.com/).
  - *For Option B (Demo / Error state presentation):* Demonstrates the user signature prompt and rejection/unfunded handling without requiring testnet tokens.
- [ ] **Recipient Address Ready:** A valid Sepolia EVM address to paste/type:  
  `0x71c8360F78B35b36489abe3c4b821b0C863D690a`
- [ ] **Recording Tool Set Up:** OBS Studio, Loom, or Screen Studio recording at 1080p, 60fps, with clear microphone audio.

---

## 🎙️ Step-by-Step Video Script & Voiceover

### **Scene 1: Introduction & Problem Context (0:00 – 0:25)**
- **Visual:** Open the **DebtTrap Escape agent landing screen** (`http://localhost:3000`). Show the high-contrast command surface, glowing Agent presence orb, and "What brings you here today?" header.
- **Voiceover:**
  > *"Welcome to DebtTrap Escape — an intelligent financial defense platform designed to protect users from predatory lending and crypto collateral debt traps.*  
  > *In Week 2, we’ve advanced our platform by integrating multi-turn function calling with Google Gemini 3.8 Flash, and implementing isolated crypto transfer safety: separating risk-free local simulations from real on-chain Ethereum Sepolia transactions with strict 0.01 USDC safety caps."*

---

### **Scene 2: Strict Safety Limit Enforcement (0:25 – 0:50)**
- **Visual:** Click on the command input or select **Simulated Wallet Transfer Preparation** / **Crypto Transfer**. In the transfer modal, select the **Sepolia (USDC) [WEEK 2]** tab. In the natural-language prompt field, enter an over-limit transfer:  
  `"Send 0.02 USDC to 0x71c8360F78B35b36489abe3c4b821b0C863D690a on Sepolia"`  
  Show the instant rejection in the UI and the agent explaining the 0.01 USDC safety limit. Emphasize that **no MetaMask popup appeared**.
- **Voiceover:**
  > *"Safety starts with hard boundaries. Watch what happens when I request a 0.02 USDC transfer.  
  > Immediately, the safety guard catches the over-limit amount before any wallet popup can ever be triggered. Both our client-side intent parser and the Gemini AI agent strictly enforce a maximum transfer ceiling of 0.01 USDC. The user is informed with a clear safety explanation, protecting against accidental overspending or blind signing."*

---

### **Scene 3: Natural Language Intent & Gemini Tool Selection (0:50 – 1:20)**
- **Visual:** Clear the input and enter a valid transfer request within the safety limit:  
  `"Transfer 0.01 USDC on Ethereum Sepolia testnet to 0x71c8360F78B35b36489abe3c4b821b0C863D690a"`  
  Press Submit / Enter. Show the agent orb pulsing as it executes `prepareSepoliaTransfer` and transitions to the review state.
- **Voiceover:**
  > *"Now let's submit a valid test request: 'Transfer 0.01 USDC on Ethereum Sepolia testnet to 0x71C...'.  
  > Behind the scenes, Google Gemini analyzes the natural-language prompt, identifies the target network as Sepolia, selects the `prepareSepoliaTransfer` tool, normalizes the recipient address, and builds the transaction payload — all without touching private keys."*

---

### **Scene 4: Transaction Review Screen & Explicit Authorization Gate (1:20 – 1:45)**
- **Visual:** The screen smoothly presents the **Sepolia On-Chain Transfer Authorization** review card (`TaskReviewCard`). Highlight:
  - The "Awaiting Approval" badge and warning notice.
  - The recipient address with the copy button.
  - The breakdown: `0.01 USDC`, estimated gas, token name (`Circle USDC`), and `Ethereum Sepolia (Chain ID 11155111)`.
  - Point your cursor to the **Cancel** button and the **Continue to MetaMask approval** button.
- **Voiceover:**
  > *"Crucially, DebtTrap Escape never initiates a blockchain transfer automatically.  
  > The user is presented with a comprehensive review card: verifying the exact recipient address, the 0.01 USDC amount, estimated gas, the official Circle USDC contract, and the Sepolia network.  
  > If the user clicks Cancel, the action is completely aborted. Only when clicking 'Continue to MetaMask approval' does the app request explicit authorization."*

---

### **Scene 5: MetaMask Signing & Verified Blockchain Receipt Handling (1:45 – 2:20)**
- **Visual:** 
  1. Click **"Continue to MetaMask approval"**.
  2. The MetaMask extension pops up requesting authorization for the ERC-20 `transfer` method to the Circle USDC contract.
  3. *Option A (With Funded Testnet Wallet):* Click **Confirm** in MetaMask. The app waits for the block confirmation (`tx.wait()`). Once mined, the verified **ResultArtifact** appears with the real block number, gas used, and Sepolia Etherscan link.
  4. *Option B (Without Testnet Tokens / Demonstration Mode):* Show the MetaMask popup requesting signature for Circle USDC. If rejected or unfunded, show the application's clean error state ("MetaMask transaction signature was rejected by user" or gas notice) with the recovery button. Note that the application never fabricates a transaction hash or claims success without a real receipt.
- **Voiceover:**
  > *"Clicking 'Continue to MetaMask approval' invokes the browser extension to review and authorize the ERC-20 transfer.  
  > DebtTrap Escape handles the transaction lifecycle strictly: if signed and broadcast, it awaits the real mined block receipt on Sepolia and provides a direct link to Etherscan. If rejected or unconfirmed, it displays the truthful error status. We never fabricate hashes or claim a transfer succeeded without a real on-chain receipt."*

---

### **Scene 6: Conclusion & Week 3 Outlook (2:20 – 2:35)**
- **Visual:** Return to the **DebtTrap Escape agent landing screen** showing the evidence vault and completed transaction summary.
- **Voiceover:**
  > *"With deterministic loan calculators, verbatim red-flag screening, crypto liquidation stress-testing, and verified Sepolia transactions, DebtTrap Escape gives borrowers clarity and safety.  
  > Thank you for watching!"*

---

## 🎯 Recording Tips
- **Pacing:** Speak at a calm, deliberate pace.
- **Resolution:** Record your browser window at 1920x1080 resolution.
- **Audio:** Use a noise-reduction filter or quiet room so the voiceover is crisp and professional.
- **Format:** Export as an MP4 file, name it `DebtTrapEscape_Week2_Demo.mp4`, and upload to your Google Drive or YouTube (unlisted/public).
