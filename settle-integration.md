# Settle Integration Guide

This guide will help you integrate Boost cashback rewards into your Farcaster mini app. Users who make purchases at partner merchants through Settle will be able to claim cashback rewards directly in your app.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup & Configuration](#setup--configuration)
4. [Fetching Boosts](#fetching-boosts)
5. [Claim Flow Implementation](#claim-flow-implementation)
6. [Optimistic Updates](#optimistic-updates)
7. [Complete Example](#complete-example)
8. [TypeScript Types](#typescript-types)

---

## Overview

The integration flow works as follows:

1. **User makes a purchase** at a partner merchant through Settle
2. **Your app fetches available boosts** filtered by your budget account
3. **User sees claimable rewards** in your app
4. **User claims the reward** which executes an on-chain transaction
5. **Reward tokens are sent** directly to the user's wallet

---

## Prerequisites

Before starting, you'll need:

- [ ] A **budget account address** from Boost (we'll provide this)

---

## Setup & Configuration

### 1. Install Dependencies

```bash
npm install @boostxyz/sdk @tanstack/react-query wagmi viem @reown/appkit @reown/appkit-adapter-wagmi @farcaster/miniapp-wagmi-connector
```

### 2. Environment Variables

Create or update your `.env.local`:

```env
# Boost API
NEXT_PUBLIC_BOOST_API_URL=https://api-v2.boost.xyz

# Your budget account (provided by Boost)
NEXT_PUBLIC_BOOST_BUDGET_ACCOUNT=0x...
```

### 3. BoostProvider Setup

Create `components/BoostProvider.tsx`:

```typescript
'use client';

import { BoostCore, type BoostCoreConfig } from '@boostxyz/sdk';
import { createContext, useContext, useMemo } from 'react';
import { wagmiAdapter } from '@/lib/wagmi';

export interface IBoostContext {
  core: BoostCore;
}

export const BoostContext = createContext<IBoostContext>({
  core: new BoostCore({ config: wagmiAdapter.wagmiConfig }),
});

export function useBoost() {
  return useContext(BoostContext);
}

export function BoostProvider({
  children,
  core,
}: React.PropsWithChildren<{ core?: Omit<BoostCoreConfig, 'config'> }>) {
  const value = useMemo(() => {
    return {
      core: new BoostCore({ ...core, config: wagmiAdapter.wagmiConfig }),
    };
  }, [core]);

  return (
    <BoostContext.Provider value={value}>{children}</BoostContext.Provider>
  );
}
```

### 5. Wrap Your App

In your root layout or `_app.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import { BoostProvider } from '@/components/BoostProvider';

const queryClient = new QueryClient();

export default function App({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BoostProvider>
          {children}
        </BoostProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## Fetching Boosts

### API Endpoint

Fetch boosts for a user by calling the Reward Kit API:

```
GET https://api-v2.boost.xyz/reward-kit
```

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `claimantAddress` | Yes | User's wallet address (lowercase) |
| `budgetAccount` | Yes | Your Settle budget account address |

### React Query Hook

Create `queries/getSettleBoosts.ts`:

```typescript
import { queryOptions } from '@tanstack/react-query';
import { type Address, isAddress } from 'viem';

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
const budgetAccount = process.env.NEXT_PUBLIC_SETTLE_BUDGET_ACCOUNT!;

export interface RewardKitIncentive {
  type: string;
  assetAddress?: `0x${string}`;
  rewardAmount?: string;
  rewardAmountFormatted?: string;
  rewardPercentage?: number;
  maxReward?: string;
  rewardUsdValue?: number;
  tokenSymbol?: string;
  tokenImageUri?: string;
}

export interface RewardKitBoost {
  id: string;
  chainId: number;
  boostName: string | null;
  incentives: RewardKitIncentive[];
  status?: 'active' | 'claimable' | 'claimed';
  txHash?: string;
  blockTimestamp?: string;
}

export interface RewardKitResponse {
  activeBoosts: RewardKitBoost[];
  claimableBoosts: RewardKitBoost[];
  claimedBoosts: RewardKitBoost[];
  totalClaimableAmountUsd: number;
  totalClaimedAmountUsd: number;
}

export const getSettleBoosts = (claimantAddress?: Address) => {
  const normalizedAddress = claimantAddress?.toLowerCase() ?? '0x';
  const enabled = isAddress(normalizedAddress);

  return queryOptions({
    queryKey: ['settleBoosts', { address: normalizedAddress }],
    queryFn: async (): Promise<RewardKitResponse> => {
      const url = new URL(`${apiUrl}/reward-kit`);
      url.searchParams.append('claimantAddress', normalizedAddress);
      url.searchParams.append('budgetAccount', budgetAccount);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch boosts');
      }
      return response.json();
    },
    enabled,
    staleTime: 1000 * 15, // 15 seconds
    refetchInterval: 1000 * 30, // 30 seconds
  });
};
```

### Using the Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { getSettleBoosts } from '@/queries/getSettleBoosts';

function ClaimableRewards() {
  const { address } = useAccount();
  const { data, isLoading, error } = useQuery(getSettleBoosts(address));

  if (isLoading) return <div>Loading rewards...</div>;
  if (error) return <div>Error loading rewards</div>;

  const { claimableBoosts, totalClaimableAmountUsd } = data ?? {};

  return (
    <div>
      <h2>Claimable: ${totalClaimableAmountUsd?.toFixed(2)}</h2>
      {claimableBoosts?.map((boost) => (
        <div key={boost.id}>
          <p>{boost.boostName}</p>
          <p>
            {boost.incentives[0]?.rewardAmountFormatted}{' '}
            {boost.incentives[0]?.tokenSymbol}
          </p>
        </div>
      ))}
    </div>
  );
}
```

---

## Claim Flow Implementation

The claim flow involves 4 steps:
1. Fetch the claim signature from the API
2. Switch the user to the correct chain
3. Execute the contract call
4. Wait for transaction confirmation

### Step 1: Fetch Claim Signatures

Create `queries/getClaimSignatures.ts`:

```typescript
import { queryOptions } from '@tanstack/react-query';
import type { Address, Hex } from 'viem';

const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

export type ClaimSignature = {
  claimant: Address;
  incentiveId: number;
  signature: Hex;
  referrer?: Address;
};

export async function fetchClaimSignatures({
  boostId,
  address,
  incentiveId = 0,
}: {
  boostId: string;
  address: Address;
  incentiveId?: number;
}): Promise<ClaimSignature[]> {
  const params = new URLSearchParams({
    boostId,
    address,
    incentiveId: incentiveId.toString(),
  });

  const response = await fetch(`${apiUrl}/transactions?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch claim signatures');
  }
  return response.json();
}

export const getClaimSignatures = ({
  boostId,
  address,
  incentiveId = 0,
  enabled = true,
}: {
  boostId?: string;
  address?: Address;
  incentiveId?: number;
  enabled?: boolean;
}) => {
  return queryOptions({
    queryKey: ['claimSignatures', { boostId, address, incentiveId }],
    queryFn: () =>
      fetchClaimSignatures({
        boostId: boostId!,
        address: address!,
        incentiveId,
      }),
    enabled: enabled && !!boostId && !!address,
  });
};
```

### Step 2: Create the Claim Mutation

Create `mutations/useClaimIncentive.ts`:

```typescript
import {
  PayableLimitedSignerValidator,
  PayableLimitedSignerValidatorV2,
} from '@boostxyz/sdk';
import { useMutation } from '@tanstack/react-query';
import type { Address, Hex } from 'viem';
import { usePublicClient, useWriteContract } from 'wagmi';
import { useBoost } from '@/components/BoostProvider';
import { boostCoreAbi } from '@/abi/boostCoreAbi';

// Helper to parse boost ID format: "chainId:contractAddress:boostIndex"
function parseBoostId(boostId: string) {
  const parts = boostId.split(':');
  return {
    chainIdAsNumber: parseInt(parts[0], 10),
    boostCoreAddress: parts[1] as Address,
    boostIndex: BigInt(parts[2]),
  };
}

export function useClaimIncentive({
  boostId,
  address,
}: {
  boostId: string;
  address?: Address;
}) {
  const { core } = useBoost();
  const { chainIdAsNumber, boostCoreAddress, boostIndex } =
    parseBoostId(boostId);

  const publicClient = usePublicClient({ chainId: chainIdAsNumber });
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationKey: ['claimIncentive', { boostId, address }],
    mutationFn: async ({
      signature,
      claimant,
      incentiveId,
      referrer,
    }: {
      signature: Hex;
      claimant: Address;
      incentiveId: number;
      referrer: Address;
    }) => {
      if (!address) {
        throw new Error('No connected address');
      }
      if (!signature) {
        throw new Error('No signature available');
      }
      if (!publicClient) {
        throw new Error('No public client');
      }

      // Get boost data to check for claim fees
      const boost = await core.getBoost(boostIndex, {
        chainId: chainIdAsNumber,
      });

      // Check if validator requires a claim fee
      const validator = boost.validator;
      const claimFee =
        validator instanceof PayableLimitedSignerValidator ||
        validator instanceof PayableLimitedSignerValidatorV2
          ? await validator.getClaimFee()
          : 0n;

      // Prepare contract call
      const payload = {
        abi: boostCoreAbi,
        address: boostCoreAddress,
        functionName: 'claimIncentiveFor' as const,
        args: [
          boostIndex,
          BigInt(incentiveId),
          referrer,
          signature,
          claimant,
        ] as const,
        value: claimFee,
      };

      // Simulate first to catch errors
      const { request } = await publicClient.simulateContract(payload);

      // Execute the transaction
      return writeContractAsync(request);
    },
  });
}
```

### Step 3: BoostCore ABI

Create `abi/boostCoreAbi.ts`:

```typescript
export const boostCoreAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: 'boostId_', type: 'uint256' },
      { internalType: 'uint256', name: 'incentiveId_', type: 'uint256' },
      { internalType: 'address', name: 'referrer_', type: 'address' },
      { internalType: 'bytes', name: 'data_', type: 'bytes' },
      { internalType: 'address', name: 'claimant', type: 'address' },
    ],
    name: 'claimIncentiveFor',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
