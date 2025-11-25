'use client';

import Image from 'next/image';
import { useFarcaster } from '@/components/providers/FarcasterProvider';

export function BottomNavigation() {
  const { context } = useFarcaster();
  const avatarUrl = context?.user?.pfpUrl ?? 'https://i.imgur.com/HqXpVwT.png';

  return (
    <div className="fixed bottom-0 left-0 right-0 flex items-end justify-around bg-black pb-6 pt-3 px-6">
      {/* Home */}
      <button className="p-2 text-white">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6z"/>
        </svg>
      </button>

      {/* QR Scanner (prominent, floating) */}
      <button className="rounded-2xl bg-zinc-800 p-4 -mb-1">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2zM17 17h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/>
        </svg>
      </button>

      {/* Profile - user's avatar */}
      <button className="p-2">
        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-zinc-700">
          <Image
            src={avatarUrl}
            alt="Profile"
            fill
            className="object-cover"
          />
        </div>
      </button>
    </div>
  );
}
