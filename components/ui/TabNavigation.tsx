'use client';

const TABS = ['Shops', 'Rewards'] as const;
type Tab = typeof TABS[number];

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  claimableCount?: number;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  claimableCount = 0,
}: TabNavigationProps) {
  return (
    <div className="flex px-4 pt-6 gap-6">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`relative text-xl font-bold transition-colors ${
            activeTab === tab
              ? 'text-white'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {tab}
          {tab === 'Rewards' && claimableCount > 0 && (
            <span className="absolute -right-4 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-xs font-semibold text-white">
              {claimableCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