```

---

## Optimistic Updates

Since the Boost backend takes ~15 seconds to reflect claim status, we use optimistic updates to provide instant UI feedback.

Create `lib/optimisticUpdates.ts`:

```typescript
import type { QueryClient } from '@tanstack/react-query';
import type { Address, Hash } from 'viem';
import type { RewardKitResponse } from '@/queries/getSettleBoosts';

/**
 * Optimistically updates the UI after a successful claim.
 * Moves the boost from claimableBoosts to claimedBoosts immediately.
 */
export function optimisticallyUpdateAfterClaim(
  queryClient: QueryClient,
  address: Address,
  boostId: string,
  txHash: Hash
) {
  const normalizedAddress = address.toLowerCase() as Address;
  const queryKey = ['settleBoosts', { address: normalizedAddress }];

  // Cancel any in-flight queries to prevent race conditions
  queryClient.cancelQueries({ queryKey });

  // Update the cache optimistically
  queryClient.setQueryData<RewardKitResponse>(queryKey, (oldData) => {
    if (!oldData) return oldData;

    // Find the boost in claimableBoosts
    const claimableBoost = oldData.claimableBoosts?.find(
      (boost) => boost.id === boostId
    );
    if (!claimableBoost) return oldData;

    // Remove from claimable
    const updatedClaimableBoosts = oldData.claimableBoosts.filter(
      (boost) => boost.id !== boostId
    );

    // Add to claimed with updated status
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
      totalClaimedAmountUsd:
        (oldData.totalClaimedAmountUsd ?? 0) + rewardUsdValue,
      totalClaimableAmountUsd:
        (oldData.totalClaimableAmountUsd ?? 0) - rewardUsdValue,
    };
  });

  // Invalidate queries after 15 seconds to sync with backend
  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey });
  }, 15_000);
}
```

---

## Complete Example

Here's a complete `ClaimButton` component that ties everything together:

```typescript
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Address, Hash, Hex } from 'viem';
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useClaimIncentive } from '@/mutations/useClaimIncentive';
import { getClaimSignatures } from '@/queries/getClaimSignatures';
import { optimisticallyUpdateAfterClaim } from '@/lib/optimisticUpdates';
import type { RewardKitBoost } from '@/queries/getSettleBoosts';

