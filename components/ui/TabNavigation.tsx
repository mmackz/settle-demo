'use client';

const TABS = ['Shops', 'Rewards'] as const;
type Tab = typeof TABS[number];

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabNavigation({
  activeTab,
  onTabChange
}: TabNavigationProps) {
  return (
    <div className="flex px-4 pt-6 gap-6">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`text-xl font-bold transition-colors ${
            activeTab === tab
              ? 'text-white'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
