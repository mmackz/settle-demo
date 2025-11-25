import { queryOptions } from '@tanstack/react-query';
import { type Address, isAddress } from 'viem';
import type { RewardKitResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_BOOST_API_URL!;
const BUDGET_ACCOUNT = process.env.NEXT_PUBLIC_BOOST_BUDGET_ACCOUNT!;

export const getSettleBoosts = (claimantAddress?: Address) => {
  const normalizedAddress = claimantAddress?.toLowerCase() ?? '0x';
  const enabled = isAddress(normalizedAddress);

  return queryOptions({
    queryKey: ['settleBoosts', { address: normalizedAddress }],
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
  });
};