interface ClaimButtonProps {
  boost: RewardKitBoost;
}

export function ClaimButton({ boost }: ClaimButtonProps) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { switchChainAsync } = useSwitchChain();
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fetch claim signature
  const { data: signatures } = useQuery(
    getClaimSignatures({
      boostId: boost.id,
      address,
      enabled: boost.status === 'claimable',
    })
  );

  const signature = signatures?.[0];

  // Claim mutation
  const {
    mutate: claimIncentive,
    isPending: isClaiming,
  } = useClaimIncentive({
    boostId: boost.id,
    address,
  });

  // Wait for transaction receipt
  const { isLoading: isWaitingForReceipt, isSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash ?? undefined,
      chainId: boost.chainId,
    });

  // Handle successful transaction
  if (isSuccess && txHash && address) {
    optimisticallyUpdateAfterClaim(queryClient, address, boost.id, txHash);
    setTxHash(null);
  }

  const handleClaim = async () => {
    if (!address || !signature) return;

    setError(null);

    try {
      // Switch to correct chain
      await switchChainAsync({ chainId: boost.chainId });

      // Execute claim
      claimIncentive(
        {
          signature: signature.signature as Hex,
          claimant: signature.claimant,
          incentiveId: signature.incentiveId,
          referrer: signature.referrer ?? address,
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
          },
          onError: (err) => {
            // Ignore user rejection
            if (err.message.includes('rejected')) return;
            setError(err);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    }
  };

  // Already claimed
  if (boost.status === 'claimed') {
    return (
      <button disabled className="bg-green-500 text-white px-4 py-2 rounded">
        Claimed
      </button>
    );
  }

  // Not yet claimable (still active)
  if (boost.status === 'active') {
    return (
      <button disabled className="bg-gray-300 text-gray-600 px-4 py-2 rounded">
        Not Ready
      </button>
    );
  }

  // Waiting for transaction
  if (isWaitingForReceipt) {
    return (
      <button disabled className="bg-blue-500 text-white px-4 py-2 rounded">
        Processing...
      </button>
    );
  }

  // Claiming in progress
  if (isClaiming) {
    return (
      <button disabled className="bg-blue-500 text-white px-4 py-2 rounded">
        Confirm in Wallet...
      </button>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <button
          onClick={handleClaim}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Retry Claim
        </button>
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  // Ready to claim
  return (
    <button
      onClick={handleClaim}
      disabled={!signature}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
    >
      Claim {boost.incentives[0]?.rewardAmountFormatted}{' '}
      {boost.incentives[0]?.tokenSymbol}
    </button>
  );
}
```

### Usage

```typescript
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { getSettleBoosts } from '@/queries/getSettleBoosts';
import { ClaimButton } from '@/components/ClaimButton';

export function RewardsPage() {
  const { address } = useAccount();
  const { data } = useQuery(getSettleBoosts(address));

  return (
    <div className="space-y-4">
      <h1>Your Cashback Rewards</h1>

      {data?.claimableBoosts.map((boost) => (
        <div key={boost.id} className="p-4 border rounded">
          <h3>{boost.boostName}</h3>
          <p>
            Reward: {boost.incentives[0]?.rewardAmountFormatted}{' '}
            {boost.incentives[0]?.tokenSymbol}
            {' '}(~${boost.incentives[0]?.rewardUsdValue?.toFixed(2)})
          </p>
          <ClaimButton boost={boost} />
        </div>
      ))}

      {data?.claimableBoosts.length === 0 && (
        <p>No rewards available to claim yet.</p>
      )}
    </div>
  );
}
```

---

## TypeScript Types

For reference, here are the complete TypeScript types:

```typescript
// Boost status
type BoostStatus = 'active' | 'claimable' | 'claimed';

// Incentive types
type IncentiveType =
  | 'ERC20Incentive'
  | 'ERC20VariableIncentive'
  | 'ERC20VariableCriteriaIncentive'
  | 'ERC20PeggedIncentive'
  | 'PointsIncentive';

// Incentive structure
interface RewardKitIncentive {
  type: IncentiveType;
  assetAddress?: `0x${string}`;
  rewardAmount?: string; // Raw amount in wei
  rewardAmountFormatted?: string; // Human readable
  rewardPercentage?: number; // For percentage-based rewards
  maxReward?: string;
  rewardUsdValue?: number;
  tokenSymbol?: string;
  tokenImageUri?: string;
  metadata?: {
    decimals: number;
    name: string;
    symbol: string;
    imageUri: string;
  };
}

// Boost structure
interface RewardKitBoost {
  id: string; // Format: "chainId:contractAddress:boostIndex"
  chainId: number;
  boostName: string | null;
  tokenImageUri: string | null;
  incentives: RewardKitIncentive[];
  status?: BoostStatus;
  txHash?: string;
  blockTimestamp?: string;
  actionTemplate?: {
    id: string;
    actionType: string;
    projectId: string;
    projectImage?: string;
    description?: string;
  } | null;
}

// API Response
interface RewardKitResponse {
  activeBoosts: RewardKitBoost[];
  claimableBoosts: RewardKitBoost[];
  claimedBoosts: RewardKitBoost[];
  totalClaimableAmountUsd: number;
  totalClaimedAmountUsd: number;
}

// Claim signature
interface ClaimSignature {
  claimant: `0x${string}`;
  incentiveId: number;
  signature: `0x${string}`;
  referrer?: `0x${string}`;
}
```

---

## Support

If you have questions or run into issues, reach out to the Boost team.

## additional info 
To get boost info and claim signatures/status, use the rewardkit profile endpoint. Once a boost is claimable, it will show up in the claimableBoosts and there will be a claim signature you can use for the `claimIncentiveFor` method on boostcore. Once it has been claimed, it will more to "claimedBoosts".
curl --request GET \
  --url 'https://api-v2.boost.xyz/reward-kit?budgetAccount=0x68548cf3c61cb12c280d16bc01e461eb9e4a5a60&claimantAddress=0x0000000000000000000000000000000000000000'   <-- replace zeroAddress with the claimant address.
Getting the MerchantId from the boost.
To get the merchantId you will need to extract it from the actionSteps. You can do this using the boost API, or boostSDK.
Using Boost API
To get the boost data, you can call the boosts endpoint with the boostId e.g. https://api-v2.boost.xyz/boosts/480:0xea11a7937809b8585e63b12cc86bf91a72a5b08a:158
The merchant Id will be in actionParameters[3].filterData. It is hex encoded, so you can use fromHex from viem to decode it. 
fromHex('0x363866666437643862393965353635343566653064373034', 'string') 
// "68ffd7d8b99e56545fe0d704"
Using Boost SDK
If using boost sdk, you can get the merchantId like this:
  const boost = await core.getBoost(158n, { chainId: base.id })
  const actionSteps = await boost.action.getActionSteps({ chainId: base.id });
  const merchantIdHex = actionSteps[3].actionParameter.filterData;
  const merchantId = fromHex(merchantIdHex, 'string');
  console.log(merchantId); // 68ffd7d8b99e56545fe0d704