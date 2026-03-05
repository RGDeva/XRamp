/**
 * On-chain escrow interaction for Fuji (Avalanche C-Chain testnet).
 * Uses ethers.js to call XRampEscrow.release(escrowId) from the arbiter wallet.
 */

import { ethers } from 'ethers';
import type { Env } from './worker';

const ESCROW_ABI = [
  'function release(uint256 escrowId) external',
  'function cancel(uint256 escrowId) external',
  'function escrows(uint256) view returns (address token, uint256 amount, address payer, address payee, address arbiter, uint8 state)',
  'event EscrowReleased(uint256 indexed escrowId)',
];

export async function releaseEscrow(env: Env, escrowId: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(env.FUJI_RPC_URL);
  const signer = new ethers.Wallet(env.ARBITER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(env.ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await contract.release(BigInt(escrowId));
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function cancelEscrow(env: Env, escrowId: string): Promise<string> {
  const provider = new ethers.JsonRpcProvider(env.FUJI_RPC_URL);
  const signer = new ethers.Wallet(env.ARBITER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(env.ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

  const tx = await contract.cancel(BigInt(escrowId));
  const receipt = await tx.wait();
  return receipt.hash;
}
