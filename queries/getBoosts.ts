import { queryOptions } from '@tanstack/react-query';
import { type Address, isAddress } from 'viem';
import type { RewardKitResponse } from '@/types';

const API_URL = 'https://api-v2.boost.xyz';
const BUDGET_ACCOUNT = '0x1a3e67ace4bf9969f4ce48a65cd8653a24b10983';

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
