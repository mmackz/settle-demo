'use client';

import { MerchantCard } from './MerchantCard';
import { MERCHANTS } from '@/lib/constants';

interface MerchantListProps {
  categoryFilter?: string;
}

export function MerchantList({ categoryFilter = 'All' }: MerchantListProps) {
  const filteredMerchants = categoryFilter === 'All'
    ? MERCHANTS
    : MERCHANTS.filter((m) => m.category === categoryFilter);

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
        />
      ))}
    </div>
  );
}
