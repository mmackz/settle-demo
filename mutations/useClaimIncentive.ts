'use client';

import { useMutation } from '@tanstack/react-query';
import type { Address, Hex } from 'viem';
import { usePublicClient, useWriteContract } from 'wagmi';
import {
  PayableLimitedSignerValidator,
  PayableLimitedSignerValidatorV2,
} from '@boostxyz/sdk';
import { useBoost } from '@/components/providers/BoostProvider';
import { boostCoreAbi } from '@/abi/boostCoreAbi';
import { parseBoostId } from '@/lib/utils';
import { CHAIN_ID } from '@/lib/constants';
import type { ClaimSignatureData } from '@/types';

export function useClaimIncentive({
  boostId,
  address,
  signatureData,
}: {
  boostId: string;
  address?: Address;
  signatureData?: ClaimSignatureData;
}) {
  const { core } = useBoost();
  const { boostCoreAddress, boostIndex } = parseBoostId(boostId);

  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationKey: ['claimIncentive', { boostId, address }],
    mutationFn: async () => {
      if (!address) throw new Error('No connected address');
      if (!publicClient) throw new Error('No public client');
      if (!signatureData) throw new Error('No signature data available');

      const boost = await core.getBoost(boostIndex, { chainId: CHAIN_ID });
      const validator = boost.validator;

      const claimFee =
        validator instanceof PayableLimitedSignerValidator ||
        validator instanceof PayableLimitedSignerValidatorV2
          ? await validator.getClaimFee()
          : 0n;

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
        value: claimFee,
        chainId: CHAIN_ID,
      };

      const { request } = await publicClient.simulateContract(payload);
      return writeContractAsync(request);
    },
  });
}
