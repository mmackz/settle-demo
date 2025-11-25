'use client';

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import type { Hash } from 'viem';
import { useClaimIncentive } from '@/mutations/useClaimIncentive';
import { optimisticallyUpdateAfterClaim } from '@/mutations/useOptimisticUpdate';
import type { RewardKitBoost } from '@/types';
import { CHAIN_ID } from '@/lib/constants';

interface ClaimButtonProps {
  boost: RewardKitBoost;
  onSuccess?: (txHash: string) => void;
}

export function ClaimButton({ boost, onSuccess }: ClaimButtonProps) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const hasHandledSuccess = useRef(false);

  const { mutate: claim, isPending: isClaiming } = useClaimIncentive({
    boostId: boost.id,
    address,
    signatureData: boost.signature,
  });

  const { isLoading: isWaitingForReceipt, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: CHAIN_ID,
  });

  useEffect(() => {
    if (isSuccess && txHash && address && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      optimisticallyUpdateAfterClaim(queryClient, address, boost.id, txHash);
      onSuccess?.(txHash);
      setTxHash(null);
    }
  }, [isSuccess, txHash, address, queryClient, boost.id, onSuccess]);

  const handleClaim = async () => {
    if (!address) return;
    setError(null);

    claim(undefined, {
      onSuccess: (hash) => setTxHash(hash),
      onError: (err) => {
        if (!err.message.includes('rejected')) {
          setError(err);
        }
      },
    });
  };

  if (boost.status === 'claimed') {
    return (
      <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">
        Claimed
      </span>
    );
  }

  if (boost.status === 'active') {
    return (
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-500">
        Pending
      </span>
    );
  }

  if (isWaitingForReceipt) {
    return (
      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400 animate-pulse">
        Processing...
      </span>
    );
  }

  if (isClaiming) {
    return (
      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400 animate-pulse">
        Confirm...
      </span>
    );
  }

  if (error) {
    return (
      <button
        onClick={handleClaim}
        className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400 hover:bg-red-500/30"
      >
        Retry
      </button>
    );
  }

  const rewardDisplay = boost.incentives[0]?.rewardAmountFormatted
    ? `${boost.incentives[0].rewardAmountFormatted} ${boost.incentives[0].tokenSymbol}`
    : 'Claim';

  return (
    <button
      onClick={handleClaim}
      className="rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white hover:bg-green-600 transition-colors"
    >
      {rewardDisplay}
    </button>
  );
}
