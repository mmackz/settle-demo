import type { Address, Hex } from 'viem';

// Boost API types
export interface RewardKitIncentive {
  type: string;
  assetAddress?: Address;
  rewardAmount?: string;
  rewardAmountFormatted?: string;
  rewardPercentage?: number;
  maxReward?: string;
  maxRewardUsdValue?: number;
  rewardUsdValue?: number;
  tokenSymbol?: string;
  tokenImageUri?: string;
  metadata?: {
    id: string;
    chainId: number;
    address: Address;
    decimals: number;
    name: string;
    symbol: string;
    imageUri: string;
  };
}

export interface ClaimSignatureData {
  incentiveId: number;
  signature: Hex;
  claimant: Address;
  referrer: Address;
}

export interface RewardKitBoost {
  id: string;
  chainId: number;
  boostName: string | null;
  incentives: RewardKitIncentive[];
  status?: 'active' | 'claimable' | 'claimed';
  txHash?: string;
  blockTimestamp?: string;
  signature?: ClaimSignatureData;
}

export interface RewardKitResponse {
  activeBoosts: RewardKitBoost[];
  claimableBoosts: RewardKitBoost[];
  claimedBoosts: RewardKitBoost[];
  totalClaimableAmountUsd: number;
  totalClaimedAmountUsd: number;
}

// Merchant types
export interface Merchant {
  id: string;
  name: string;
  location: string;
  category: string;
  discountBadge: string;
  logoUrl: string;
}

export interface MerchantWithBoost extends Merchant {
  boost: RewardKitBoost | null;
  merchantBoostId: string | null;
}

// Claim signature type
export interface ClaimSignature {
  claimant: Address;
  incentiveId: number;
  signature: Hex;
  referrer?: Address;
}
