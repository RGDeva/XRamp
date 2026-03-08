/**
 * Avalanche settlement via arbiter LP wallet.
 *
 * On Fuji testnet the LFJ USDC token (0xB607…) has owner-gated mint(),
 * so the old mint→swap path fails. Instead the arbiter wallet (which holds
 * real AVAX from testnet funding) sends AVAX directly to the recipient.
 *
 * This is truthful for the demo: escrow is released → arbiter LP delivers
 * AVAX to the buyer's wallet on-chain. On mainnet this step would be a real
 * DEX swap; on Fuji it is a direct AVAX transfer from the LP reserve.
 */

import { ethers } from 'ethers';
import type { Env } from './worker';

// Fixed AVAX amount per $1 USD on Fuji testnet (≈ $25/AVAX → 0.04 AVAX per $1)
// Adjust this constant to match current testnet price for demo accuracy.
const AVAX_PER_USD = 0.04; // 1 USD ≈ 0.04 AVAX at ~$25/AVAX

/**
 * Settle USDC→AVAX: send AVAX from arbiter LP wallet to recipient.
 * Returns { swapTxHash, amountIn, amountOutMin } — same shape as before
 * so worker.ts needs no changes.
 */
export async function swapUsdcToAvaxOnLfj(
  env: Env,
  amountUsd: string,
  recipient: string,
): Promise<{ swapTxHash: string; amountIn: string; amountOutMin: string }> {
  if (!env.ARBITER_PRIVATE_KEY) throw new Error('ARBITER_PRIVATE_KEY not configured');
  if (!recipient || !ethers.isAddress(recipient)) throw new Error('Invalid recipient address');

  const provider = new ethers.JsonRpcProvider(env.FUJI_RPC_URL);
  const arbiter = new ethers.Wallet(env.ARBITER_PRIVATE_KEY, provider);

  // Calculate AVAX amount: $1 USD → AVAX_PER_USD AVAX
  const usdAmount = parseFloat(amountUsd) || 1;
  const avaxAmount = usdAmount * AVAX_PER_USD;
  const avaxWei = ethers.parseEther(avaxAmount.toFixed(6));

  // Check arbiter has enough AVAX
  const balance = await provider.getBalance(arbiter.address);
  const gasReserve = ethers.parseEther('0.01'); // keep 0.01 AVAX for gas
  if (balance < avaxWei + gasReserve) {
    throw new Error(
      `Arbiter AVAX balance too low: has ${ethers.formatEther(balance)} AVAX, ` +
      `needs ${ethers.formatEther(avaxWei + gasReserve)} AVAX`
    );
  }

  // Send AVAX directly to recipient
  const tx = await arbiter.sendTransaction({
    to: recipient,
    value: avaxWei,
  });
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Transaction receipt is null');

  return {
    swapTxHash: receipt.hash,
    amountIn: amountUsd,
    amountOutMin: avaxAmount.toFixed(6),
  };
}
