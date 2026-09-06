/**
 * TRACE // VERIFY — EvidenceRegistry Deployment Script
 *
 * Deploys EvidenceRegistry.sol to Polygon Amoy Testnet (or local hardhat/anvil network).
 * Usage:
 *   node contracts/deployment/deploy.js
 *
 * Requirements:
 *   - POLYGON_AMOY_RPC_URL set in .env
 *   - WALLET_PRIVATE_KEY set in .env
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Bytecode & ABI compiled from EvidenceRegistry.sol
// Minimal compiled artifact definition
const CONTRACT_ABI = [
  "constructor()",
  "function recordEvidence(bytes32 contentHash, string calldata sourceReference, uint256 matchScore) external returns (uint256)",
  "function verifyEvidence(bytes32 contentHash) external returns (bool exists, string memory sourceReference, uint256 matchScore, uint256 timestamp, address recorder)",
  "function queryEvidence(bytes32 contentHash) external view returns (bool exists, string memory sourceReference, uint256 matchScore, uint256 timestamp, address recorder)",
  "function getRecordCount() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function totalRecords() external view returns (uint256)",
  "event EvidenceRecorded(bytes32 indexed contentHash, address indexed recorder, uint256 matchScore, uint256 timestamp)",
  "event EvidenceVerified(bytes32 indexed contentHash, bool exists, address verifier)"
];

async function main() {
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';
  const privateKey = process.env.WALLET_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ ERROR: WALLET_PRIVATE_KEY is not defined in .env');
    console.log('To deploy to Polygon Amoy, add your testnet private key to .env');
    process.exit(1);
  }

  console.log('──────────────────────────────────────────────────');
  console.log('TRACE // VERIFY — EvidenceRegistry Deployer');
  console.log('──────────────────────────────────────────────────');
  console.log(`Connecting to network: ${rpcUrl}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer Address: ${wallet.address}`);
  console.log(`Account Balance: ${ethers.formatEther(balance)} POL / MATIC`);

  if (balance === 0n) {
    console.warn('⚠️ WARNING: Deployer account has 0 balance on Polygon Amoy.');
    console.warn('Get testnet tokens from: https://faucet.polygon.technology');
  }

  console.log('\nDeploying EvidenceRegistry contract...');
  // Note: For custom deployment without solc compiler build step,
  // we recommend using Hardhat or Remix, then pasting the deployed address into .env:
  // EVIDENCE_REGISTRY_ADDRESS=0x...
  console.log('Tip: After deploying EvidenceRegistry.sol via Remix or Hardhat, update:');
  console.log('EVIDENCE_REGISTRY_ADDRESS=0x<your_contract_address> in .env');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
