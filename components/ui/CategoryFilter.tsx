'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/constants';

interface CategoryFilterProps {
  onCategoryChange?: (category: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'All': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/>
    </svg>
  ),
  'Restaurants': (
    <span>🍽️</span>
  ),
  'Cafes': (
    <span>☕</span>
  ),
};

export function CategoryFilter({ onCategoryChange }: CategoryFilterProps) {
  const [selected, setSelected] = useState<string>('All');

  const handleClick = (category: string) => {
    setSelected(category);
    onCategoryChange?.(category);
  };

  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-4 scrollbar-hide">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => handleClick(category)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors border ${
            selected === category
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
          }`}
        >
          {CATEGORY_ICONS[category] ?? '🏪'}
          <span>{category}</span>
        </button>
      ))}
    </div>
  );
}
