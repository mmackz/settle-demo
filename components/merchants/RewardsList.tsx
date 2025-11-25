'use client';

import Image from 'next/image';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { useMerchantBoosts } from '@/hooks/useMerchantBoosts';
import { ClaimButton } from './ClaimButton';
import type { MerchantWithBoost } from '@/types';

type RewardsSubTab = 'pending' | 'history';

export function RewardsList() {
  const { merchants, isLoading, error } = useMerchantBoosts();
  const [subTab, setSubTab] = useState<RewardsSubTab>('pending');
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-red-400">Failed to load rewards</p>
        <p className="text-sm text-zinc-500">{error.message}</p>
      </div>
    );
  }

  // Filter merchants with active or claimable boosts (excluding just-claimed this session)
  const pendingMerchants = merchants.filter((m) => {
    if (claimedIds.has(m.id)) return false;
    return m.boost?.status === 'claimable' || m.boost?.status === 'active';
  });

  // Filter merchants with claimed boosts (including just-claimed this session)
  const claimedMerchants = merchants.filter((m) => {
    if (claimedIds.has(m.id)) return true;
    return m.boost?.status === 'claimed';
  });

  // Sort pending: claimable first, then active, then by name
  const sortedPending = [...pendingMerchants].sort((a, b) => {
    const aClaimable = a.boost?.status === 'claimable';
    const bClaimable = b.boost?.status === 'claimable';

    if (aClaimable && !bClaimable) return -1;
    if (!aClaimable && bClaimable) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleClaimed = (merchantId: string) => {
    setClaimedIds((prev) => new Set([...prev, merchantId]));
  };

  return (
    <div className="flex flex-col">
      {/* Sub-tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        <button
          onClick={() => setSubTab('pending')}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            subTab === 'pending'
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Active{pendingMerchants.length > 0 && ` (${pendingMerchants.length})`}
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            subTab === 'history'
              ? 'bg-white text-black'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          History{claimedMerchants.length > 0 && ` (${claimedMerchants.length})`}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        {subTab === 'pending' && (
          <>
            {sortedPending.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-zinc-500 text-sm">No pending rewards</p>
                <p className="text-zinc-600 text-xs mt-1">
                  Make purchases at partner shops to earn cashback
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {sortedPending.map((merchant) => (
                  <PendingRewardCard
                    key={merchant.id}
                    merchant={merchant}
                    onClaimed={() => handleClaimed(merchant.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {subTab === 'history' && (
          <>
            {claimedMerchants.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-zinc-500 text-sm">No claimed rewards yet</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {claimedMerchants.map((merchant) => (
                  <ClaimedRewardCard key={merchant.id} merchant={merchant} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface RewardCardProps {
  merchant: MerchantWithBoost;
  onClaimed?: () => void;
}

function PendingRewardCard({ merchant, onClaimed }: RewardCardProps) {
  const boost = merchant.boost;
  const incentive = boost?.incentives[0];
  const isClaimable = boost?.status === 'claimable';
  const isActive = boost?.status === 'active';
  const cashbackPercent = incentive?.rewardPercentage ?? 20;

  // Format maxReward using decimals from metadata
  const formatMaxReward = () => {
    if (!incentive?.maxReward) return null;
    const decimals = incentive.metadata?.decimals ?? 6;
    const formatted = formatUnits(BigInt(incentive.maxReward), decimals);
    // Round to 2 decimal places and remove trailing zeros
    const rounded = Math.round(parseFloat(formatted) * 100) / 100;
    return rounded.toString();
  };
  const maxRewardFormatted = formatMaxReward();

  // Claimable state - highlighted with claim button
  if (isClaimable && boost) {
    return (
      <div className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-800">
              <Image
                src={merchant.logoUrl}
                alt={merchant.name}
                fill
                className="object-cover"
              />
            </div>
            {/* Green indicator */}
            <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-white text-sm">{merchant.name}</h3>
            <p className="text-xs text-zinc-500">{cashbackPercent}% cashback</p>
          </div>
        </div>

        <ClaimButton boost={boost} onSuccess={onClaimed} />
      </div>
    );
  }

  // Active state - show cashback info with max potential
  if (isActive && boost) {
    return (
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-800">
            <Image
              src={merchant.logoUrl}
              alt={merchant.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-white text-sm">{merchant.name}</h3>
            <p className="text-xs text-zinc-500">{cashbackPercent}% cashback</p>
          </div>
        </div>

        {maxRewardFormatted && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-zinc-500">up to</span>
            <span className="text-base text-white font-semibold">{maxRewardFormatted}</span>
            {incentive?.tokenImageUri && (
              <Image
                src={incentive.tokenImageUri}
                alt={incentive.tokenSymbol ?? 'token'}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ClaimedRewardCard({ merchant }: RewardCardProps) {
  const boost = merchant.boost;
  const incentive = boost?.incentives[0];
  const claimedAmount = incentive?.rewardUsdValue?.toFixed(2) ?? '0.00';

  return (
    <div className="flex items-center justify-between py-3 opacity-60">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-800">
          <Image
            src={merchant.logoUrl}
            alt={merchant.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <h3 className="font-semibold text-white text-sm">{merchant.name}</h3>
          <p className="text-xs text-zinc-500">${claimedAmount} claimed</p>
        </div>
      </div>

      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
        Claimed
      </span>
    </div>
  );
}
