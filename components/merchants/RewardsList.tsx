'use client';

import Image from 'next/image';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { useMerchantBoosts } from '@/hooks/useMerchantBoosts';
import { ClaimButton } from './ClaimButton';
import { ClaimSuccessModal } from './ClaimSuccessModal';
import type { MerchantWithBoost, RewardKitBoost } from '@/types';

type RewardsSubTab = 'active' | 'history';

interface ClaimSuccessData {
  merchant: MerchantWithBoost;
  boost: RewardKitBoost;
  txHash: string;
}

export function RewardsList() {
  const { merchants, isLoading, error } = useMerchantBoosts();
  const [subTab, setSubTab] = useState<RewardsSubTab>('active');
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [successData, setSuccessData] = useState<ClaimSuccessData | null>(null);

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
    return a.businessName.localeCompare(b.businessName);
  });

  const handleClaimed = (merchant: MerchantWithBoost, txHash: string) => {
    if (merchant.boost) {
      setSuccessData({ merchant, boost: merchant.boost, txHash });
    }
    setClaimedIds((prev) => new Set([...prev, merchant.id]));
  };

  const handleCloseSuccess = () => {
    setSuccessData(null);
  };

  return (
    <div className="flex flex-col">
      {/* Sub-tabs */}
      <div className="flex gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => setSubTab('active')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors border ${
            subTab === 'active'
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
          }`}
        >
          Active{pendingMerchants.length > 0 && ` (${pendingMerchants.length})`}
        </button>
        <button
          onClick={() => setSubTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors border ${
            subTab === 'history'
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
          }`}
        >
          History{claimedMerchants.length > 0 && ` (${claimedMerchants.length})`}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        {subTab === 'active' && (
          <>
            {sortedPending.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-zinc-500 text-sm">No active rewards</p>
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
                    onClaimed={(txHash) => handleClaimed(merchant, txHash)}
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

      {/* Success Modal */}
      {successData && (
        <ClaimSuccessModal
          isOpen={!!successData}
          onClose={handleCloseSuccess}
          merchant={successData.merchant}
          boost={successData.boost}
          txHash={successData.txHash}
        />
      )}
    </div>
  );
}

interface RewardCardProps {
  merchant: MerchantWithBoost;
  onClaimed?: (txHash: string) => void;
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
              {merchant.logoUrl && (
                <Image
                  src={merchant.logoUrl}
                  alt={merchant.businessName}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            {/* Green indicator */}
            <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-black" />
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-white text-sm">{merchant.businessName}</h3>
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
            {merchant.logoUrl && (
              <Image
                src={merchant.logoUrl}
                alt={merchant.businessName}
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-white text-sm">{merchant.businessName}</h3>
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
          {merchant.logoUrl && (
            <Image
              src={merchant.logoUrl}
              alt={merchant.businessName}
              fill
              className="object-cover"
            />
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="font-semibold text-white text-sm">{merchant.businessName}</h3>
          <p className="text-xs text-zinc-500">${claimedAmount} claimed</p>
        </div>
      </div>

      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
        Claimed
      </span>
    </div>
  );
}
