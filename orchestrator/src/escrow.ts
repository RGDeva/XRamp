/**
 * On-chain escrow interaction for Fuji (Avalanche C-Chain testnet).
 * Uses ethers.js to call XRampEscrow functions from the arbiter wallet.
 */

import { ethers } from 'ethers';
import type { Env } from './worker';

const ERC20_ABI = [
  'function mint(address to, uint256 amount)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const ESCROW_ABI = [
  'function createEscrow(address token, uint256 amount, address payer, address payee) returns (uint256)',
  'function deposit(uint256 escrowId)',
  'function release(uint256 escrowId) external',
  'function cancel(uint256 escrowId) external',
  'function escrows(uint256) view returns (address token, uint256 amount, address payer, address payee, address arbiter, uint8 state)',
  'event EscrowCreated(uint256 indexed escrowId, address token, uint256 amount, address payer, address payee)',
  'event EscrowFunded(uint256 indexed escrowId, address payer, uint256 amount)',
  'event EscrowReleased(uint256 indexed escrowId)',
];

/**
 * Arbiter wallet mints test USDC, then creates + funds a new escrow.
 * payer = arbiter (LP in demo), payee = user delivery address.
 * Returns { escrowId, depositTxHash, payer }.
 */
export async function fundEscrowForIntent(
  env: Env,
  amountUsd: string,
  payee: string,
): Promise<{ escrowId: string; depositTxHash: string; payer: string }> {
  if (!env.ARBITER_PRIVATE_KEY) throw new Error('ARBITER_PRIVATE_KEY not configured');
  if (!env.ESCROW_CONTRACT_ADDRESS) throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
  if (!env.MOCK_USDC_ADDRESS) throw new Error('MOCK_USDC_ADDRESS not configured');

  const provider = new ethers.JsonRpcProvider(env.FUJI_RPC_URL);
  const arbiter = new ethers.Wallet(env.ARBITER_PRIVATE_KEY, provider);

  // $amountUsd → 6-decimal USDC units
  const amount = ethers.parseUnits(amountUsd, 6);

  const token = new ethers.Contract(env.MOCK_USDC_ADDRESS, ERC20_ABI, arbiter);
  const escrow = new ethers.Contract(env.ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, arbiter);

  // 1. Mint test USDC to arbiter wallet
  const mintTx = await token.mint(arbiter.address, amount);
  await mintTx.wait();

  // 2. Create escrow: payer = arbiter (LP), payee = user
  const createTx = await escrow.createEscrow(
    env.MOCK_USDC_ADDRESS,
    amount,
    arbiter.address,
    payee,
  );
  const createReceipt = await createTx.wait();

  // Parse EscrowCreated event to get escrowId
  const iface = escrow.interface;
  let escrowId = '0';
  for (const log of createReceipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === 'EscrowCreated') {
        escrowId = parsed.args.escrowId.toString();
        break;
      }
    } catch { /* skip non-matching logs */ }
  }

  // 3. Approve token spending by escrow contract
  const approveTx = await token.approve(env.ESCROW_CONTRACT_ADDRESS, amount);
  await approveTx.wait();

  // 4. Deposit into escrow
  const depositTx = await escrow.deposit(BigInt(escrowId));
  const depositReceipt = await depositTx.wait();

  return {
    escrowId,
    depositTxHash: depositReceipt.hash,
    payer: arbiter.address,
  };
}

/**
 * Fund escrow on behalf of a partner LP.
 *
 * Two modes depending on whether the partner has registered a private key:
 *
 * Mode A — partnerPrivateKey present:
 *   Partner wallet mints test USDC and creates + funds escrow directly.
 *   payer = partner wallet address (real capital attribution).
 *
 * Mode B — partnerPrivateKey absent:
 *   Returns { requiresSelfFunding: true, fundingWalletAddress } so the
 *   worker can return a 202 instructing the partner to call /report-funding.
 *   XRamp arbiter is NEVER substituted silently.
 *
 * Hard errors (422) are thrown for:
 *   - missing fundingWalletAddress (required even in Mode B)
 *   - invalid payee address
 */
export async function fundEscrowForPartner(
  env: Env,
  amountUsd: string,
  payee: string,
  partnerPrivateKey: string | undefined,
  fundingWalletAddress: string,
  escrowContractAddress?: string,
): Promise<
  | { requiresSelfFunding: false; escrowId: string; depositTxHash: string; payer: string }
  | { requiresSelfFunding: true; fundingWalletAddress: string }
> {
  if (!fundingWalletAddress) {
    throw new Error('Partner capital config is missing fundingWalletAddress');
  }
  if (!payee || !ethers.isAddress(payee)) {
    throw new Error('Invalid payee address');
  }

  // Mode B: no partner key — partner must self-fund
  if (!partnerPrivateKey) {
    return { requiresSelfFunding: true, fundingWalletAddress };
  }

  // Mode A: partner key present — fund from partner wallet
  const escrowAddr = escrowContractAddress || env.ESCROW_CONTRACT_ADDRESS;
  if (!escrowAddr) throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
  if (!env.MOCK_USDC_ADDRESS) throw new Error('MOCK_USDC_ADDRESS not configured');

  const provider = new ethers.JsonRpcProvider(env.FUJI_RPC_URL);
  const partnerWallet = new ethers.Wallet(partnerPrivateKey, provider);

  const amount = ethers.parseUnits(amountUsd, 6);

  const token = new ethers.Contract(env.MOCK_USDC_ADDRESS, ERC20_ABI, partnerWallet);
  const escrow = new ethers.Contract(escrowAddr, ESCROW_ABI, partnerWallet);

  // 1. Mint test USDC to partner wallet
  const mintTx = await token.mint(partnerWallet.address, amount);
  await mintTx.wait();

  // 2. Create escrow: payer = partner wallet, payee = user
  const createTx = await escrow.createEscrow(
    env.MOCK_USDC_ADDRESS,
    amount,
    partnerWallet.address,
    payee,
  );
  const createReceipt = await createTx.wait();

  const iface = escrow.interface;
  let escrowId = '0';
  for (const log of createReceipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === 'EscrowCreated') {
        escrowId = parsed.args.escrowId.toString();
        break;
      }
    } catch { /* skip non-matching logs */ }
  }

  // 3. Approve + deposit
  const approveTx = await token.approve(escrowAddr, amount);
  await approveTx.wait();

  const depositTx = await escrow.deposit(BigInt(escrowId));
  const depositReceipt = await depositTx.wait();

  return {
    requiresSelfFunding: false,
    escrowId,
    depositTxHash: depositReceipt.hash,
    payer: partnerWallet.address,
  };
}

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
