import { fromHex, type Address } from 'viem';

/**
 * Decode hex-encoded merchantId from boost actionSteps
 */
export function decodeMerchantId(hexString: `0x${string}`): string {
  return fromHex(hexString, 'string');
}

/**
 * Parse boost ID format: "chainId:contractAddress:boostIndex"
 */
export function parseBoostId(boostId: string) {
  const parts = boostId.split(':');
  return {
    chainId: parseInt(parts[0], 10),
    boostCoreAddress: parts[1] as Address,
    boostIndex: BigInt(parts[2]),
  };
}

/**
 * Format USD value
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
