'use client';

import Image from 'next/image';
import { useFarcaster } from '@/components/providers/FarcasterProvider';

interface ProfileHeaderProps {
  balance?: number;
}

export function ProfileHeader({ balance = 59.97 }: ProfileHeaderProps) {
  const { context } = useFarcaster();

  const username = context?.user?.username ?? 'fc user';
  const displayName = 'gm';
  const avatarUrl = context?.user?.pfpUrl ?? 'https://i.imgur.com/HqXpVwT.png';

  return (
    <div className="px-4 pt-4 pb-2">
      {/* Top row: avatar and name */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-zinc-800">
          <Image
            src={avatarUrl}
            alt={username}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm text-zinc-400">{displayName}</p>
          <p className="text-sm font-semibold text-white">@{username}</p>
        </div>
      </div>

      {/* Balance - centered and large */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-5xl font-bold text-white">
          ${balance.toFixed(2)}
        </span>
        <button className="p-1 text-zinc-500 hover:text-zinc-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
