// ─── Fuji (Avalanche C-Chain Testnet) Utilities ──────────────────────────────
// Provides ERC20 balance reading, escrow interactions, and explorer URL helpers.

import { ethers } from 'ethers';
import fujiConfig from './fujiConfig.json';

// ─── Config ──────────────────────────────────────────────────────────────────

export const FUJI_CHAIN_ID = 43113;
export const FUJI_RPC = fujiConfig.rpcUrl || 'https://api.avax-test.network/ext/bc/C/rpc';
export const FUJI_EXPLORER = fujiConfig.explorerUrl || 'https://testnet.snowtrace.io';
export const MOCK_USDC_ADDRESS = fujiConfig.mockUsdcAddress || '';
export const ESCROW_ADDRESS = fujiConfig.escrowAddress || '';

// ─── ABIs (minimal) ─────────────────────────────────────────────────────────

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function mint(address to, uint256 amount)',
];

const ESCROW_ABI = [
  'function createEscrow(address token, uint256 amount, address payer, address payee) returns (uint256)',
  'function deposit(uint256 escrowId)',
  'function release(uint256 escrowId)',
  'function cancel(uint256 escrowId)',
  'function nextEscrowId() view returns (uint256)',
  'function escrows(uint256) view returns (address token, uint256 amount, address payer, address payee, address arbiter, uint8 state)',
  'event EscrowCreated(uint256 indexed escrowId, address token, uint256 amount, address payer, address payee)',
  'event EscrowFunded(uint256 indexed escrowId, address payer, uint256 amount)',
];

// ─── Provider ────────────────────────────────────────────────────────────────

let _provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) _provider = new ethers.JsonRpcProvider(FUJI_RPC);
  return _provider;
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export async function getUsdcBalance(walletAddress: string): Promise<{
  raw: bigint;
  formatted: string;
  decimals: number;
}> {
  if (!MOCK_USDC_ADDRESS || !walletAddress) {
    return { raw: 0n, formatted: '0.00', decimals: 6 };
  }

  const provider = getProvider();
  const token = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, provider);
  const [balance, decimals] = await Promise.all([
    token.balanceOf(walletAddress) as Promise<bigint>,
    token.decimals() as Promise<number>,
  ]);

  const formatted = ethers.formatUnits(balance, decimals);
  return { raw: balance, formatted, decimals };
}

// ─── Escrow (called from frontend via ethers signer from Privy wallet) ──────

/**
 * Create an escrow + approve + deposit, all via the user's Privy wallet signer.
 * Returns { escrowId, depositTxHash }.
 */
export async function createAndFundEscrow(
  signer: ethers.Signer,
  tokenAddress: string,
  amount: bigint,
  payerAddress: string,
  payeeAddress: string,
  onProgress?: (step: 'creating' | 'approving' | 'depositing') => void,
): Promise<{ escrowId: string; depositTxHash: string }> {
  if (!ESCROW_ADDRESS) throw new Error('Escrow contract not deployed');

  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

  // 1. Create escrow
  onProgress?.('creating');
  const createTx = await escrow.createEscrow(tokenAddress, amount, payerAddress, payeeAddress);
  const createReceipt = await createTx.wait();

  // Parse EscrowCreated event to get escrowId
  const createdEvent = createReceipt.logs
    .map((log: ethers.Log) => {
      try { return escrow.interface.parseLog({ topics: [...log.topics], data: log.data }); }
      catch { return null; }
    })
    .find((e: ethers.LogDescription | null) => e?.name === 'EscrowCreated');

  const escrowId = createdEvent?.args?.escrowId?.toString() || '0';

  // 2. Approve escrow to spend tokens
  onProgress?.('approving');
  const approveTx = await token.approve(ESCROW_ADDRESS, amount);
  await approveTx.wait();

  // 3. Deposit into escrow
  onProgress?.('depositing');
  const depositTx = await escrow.deposit(BigInt(escrowId));
  const depositReceipt = await depositTx.wait();

  return {
    escrowId,
    depositTxHash: depositReceipt.hash,
  };
}

/**
 * Mint test mUSDC to an address (testnet only — no access control on MockUSDC).
 */
export async function mintTestUsdc(
  signer: ethers.Signer,
  toAddress: string,
  amount: bigint,
): Promise<string> {
  if (!MOCK_USDC_ADDRESS) throw new Error('MockUSDC not deployed');
  const token = new ethers.Contract(MOCK_USDC_ADDRESS, ERC20_ABI, signer);
  const tx = await token.mint(toAddress, amount);
  const receipt = await tx.wait();
  return receipt.hash;
}

// ─── Explorer URLs ───────────────────────────────────────────────────────────

export function txUrl(txHash: string): string {
  return `${FUJI_EXPLORER}/tx/${txHash}`;
}

export function addressUrl(address: string): string {
  return `${FUJI_EXPLORER}/address/${address}`;
}
