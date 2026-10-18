import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Load environment variables for Sepolia RPC and demo private key
const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.NEXT_PUBLIC_DEMO_PRIVATE_KEY; // demo only, never expose real funds

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error('Missing RPC URL or private key in environment variables');
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Load compiled contract artifact (ABI & bytecode). Ensure compilation output is placed at ./artifacts/EvidenceHashRegistry.json
const artifactPath = path.resolve(__dirname, '../../artifacts/EvidenceHashRegistry.json');
if (!fs.existsSync(artifactPath)) {
  throw new Error('Contract artifact not found. Compile the EvidenceHashRegistry.sol contract first.');
}
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
const { abi, bytecode } = artifact;

/** Deploy the EvidenceHashRegistry contract to Sepolia testnet */
export async function deployEvidenceHashRegistry(): Promise<string> {
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  return contract.getAddress();
}

/** Register a new evidence hash on a deployed contract */
export async function registerEvidenceHash(contractAddress: string, hash: string): Promise<string> {
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  const tx = await contract.registerEvidence(hash);
  const receipt = await tx.wait();
  return receipt?.hash ?? tx.hash;
}

/** Retrieve a stored evidence hash by its key */
export async function getEvidenceHash(contractAddress: string, key: string): Promise<string> {
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const value = await contract.evidences(key);
  return value;
}
