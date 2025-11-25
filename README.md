# Boost Integration Guide

This guide explains how to integrate Boost cashback functionality into the Settle app. The integration is broken down into four parts:

1. [Setup & Configuration](#part-1-setup--configuration)
2. [Fetching Boost Data](#part-2-fetching-boost-data)
3. [Linking Boosts to Merchants](#part-3-linking-boosts-to-merchants)
4. [Claiming Rewards](#part-4-claiming-rewards)

---

## Part 1: Setup & Configuration

### Dependencies

Install the required packages:

```bash
pnpm add @boostxyz/sdk @tanstack/react-query viem wagmi
```

### Types

Define the types for the Boost API response. See `types/index.ts`:

```typescript
// Boost API types
interface RewardKitIncentive {
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

interface ClaimSignatureData {
  incentiveId: number;
  signature: Hex;
  claimant: Address;
  referrer: Address;
}

interface RewardKitBoost {
  id: string;                    // Format: "chainId:contractAddress:boostIndex"
  chainId: number;
  boostName: string | null;
  incentives: RewardKitIncentive[];
  status?: 'active' | 'claimable' | 'claimed';
  txHash?: string;
  blockTimestamp?: string;
  signature?: ClaimSignatureData; // Only present for claimable boosts
}

interface RewardKitResponse {
  activeBoosts: RewardKitBoost[];     // User eligible but hasn't completed action
  claimableBoosts: RewardKitBoost[];  // Ready to claim (has signature)
  claimedBoosts: RewardKitBoost[];    // Already claimed
  totalClaimableAmountUsd: number;
  totalClaimedAmountUsd: number;
}
```

### Boost Provider

Create a provider to initialize the Boost SDK. See `components/providers/BoostProvider.tsx`:

```typescript
'use client';

import { BoostCore } from '@boostxyz/sdk';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { config } from '@/lib/wagmi';

interface BoostContextValue {
  core: BoostCore;
}

const BoostContext = createContext<BoostContextValue | null>(null);

export function useBoost() {
  const context = useContext(BoostContext);
  if (!context) {
    throw new Error('useBoost must be used within BoostProvider');
  }
  return context;
}

export function BoostProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({
    core: new BoostCore({ config }),
  }), []);

  return (
    <BoostContext.Provider value={value}>
      {children}
    </BoostContext.Provider>
  );
}
```

Wrap your app with the provider (along with wagmi and React Query providers).

---

## Part 2: Fetching Boost Data

### Query Configuration

Create a query to fetch boosts from the Reward Kit API. See `queries/getBoosts.ts`:

```typescript
import { queryOptions } from '@tanstack/react-query';
import { type Address, isAddress } from 'viem';
import type { RewardKitResponse } from '@/types';

const API_URL = 'https://api-v2.boost.xyz';
const BUDGET_ACCOUNT = '0x1a3e67ace4bf9969f4ce48a65cd8653a24b10983'; // Replace with your budget account. (This is the budget account for Scout)

export const getBoosts = (claimantAddress?: Address) => {
  const normalizedAddress = claimantAddress?.toLowerCase() ?? '0x';
  const enabled = isAddress(normalizedAddress);

  return queryOptions({
    queryKey: ['boosts', { address: normalizedAddress }],
    queryFn: async (): Promise<RewardKitResponse> => {
      const url = new URL(`${API_URL}/reward-kit`);
      url.searchParams.append('claimantAddress', normalizedAddress);
      url.searchParams.append('budgetAccount', BUDGET_ACCOUNT);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch boosts');
      }
      return response.json();
    },
    enabled,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
    // In production, refetch this query after a payment is made to a merchant
    // (instead of using refetchInterval) to show the new claimable reward.
    // Add a delay (e.g., 3-5 seconds) to allow the backend to process the payment
    // before invalidating the query:
    // setTimeout(() => queryClient.invalidateQueries({ queryKey: ['boosts'] }), 5000)
  });
};
```

### Understanding Boost Statuses

- **`activeBoosts`**: User is eligible for these boosts but hasn't completed the required action (e.g., made a payment)
- **`claimableBoosts`**: User has completed the action and can claim. These include a `signature` field required for claiming
- **`claimedBoosts`**: Already claimed rewards

---

## Part 3: Linking Boosts to Merchants

Each boost is associated with a merchant via the merchant ID encoded in the boost's action steps. This requires using the Boost SDK to decode the merchant ID.

### Utility Functions

See `lib/utils.ts`:

```typescript
import { fromHex, type Address, type Hex } from 'viem';

/**
 * Decode hex-encoded merchantId from boost actionSteps
 */
export function decodeMerchantId(hexString: Hex): string {
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
```

### Query to Get Merchant ID from Boost

See `queries/getBoostMerchantId.ts`:

```typescript
import { queryOptions } from '@tanstack/react-query';
import type { BoostCore } from '@boostxyz/sdk';
import { parseBoostId, decodeMerchantId } from '@/lib/utils';
import { base } from 'viem/chains';

export const getBoostMerchantId = (boostId: string, core: BoostCore) => {
  const { boostIndex } = parseBoostId(boostId);

  return queryOptions({
    queryKey: ['boostMerchantId', boostId],
    queryFn: async (): Promise<string | null> => {
      try {
        const boost = await core.getBoost(boostIndex, { chainId: base.id });
        const actionSteps = await boost.action.getActionSteps({ chainId: base.id });
        const merchantIdHex = actionSteps[2]?.actionParameter?.filterData;

        if (!merchantIdHex) {
          return null;
        }

        return decodeMerchantId(merchantIdHex as `0x${string}`);
      } catch (error) {
        console.error('Failed to get merchant ID for boost:', boostId, error);
        return null;
      }
    },
    staleTime: Infinity, // Merchant ID never changes for a boost
  });
};
```

### Combining Boosts with Merchants

See `hooks/useMerchantBoosts.ts`:

```typescript
'use client';

import { useQuery, useQueries } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useBoost } from '@/components/providers/BoostProvider';
import { getBoosts } from '@/queries/getBoosts';
import { getBoostMerchantId } from '@/queries/getBoostMerchantId';
import { MERCHANTS } from '@/lib/constants';
import type { MerchantWithBoost, RewardKitBoost } from '@/types';

export function useMerchantBoosts() {
  const { address } = useAccount();
  const { core } = useBoost();

  // 1. Fetch all boosts for the user
  const {
    data: boostsData,
    isLoading: isLoadingBoosts,
    error: boostsError,
  } = useQuery(getBoosts(address));

  // 2. Add status to each boost based on which array it came from
  const allBoosts: RewardKitBoost[] = [
    ...(boostsData?.activeBoosts ?? []).map((b) => ({ ...b, status: 'active' as const })),
    ...(boostsData?.claimableBoosts ?? []).map((b) => ({ ...b, status: 'claimable' as const })),
    ...(boostsData?.claimedBoosts ?? []).map((b) => ({ ...b, status: 'claimed' as const })),
  ];

  // 3. Fetch merchant IDs for each boost in parallel
  const merchantIdQueries = useQueries({
    queries: allBoosts.map((boost) => ({
      ...getBoostMerchantId(boost.id, core),
      enabled: !!boost.id,
    })),
  });

  const isLoadingMerchantIds = merchantIdQueries.some((q) => q.isLoading);

  // 4. Map merchant IDs to boosts, prioritizing claimable > active > claimed
  const merchantIdToBoost = new Map<string, RewardKitBoost>();
  const statusPriority = { claimable: 3, active: 2, claimed: 1 };

  allBoosts.forEach((boost, index) => {
    const merchantId = merchantIdQueries[index]?.data;
    if (merchantId) {
      const existingBoost = merchantIdToBoost.get(merchantId);
      const existingPriority = existingBoost ? statusPriority[existingBoost.status ?? 'claimed'] : 0;
      const newPriority = statusPriority[boost.status ?? 'claimed'];

      // Only set if no existing boost or new boost has higher priority
      if (!existingBoost || newPriority > existingPriority) {
        merchantIdToBoost.set(merchantId, boost);
      }
    }
  });

  // 5. Join merchants with their boosts.

  // In this app MERCHANTS is hardcoded. Instead you would use the response from the settle api to join the merchants with boosts
  const merchantsWithBoosts: MerchantWithBoost[] = MERCHANTS.map((merchant) => {
    const boost = merchantIdToBoost.get(merchant.id) ?? null;
    return {
      ...merchant,
      boost,
      merchantBoostId: boost?.id ?? null,
    };
  });

  return {
    merchants: merchantsWithBoosts,
    isLoading: isLoadingBoosts || isLoadingMerchantIds,
    error: boostsError,
    totalClaimableUsd: boostsData?.totalClaimableAmountUsd ?? 0,
    totalClaimedUsd: boostsData?.totalClaimedAmountUsd ?? 0,
  };
}
```

---

## Part 4: Claiming Rewards

### Claim Mutation

Use wagmi's `useWriteContract` to call the `claimIncentiveFor` function on the Boost Core contract. See `mutations/useClaimIncentive.ts`:

```typescript
'use client';

import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';
import { usePublicClient, useWriteContract } from 'wagmi';
import { boostCoreAbi } from '@boostxyz/sdk';
import { parseBoostId } from '@/lib/utils';
import type { ClaimSignatureData } from '@/types';
import { base } from 'wagmi/chains';

export function useClaimIncentive({
  boostId,
  address,
  signatureData,
}: {
  boostId: string;
  address?: Address;
  signatureData?: ClaimSignatureData;
}) {
  const { boostCoreAddress, boostIndex } = parseBoostId(boostId);

  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationKey: ['claimIncentive', { boostId, address }],
    mutationFn: async () => {
      if (!address) throw new Error('No connected address');
      if (!publicClient) throw new Error('No public client');
      if (!signatureData) throw new Error('No signature data available');

      const payload = {
        abi: boostCoreAbi,
        address: boostCoreAddress,
        functionName: 'claimIncentiveFor' as const,
        args: [
          boostIndex,
          BigInt(signatureData.incentiveId),
          signatureData.referrer,
          signatureData.signature,
          signatureData.claimant,
        ] as const,
        value: 0n,
      };

      // Simulate first to catch errors before sending
      const { request } = await publicClient.simulateContract(payload);
      return writeContractAsync(request);
    },
  });
}
```

### Optimistic Updates

The Boost API has a delay after claiming before the status updates to claimed on the backend. For a better UX, update the UI immediately after claiming without waiting for a refetch.

See `mutations/useOptimisticUpdate.ts`:

```typescript
import type { QueryClient } from '@tanstack/react-query';
import type { Address, Hash } from 'viem';
import type { RewardKitResponse } from '@/types';

export function optimisticallyUpdateAfterClaim(
  queryClient: QueryClient,
  address: Address,
  boostId: string,
  txHash: Hash
) {
  const normalizedAddress = address.toLowerCase() as Address;
  const queryKey = ['boosts', { address: normalizedAddress }];

  // Cancel any in-flight queries
  queryClient.cancelQueries({ queryKey });

  // Update the cache optimistically
  queryClient.setQueryData<RewardKitResponse>(queryKey, (oldData) => {
    if (!oldData) return oldData;

    const claimableBoost = oldData.claimableBoosts?.find(
      (boost) => boost.id === boostId
    );
    if (!claimableBoost) return oldData;

    // Move from claimable to claimed
    const updatedClaimableBoosts = oldData.claimableBoosts.filter(
      (boost) => boost.id !== boostId
    );

    const claimedBoost = {
      ...claimableBoost,
      status: 'claimed' as const,
      txHash,
      blockTimestamp: Math.floor(Date.now() / 1000).toString(),
    };

    const rewardUsdValue = claimableBoost.incentives[0]?.rewardUsdValue ?? 0;

    return {
      ...oldData,
      claimableBoosts: updatedClaimableBoosts,
      claimedBoosts: [claimedBoost, ...(oldData.claimedBoosts ?? [])],
      totalClaimedAmountUsd: (oldData.totalClaimedAmountUsd ?? 0) + rewardUsdValue,
      totalClaimableAmountUsd: (oldData.totalClaimableAmountUsd ?? 0) - rewardUsdValue,
    };
  });

  // Refetch after a delay to sync with backend
  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey });
  }, 10_000);
}
```

### Claim Button Component

See `components/merchants/ClaimButton.tsx` for a complete implementation that:
- Shows different states (Claim, Processing, Claimed, Error/Retry)
- Handles wallet confirmation flow
- Waits for transaction receipt
- Triggers optimistic update on success

```typescript
// Key flow:
// 1. User clicks claim button
// 2. Call useClaimIncentive mutation
// 3. Wallet prompts for signature
// 4. Wait for transaction receipt with useWaitForTransactionReceipt
// 5. On success, call optimisticallyUpdateAfterClaim
// 6. Show success state (modal with confetti, etc.)
```

---

## Summary

| Part | Files | Purpose |
|------|-------|---------|
| Setup | `types/index.ts`, `components/providers/BoostProvider.tsx` | Types and SDK initialization |
| Fetch | `queries/getBoosts.ts` | Get user's boosts from API |
| Link | `queries/getBoostMerchantId.ts`, `hooks/useMerchantBoosts.ts`, `lib/utils.ts` | Map boosts to merchants |
| Claim | `mutations/useClaimIncentive.ts`, `mutations/useOptimisticUpdate.ts` | Execute claim transaction |

### Key Points

1. **Budget Account**: The `budgetAccount` parameter identifies which boosts to fetch
2. **Signature Data**: Only `claimableBoosts` have the `signature` field needed for claiming
3. **Merchant ID**: Encoded in `actionSteps[2].actionParameter.filterData` of each boost
4. **Priority**: When a merchant has multiple boosts, prioritize claimable > active > claimed
5. **Optimistic Updates**: Update UI immediately, then sync with backend after delay
6. **Post-Payment Refetch**: After a payment, wait 3-5 seconds then invalidate the boosts query

---

## Files of Interest

### Core Integration Files

| File | Description |
|------|-------------|
| `types/index.ts` | TypeScript types for Boost API responses, merchants, and claims |
| `lib/utils.ts` | Utility functions for parsing boost IDs and decoding merchant IDs |
| `lib/constants.ts` | Chain configuration and hardcoded merchant data |
| `lib/wagmi.ts` | Wagmi configuration for wallet connections |

### Providers

| File | Description |
|------|-------------|
| `components/providers/BoostProvider.tsx` | Initializes BoostCore SDK and provides context |
| `components/providers/FarcasterProvider.tsx` | Farcaster Mini App SDK integration |
| `components/providers/Providers.tsx` | Combines all providers (wagmi, React Query, Boost, Farcaster) |

### Queries

| File | Description |
|------|-------------|
| `queries/getBoosts.ts` | Fetches user's boosts from Reward Kit API |
| `queries/getBoostMerchantId.ts` | Decodes merchant ID from boost action steps |

### Mutations

| File | Description |
|------|-------------|
| `mutations/useClaimIncentive.ts` | Executes the claim transaction on-chain |
| `mutations/useOptimisticUpdate.ts` | Updates React Query cache after claiming |

### Hooks

| File | Description |
|------|-------------|
| `hooks/useMerchantBoosts.ts` | Combines boosts with merchants, handles priority logic |

### UI Components

| File | Description |
|------|-------------|
| `components/merchants/RewardsList.tsx` | Displays active/claimable and claimed rewards with tabs |
| `components/merchants/ClaimButton.tsx` | Handles claim flow with loading/error states |
| `components/merchants/ClaimSuccessModal.tsx` | Success modal with confetti animation |
| `components/merchants/MerchantCard.tsx` | Displays merchant info with discount badge |
| `components/merchants/MerchantList.tsx` | Lists merchants with category filtering |

---

## More Resources

### Documentation

- [Boost SDK Overview](https://docs.boost.xyz/v2/boost-sdk/overview) - Official documentation for the Boost SDK
- [Reward Kit API Reference](https://docs.boost.xyz/v2/api-reference/rewardkit/get-a-users-rewardkit-profile) - API documentation for the Reward Kit endpoint used in this demo

### Budget Account Setup

Before you can use this integration, you'll need to update the BUDGET_ACCOUNT used in the boost API query with your own budget account address. This is the account you'll deploy your incentives from. (see `queries/getBoosts.ts` for an example)

```typescript
// queries/getBoosts.ts
const BUDGET_ACCOUNT = '0xYOUR_BUDGET_ACCOUNT_ADDRESS';
```

We'll be available to help you set this up and walk you through using the Boost Developer Portal to deploy your boosts. Reach out to us (see contact info below) and we'll guide you through the process.

### Need Help?

If you have any questions or need assistance with the Boost integration, please reach out to @mattie_eth or the (Boost <> Settle) group on Telegram 
