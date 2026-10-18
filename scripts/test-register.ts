import hre from "hardhat";
import crypto from "crypto";

async function main() {
  const { ethers } = hre;
  const contractAddress = process.env.EVIDENCE_HASH_REGISTRY_ADDRESS;
  if (!contractAddress) {
    throw new Error("EVIDENCE_HASH_REGISTRY_ADDRESS not set in environment");
  }

  const [signer] = await ethers.getSigners();
  console.log("Using signer address:", signer.address);
  console.log("Contract address:", contractAddress);

  const registry = await ethers.getContractAt("EvidenceHashRegistry", contractAddress, signer);

  // Generate SHA-256 hash of a sample loan agreement evidence
  const sampleEvidence = "DebtTrap Escape - Verified Loan Sanction Letter - " + Date.now();
  const sampleHash = "0x" + crypto.createHash("sha256").update(sampleEvidence).digest("hex");
  const sampleLabel = "Sample Sanction Letter SHA-256";

  console.log("Evidence hash to anchor:", sampleHash);
  console.log("Broadcasting anchorHash transaction...");

  const tx = await registry.anchorHash(sampleHash, sampleLabel);
  console.log("Transaction broadcasted with hash:", tx.hash);

  console.log("Waiting for block confirmation on Sepolia...");
  const receipt = await tx.wait();
  console.log("Confirmed in block:", receipt?.blockNumber);
  console.log("Gas used:", receipt?.gasUsed.toString());
  console.log("Status:", receipt?.status === 1 ? "SUCCESS (1)" : "FAILED (0)");

  // Verify on-chain state
  const isAnchored = await registry.isAnchored(sampleHash);
  console.log("isAnchored verification:", isAnchored);

  const timestamp = await registry.anchoredAt(signer.address, sampleHash);
  console.log("anchoredAt timestamp:", timestamp.toString(), `(${new Date(Number(timestamp) * 1000).toISOString()})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
