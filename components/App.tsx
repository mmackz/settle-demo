'use client';

import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { ProfileHeader } from './ui/ProfileHeader';
import { ActionButtons } from './ui/ActionButtons';
import { TabNavigation } from './ui/TabNavigation';
import { CategoryFilter } from './ui/CategoryFilter';
import { MerchantList } from './merchants/MerchantList';
import { RewardsList } from './merchants/RewardsList';
import { BottomNavigation } from './ui/BottomNavigation';
import { useFarcaster } from './providers/FarcasterProvider';
import { useMerchantBoosts } from '@/hooks/useMerchantBoosts';

export function App() {
  const [activeTab, setActiveTab] = useState<'Shops' | 'Rewards'>('Shops');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { isLoaded } = useFarcaster();
  const { claimableCount } = useMerchantBoosts();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Settle Demo</h1>
          <p className="text-zinc-400">
            Earn cashback at local merchants
          </p>
        </div>
        <button
          onClick={() => connect({ connector: connectors[0] })}
          className="rounded-full bg-white px-8 py-3 font-semibold text-black hover:bg-zinc-200 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black pb-24">
      <ProfileHeader />
      <ActionButtons />
      <TabNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'Shops' | 'Rewards')}
        claimableCount={claimableCount}
      />

      {activeTab === 'Shops' ? (
        <>
          <CategoryFilter onCategoryChange={setCategoryFilter} />
          <MerchantList categoryFilter={categoryFilter} />
        </>
      ) : (
        <RewardsList />
      )}

      <BottomNavigation />
    </div>
  );
}
