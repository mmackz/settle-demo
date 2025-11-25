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

  queryClient.cancelQueries({ queryKey });

  queryClient.setQueryData<RewardKitResponse>(queryKey, (oldData) => {
    if (!oldData) return oldData;

    const claimableBoost = oldData.claimableBoosts?.find(
      (boost) => boost.id === boostId
    );
    if (!claimableBoost) return oldData;

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

  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey });
  }, 15_000);
}
