// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EvidenceHashRegistry
 * @notice A minimal, gas-efficient on-chain registry for SHA-256 evidence hashes.
 *
 * Purpose
 * -------
 * DebtTrap Escape allows users to compute SHA-256 hashes of loan agreement
 * documents entirely in the browser (via the Web Crypto API). This contract
 * lets a user anchor those hashes on-chain so they can later prove that a
 * specific file existed and was unchanged at a given block time.
 *
 * Key design decisions
 * --------------------
 * 1. **No stored documents** – only 32-byte hash digests are stored, so no
 *    personal or financial data ever touches the chain.
 * 2. **Immutable entries** – once a hash is anchored it cannot be deleted,
 *    preserving the integrity timeline.
 * 3. **One timestamp per (owner, hash) pair** – subsequent calls for the same
 *    hash by the same owner are ignored (idempotent), preventing duplicate
 *    events from inflating gas costs.
 * 4. **No custody of funds** – the contract never holds ETH; any accidental
 *    ETH send is rejected.
 * 5. **Owner-anchored** – hashes are associated with msg.sender, so different
 *    users independently registering the same hash are tracked separately.
 *
 * Intended testnet
 * ----------------
 * Ethereum Sepolia (chainId 11155111).
 * Deployment requires a funded Sepolia wallet and a public RPC endpoint such
 * as Alchemy or Infura.  See BLOCKCHAIN.md in this repository for instructions.
 *
 * Contract address
 * ----------------
 * Not yet deployed.  Will be recorded in BLOCKCHAIN.md upon successful
 * deployment, including the transaction hash and block number.
 */
contract EvidenceHashRegistry {
    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /**
     * @notice Emitted when a new hash is anchored.
     * @param owner   The wallet address that anchored the hash.
     * @param hash    The 32-byte SHA-256 digest (bytes32 form).
     * @param timestamp The block timestamp at anchor time.
     * @param label   An optional human-readable label (e.g. "Loan agreement 2024").
     */
    event HashAnchored(
        address indexed owner,
        bytes32 indexed hash,
        uint256 timestamp,
        string label
    );

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /**
     * @dev Maps owner → hash → block timestamp (0 = not anchored).
     * Using uint256 timestamp means we can distinguish "not anchored" (0) from
     * any real timestamp without an extra boolean field.
     */
    mapping(address => mapping(bytes32 => uint256)) private _anchoredAt;

    // -------------------------------------------------------------------------
    // Public functions
    // -------------------------------------------------------------------------

    /**
     * @notice Anchor a SHA-256 evidence hash on-chain.
     * @dev    Idempotent: calling again with the same hash does nothing and
     *         returns false.  Emits HashAnchored only on first registration.
     * @param  hash32   The 32-byte SHA-256 digest to anchor.
     * @param  label    An optional human-readable label (max 200 bytes).
     *                  Stored in the event log only; not in contract storage.
     * @return anchored True if this was a new registration; false if already
     *                  registered by this caller.
     */
    function anchorHash(bytes32 hash32, string calldata label)
        external
        returns (bool anchored)
    {
        require(hash32 != bytes32(0), "EvidenceHashRegistry: zero hash rejected");
        require(bytes(label).length <= 200, "EvidenceHashRegistry: label too long");

        if (_anchoredAt[msg.sender][hash32] != 0) {
            // Already registered by this owner – idempotent, no event emitted.
            return false;
        }

        _anchoredAt[msg.sender][hash32] = block.timestamp;
        emit HashAnchored(msg.sender, hash32, block.timestamp, label);
        return true;
    }

    /**
     * @notice Look up when a hash was anchored by a given owner.
     * @param  owner  The wallet address that registered the hash.
     * @param  hash32 The 32-byte SHA-256 digest.
     * @return timestamp The block timestamp when anchored, or 0 if not found.
     */
    function anchoredAt(address owner, bytes32 hash32)
        external
        view
        returns (uint256 timestamp)
    {
        return _anchoredAt[owner][hash32];
    }

    /**
     * @notice Convenience helper: returns true if the caller has anchored hash32.
     * @param  hash32 The 32-byte SHA-256 digest.
     */
    function isAnchored(bytes32 hash32) external view returns (bool) {
        return _anchoredAt[msg.sender][hash32] != 0;
    }

    // -------------------------------------------------------------------------
    // Safety
    // -------------------------------------------------------------------------

    /// @dev Reject any accidental ETH transfers; this contract holds no funds.
    receive() external payable {
        revert("EvidenceHashRegistry: ETH not accepted");
    }

    fallback() external payable {
        revert("EvidenceHashRegistry: unknown function");
    }
}
