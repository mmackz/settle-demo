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

  const {
    data: boostsData,
    isLoading: isLoadingBoosts,
    error: boostsError,
  } = useQuery(getBoosts(address));

  // Add status to each boost based on which array it came from
  const allBoosts: RewardKitBoost[] = [
    ...(boostsData?.activeBoosts ?? []).map((b) => ({ ...b, status: 'active' as const })),
    ...(boostsData?.claimableBoosts ?? []).map((b) => ({ ...b, status: 'claimable' as const })),
    ...(boostsData?.claimedBoosts ?? []).map((b) => ({ ...b, status: 'claimed' as const })),
  ];

  const merchantIdQueries = useQueries({
    queries: allBoosts.map((boost) => ({
      ...getBoostMerchantId(boost.id, core),
      enabled: !!boost.id,
    })),
  });

  const isLoadingMerchantIds = merchantIdQueries.some((q) => q.isLoading);

  // Map merchant IDs to boosts, prioritizing claimable > active > claimed
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

  // Make sure merchants are loaded before matching them with boosts. The boost-to-merchant
  // matching depends on having the merchant IDs available to join against.
  const merchantsWithBoosts: MerchantWithBoost[] = MERCHANTS.map((merchant) => {
    const boost = merchantIdToBoost.get(merchant.id) ?? null;
    return {
      ...merchant,
      boost,
      merchantBoostId: boost?.id ?? null,
    };
  });

  const claimableCount = boostsData?.claimableBoosts?.length ?? 0;

  return {
    merchants: merchantsWithBoosts,
    isLoading: isLoadingBoosts || isLoadingMerchantIds,
    error: boostsError,
    totalClaimableUsd: boostsData?.totalClaimableAmountUsd ?? 0,
    totalClaimedUsd: boostsData?.totalClaimedAmountUsd ?? 0,
    claimableCount,
  };
}
