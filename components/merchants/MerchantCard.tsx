'use client';

import Image from 'next/image';
import type { Merchant } from '@/types';

interface MerchantCardProps {
  merchant: Merchant;
  cashbackPercent?: number;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        {/* Merchant Logo with Badge */}
        <div className="relative">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-zinc-800">
            <Image
              src={merchant.logoUrl}
              alt={merchant.name}
              fill
              className="object-cover"
            />
          </div>
          {/* Discount Badge - green, hardcoded -20% */}
          <div className="absolute -left-1 -top-1 rounded-md bg-[#22c55e] px-1.5 py-0.5 text-[10px] font-bold text-white">
            -20%
          </div>
        </div>

        {/* Merchant Info */}
        <div className="flex flex-col">
          <h3 className="font-semibold text-white">{merchant.name}</h3>
          <p className="flex items-center gap-1 text-sm text-zinc-500">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span className="truncate max-w-[180px]">{merchant.location}</span>
          </p>
        </div>
      </div>

      {/* External Link Icon */}
      <button className="p-1 text-zinc-600 hover:text-zinc-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      </button>
    </div>
  );
}
