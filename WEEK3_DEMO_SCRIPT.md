# 🎬 DebtTrap Escape — Week 3 Demo Video Script & Recording Checklist

**Video Duration:** ~2:00 – 2:30 Minutes  
**Target Network:** Base Sepolia Testnet (Chain ID `84532`, RPC `https://sepolia.base.org`)  
**Target Audience:** Hackathon Evaluators, Judges, and Web3 Community  
**Demonstration Scope:** Click-to-connect wallet action, real Base Sepolia ETH balance display, wrong-network safety, natural-language transfer intent parsing, strict 0.05 ETH safety ceiling, explicit MetaMask transaction review, and verified on-chain Basescan receipt handling.

---

## 📋 Pre-Recording Checklist

Before recording, ensure your local environment is configured:

- [ ] **Next.js Dev Server Running:**
  Run `npm run dev` in the `DebtTrap-Escape` directory and navigate to [http://localhost:3000](http://localhost:3000).
- [ ] **MetaMask Extension Configured:**
  - MetaMask extension is installed in your browser.
  - Base Sepolia network is configured:
    - **Network Name:** Base Sepolia
    - **RPC URL:** `https://sepolia.base.org`
    - **Chain ID:** `84532` (`0x14a34`)
    - **Currency Symbol:** `ETH`
    - **Block Explorer:** `https://sepolia.basescan.org`
  - *Option A (Full on-chain broadcast):* Your wallet has a small testnet ETH balance (obtain free testnet ETH from [faucets.chain.link](https://faucets.chain.link/) or [base.org/faucets](https://base.org/faucets)).
  - *Option B (Demonstration of interactive authorization & error safety):* If without faucet ETH, demonstrate the interactive signature modal, wrong-network handling, and cancellation safety.
- [ ] **Recipient Address Ready:** A valid EVM address:  
  `0x71c8360F78B35b36489abe3c4b821b0C863D690a`
- [ ] **Recording Tool Ready:** OBS Studio, Loom, or Screen Studio recording at 1080p, 60fps, with clear microphone audio.

---

## 🎙️ Step-by-Step Video Script & Voiceover

### **Scene 1: Introduction & Week 3 Capability (0:00 – 0:25)**
- **Visual:** Open [http://localhost:3000](http://localhost:3000). Show the DebtTrap Escape landing screen, ambient aesthetic, and task selector.
- **Voiceover:**
  > *"Welcome to DebtTrap Escape — an intelligent financial defense platform protecting borrowers from predatory debt and crypto collateral traps.*  
  > *In Week 3, we’ve expanded our blockchain safety rails by implementing full Base Sepolia native ETH capability. Users can now analyze, prepare, and verify Layer-2 testnet transactions through conversational AI, backed by strict client-side safety bounds."*

---

### **Scene 2: Click-to-Connect Wallet & Real-time Balance (0:25 – 0:50)**
- **Visual:** 
  1. Click the 7th task card: **"Simulated Wallet Transfer Preparation" / "Wallet Transfer"**.
  2. Point out the three tabs: **Base Sepolia (ETH) [WEEK 3]**, **Sepolia (USDC) [WEEK 2]**, and **Simulated (SIM-USDC) [SQLITE]**. Ensure **Base Sepolia (ETH)** is active.
  3. Show the Base Sepolia network card: Chain ID `84532`, RPC `https://sepolia.base.org`, Explorer `sepolia.basescan.org`.
  4. Note that **MetaMask does not pop up automatically**.
  5. Click **"Connect Base Sepolia Wallet"** (`#connect-base-sepolia-wallet-btn`). Approve connection in MetaMask.
  6. The card immediately updates to show:
     - Connected public address (e.g. `0x71C8...690a`)
     - Green status pill: **Base Sepolia Verified**
     - Live on-chain **Base Sepolia Native Balance** (e.g. `0.0245 ETH`).
  7. *(Optional wrong-network test)*: If switched to mainnet or Sepolia, show the red "Wrong Network" banner and the **"Switch to Base Sepolia"** button cleanly switching via `wallet_switchEthereumChain`.
- **Voiceover:**
  > *"We adhere to privacy and safety best practices: wallet access is never requested on page load. Only upon clicking 'Connect Base Sepolia Wallet' does MetaMask prompt for connection.*  
  > *Once connected, the app verifies the Chain ID is 84532, displays the verified public address, and queries the real Base Sepolia RPC to show the user's live native ETH balance. If the user is on the wrong network, an in-app switch button automatically shifts MetaMask to Base Sepolia."*

---

### **Scene 3: Natural Language Intent & 0.05 ETH Safety Ceiling (0:50 – 1:20)**
- **Visual:** 
  1. In the **Natural language transfer request** field, type an over-limit transfer:  
     `"Send 0.1 ETH to 0x71C8360f78B35b36489aBE3C4B821b0C863d690a on Base Sepolia"`
  2. Point to the instant red error notice:  
     `⚠️ Transfer amount (0.1 ETH) exceeds the safety maximum of 0.05 ETH on Base Sepolia.`
  3. Show that **no transaction was submitted and no wallet prompt appeared**.
  4. Now type a valid safe transfer:  
     `"Send 0.002 ETH to 0x71C8360f78B35b36489aBE3C4B821b0C863d690a on Base Sepolia"`
  5. Notice the recipient address and `0.002` amount are extracted automatically. Click **"Prepare & Review Transfer"**.
- **Voiceover:**
  > *"Users can command transfers using plain natural language. Watch as I enter an over-limit transfer of 0.1 ETH.*  
  > *Immediately, our safety validation blocks the transfer before any signature request can occur. Base Sepolia transfers are strictly capped at 0.05 ETH.*  
  > *Now, entering a safe 0.002 ETH request auto-populates the validated recipient address and amount. Clicking 'Prepare & Review Transfer' triggers our agent pipeline to format the review payload without signing."*

---

### **Scene 4: Transaction Review & Parameter Verification (1:20 – 1:45)**
- **Visual:** The application presents the **TaskReviewCard** for Base Sepolia:
  - Network: **Base Sepolia (Chain ID: 84532)**
  - Action: **Native ETH Transfer**
  - Recipient: `0x71C8360f78B35b36489aBE3C4B821b0C863d690a` with copy button
  - Amount: `0.002 ETH`
  - Estimated Gas: `~21,000 gas units`
  - RPC & Explorer links
  - Point to the **Cancel** button and the **Continue to MetaMask approval** button (`#confirm-base-sepolia-transfer-btn`).
- **Voiceover:**
  > *"Every transfer pauses at the review screen. DebtTrap Escape enforces explicit human review: confirming the exact recipient, the 0.002 ETH amount, estimated gas, and the Base Sepolia network.*  
  > *The user can cancel at any time with zero side effects. Nothing is broadcast until explicit confirmation."*

---

### **Scene 5: MetaMask Interactive Signing & Verified Block Receipt (1:45 – 2:20)**
- **Visual:** 
  1. Click **"Continue to MetaMask approval"**.
  2. MetaMask opens with the transaction review for `0.002 ETH` on Base Sepolia.
  3. *Option A (Live On-Chain Broadcast):*
     - Click **Confirm** in MetaMask.
     - The UI shows "Broadcasting transaction to Base Sepolia testnet... Waiting for block confirmation...".
     - Once mined, the **ResultArtifact** appears with:
       - Green checkmark: "Base Sepolia Transfer Confirmed"
       - Verified Transaction Hash with direct link to `https://sepolia.basescan.org/tx/...`
       - Mined Block Number and Gas Used.
  4. *Option B (Demonstration / Cancellation):*
     - Click **Reject** in MetaMask.
     - The UI displays: *"Transaction signature rejected by user."*
     - Emphasize that the app truthfully reports rejection and **never fabricates a mock transaction hash or claims success without an on-chain receipt**.
- **Voiceover:**
  > *"When the user clicks approval, MetaMask prompts for authorization.  
  > [Option A]: Once confirmed, DebtTrap Escape waits for the mined block receipt via `tx.wait(1)`. Upon confirmation, the verified block number, gas used, and direct Basescan link are rendered truthfully.  
  > [Option B]: If the user rejects the prompt, the application gracefully reports the cancellation. We never simulate success or fabricate transaction hashes."*

---

### **Scene 6: Multi-Rail Isolation & Summary (2:20 – 2:35)**
- **Visual:** Return to the transfer tab and quickly toggle between **Base Sepolia (ETH)**, **Sepolia (USDC)**, and **Simulated (SIM-USDC)** to show complete separation.
- **Voiceover:**
  > *"With Base Sepolia ETH, Ethereum Sepolia USDC, and local SQLite simulation operating side-by-side, DebtTrap Escape delivers multi-rail Web3 safety without compromise.*  
  > *Thank you for watching!"*

---

## 🎯 Recording Tips
- **Resolution:** 1920x1080 (1080p).
- **Audio:** Crisp microphone, deliberate cadence.
- **File Name:** `DebtTrapEscape_Week3_Demo.mp4`.
- **Upload:** Upload to Google Drive (public link) or YouTube (unlisted/public), then update the submission URL in `README.md`.
