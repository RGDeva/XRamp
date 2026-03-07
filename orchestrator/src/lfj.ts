/**
 * LFJ (Trader Joe) DEX integration for Fuji testnet.
 * Swaps USDC → AVAX via LBRouter V2.1 on Avalanche Fuji.
 */

import { ethers } from 'ethers';
import type { Env } from './worker';

// LFJ V2.1 Fuji testnet addresses
const LFJ_ROUTER_V2_1 = '0xb4315e873dBcf96Ffd0acd8EA43f689D8c20fB30';
const LFJ_USDC_FUJI = '0xB6076C93701D6a07266c31066B298AeC6dd65c2d';
const WAVAX_FUJI = '0xd00ae08403B9bbb9124bB305C09058E32C39A48c'; // WAVAX on Fuji

// Bin step for AVAX-USDC V2.1 pool (20bps)
const AVAX_USDC_BIN_STEP = 20;

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function mint(address to, uint256 amount)',
];

// LBRouter V2.1 minimal ABI for swapExactTokensForNATIVE
const LB_ROUTER_ABI = [
  `function swapExactTokensForNATIVE(
    uint256 amountIn,
    uint256 amountOutMinNATIVE,
    tuple(uint256[] pairBinSteps, uint8[] versions, address[] tokenPath) path,
    address payable to,
    uint256 deadline
  ) external returns (uint256 amountOut)`,
  `function getWNATIVE() external view returns (address)`,
];

/**
 * Swap USDC → AVAX on LFJ V2.1 (Fuji testnet).
 * Uses the arbiter wallet. Mints LFJ test USDC first, then swaps via LBRouter.
 * Returns { swapTxHash, amountIn, amountOut }.
 */
export async function swapUsdcToAvaxOnLfj(
  env: Env,
  amountUsd: string,
  recipient: string,
): Promise<{ swapTxHash: string; amountIn: string; amountOutMin: string }> {
  if (!env.ARBITER_PRIVATE_KEY) throw new Error('ARBITER_PRIVATE_KEY not configured');

  const provider = new ethers.JsonRpcProvider(env.FUJI_RPC_URL);
  const arbiter = new ethers.Wallet(env.ARBITER_PRIVATE_KEY, provider);

  const amount = ethers.parseUnits(amountUsd, 6); // USDC 6 decimals

  const lfjUsdc = new ethers.Contract(LFJ_USDC_FUJI, ERC20_ABI, arbiter);
  const router = new ethers.Contract(LFJ_ROUTER_V2_1, LB_ROUTER_ABI, arbiter);

  // 1. Mint LFJ test USDC to arbiter (testnet faucet — open mint)
  const mintTx = await lfjUsdc.mint(arbiter.address, amount);
  await mintTx.wait();

  // 2. Approve router to spend USDC
  const approveTx = await lfjUsdc.approve(LFJ_ROUTER_V2_1, amount);
  await approveTx.wait();

  // 3. Build swap path: USDC → WAVAX (native AVAX out)
  const path = {
    pairBinSteps: [AVAX_USDC_BIN_STEP],
    versions: [2], // V2.1 = version enum 2
    tokenPath: [LFJ_USDC_FUJI, WAVAX_FUJI],
  };

  const deadline = Math.floor(Date.now() / 1000) + 300; // 5 min
  const amountOutMin = 0; // Accept any amount on testnet

  // 4. Execute swap — USDC → AVAX, sent to recipient
  const swapTx = await router.swapExactTokensForNATIVE(
    amount,
    amountOutMin,
    path,
    recipient,
    deadline,
  );
  const swapReceipt = await swapTx.wait();

  return {
    swapTxHash: swapReceipt.hash,
    amountIn: amountUsd,
    amountOutMin: '0', // testnet — any amount accepted
  };
}
