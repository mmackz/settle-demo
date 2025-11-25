'use client';

import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';
import { usePublicClient, useWriteContract } from 'wagmi';
import {
  boostCoreAbi,
} from '@boostxyz/sdk';
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

      const { request } = await publicClient.simulateContract(payload);
      return writeContractAsync(request);
    },
  });
}
