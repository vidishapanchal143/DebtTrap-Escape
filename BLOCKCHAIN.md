# Blockchain Integration — DebtTrap Escape

## Purpose

The `EvidenceHashRegistry` smart contract allows users to anchor SHA-256 document hashes on-chain. This connects the browser-side Web Crypto hashing feature (already present in the app) to an immutable, timestamped on-chain record.

**Only 32-byte hash digests are stored — no personal or financial documents are transmitted to or stored on-chain.**

---

## Intended Blockchain

| Property | Value |
|---|---|
| Network | Ethereum Sepolia Testnet |
| Chain ID | `11155111` |
| Currency | Sepolia ETH (test, no real value) |
| Explorer | https://sepolia.etherscan.io |
| Solidity version | `^0.8.24` |

---

## Smart Contract

**File:** [`contracts/EvidenceHashRegistry.sol`](./contracts/EvidenceHashRegistry.sol)

### Key functions

| Function | Description |
|---|---|
| `anchorHash(bytes32 hash32, string label)` | Register a new SHA-256 hash; emits `HashAnchored`; idempotent. |
| `anchoredAt(address owner, bytes32 hash32)` | Returns the block timestamp when anchored, or 0. |
| `isAnchored(bytes32 hash32)` | Returns true if the caller has anchored this hash. |

### Events

```solidity
event HashAnchored(
    address indexed owner,
    bytes32 indexed hash,
    uint256 timestamp,
    string label
);
```

---

## Deployment Status

> **Deployed and verified on Ethereum Sepolia.**

### Deployment record

```
Contract address:   0x8638143982BfddAc9a8c60A49A6d119c5a607aBd
Transaction hash:   0x3cd02face0889e72c5e4e72a5bfdeded9148320c3b618fbcdc4e8005b986de83
Block:              11942390
Deployed by:        0xa22F4B4Fc51e80b7370568EC5778B777586929C0
Network:            Ethereum Sepolia (chainId 11155111)
Etherscan:          https://sepolia.etherscan.io/address/0x8638143982BfddAc9a8c60A49A6d119c5a607aBd
```

---

## How to Deploy

### Prerequisites

1. Install Hardhat dev tooling:
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
   ```

2. Add to `.env.local` (never commit this file):
   ```
   DEPLOYER_PRIVATE_KEY=0x...your_sepolia_private_key...
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

3. Get free Sepolia ETH from:
   - https://sepoliafaucet.com
   - https://faucet.alchemy.com/drips/sepolia

### Deployment steps

```bash
# Compile the contract
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan (optional but recommended)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

---

## Security Notes

- **Never** share, commit, or transmit private keys or seed phrases.
- The contract **never** holds ETH and rejects any accidental sends.
- Only SHA-256 hashes (not document contents) are stored on-chain.
- The `anchorHash` function is idempotent — re-anchoring the same hash costs only a failed-transaction fee and emits no duplicate events.

---

## Connecting to the AI Agent

After deployment, the contract address can be registered as an AI agent tool, allowing the agent to:

1. **Read**: Look up whether a specific hash is anchored (read-only, no wallet needed).
2. **Propose**: Suggest anchoring a new hash (requires wallet authorization from the user).

The agent will **never** initiate a state-changing transaction without explicit user confirmation and wallet authorization. Seed phrases and private keys must never be shared with the agent.
