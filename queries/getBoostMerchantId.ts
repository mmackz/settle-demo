import { queryOptions } from '@tanstack/react-query';
import type { BoostCore } from '@boostxyz/sdk';
import { parseBoostId, decodeMerchantId } from '@/lib/utils';
import { CHAIN_ID } from '@/lib/constants';

export const getBoostMerchantId = (
  boostId: string,
  core: BoostCore
) => {
  const { boostIndex } = parseBoostId(boostId);

  return queryOptions({
    queryKey: ['boostMerchantId', boostId],
    queryFn: async (): Promise<string | null> => {
      try {
        const boost = await core.getBoost(boostIndex, { chainId: CHAIN_ID });
        const actionSteps = await boost.action.getActionSteps({ chainId: CHAIN_ID });

        // MerchantId is in actionSteps[2].actionParameter.filterData (hex encoded)
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
    staleTime: Infinity,
  });
};
