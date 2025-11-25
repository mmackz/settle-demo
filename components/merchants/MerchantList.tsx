'use client';

import { MerchantCard } from './MerchantCard';
import { useMerchantBoosts } from '@/hooks/useMerchantBoosts';

interface MerchantListProps {
  categoryFilter?: string;
}

export function MerchantList({ categoryFilter = 'All' }: MerchantListProps) {
  const { merchants, isLoading, error } = useMerchantBoosts();

  const filteredMerchants = categoryFilter === 'All'
    ? merchants
    : merchants.filter((m) => m.category === categoryFilter);

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
        <p className="text-red-400">Failed to load merchants</p>
        <p className="text-sm text-zinc-500">{error.message}</p>
      </div>
    );
  }

  if (filteredMerchants.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-zinc-500">No merchants found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-900 px-4">
      {filteredMerchants.map((merchant) => (
        <MerchantCard
          key={merchant.id}
          merchant={merchant}
          cashbackPercent={merchant.boost?.incentives[0]?.rewardPercentage}
        />
      ))}
    </div>
  );
}
