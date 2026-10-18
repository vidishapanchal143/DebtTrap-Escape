import hre from "hardhat";
const { ethers } = hre;

async function main() {
  const EvidenceHashRegistry = await ethers.getContractFactory("EvidenceHashRegistry");
  console.log("Deploying EvidenceHashRegistry to Sepolia...");
  const contract = await EvidenceHashRegistry.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const txHash = deployTx ? deployTx.hash : "N/A";
  console.log("EvidenceHashRegistry deployed at:", address);
  console.log("Deployment transaction hash:", txHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
