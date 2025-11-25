'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import type { MerchantWithBoost, RewardKitBoost } from '@/types';

interface ClaimSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: MerchantWithBoost;
  boost: RewardKitBoost;
  txHash?: string;
}

export function ClaimSuccessModal({
  isOpen,
  onClose,
  merchant,
  boost,
  txHash,
}: ClaimSuccessModalProps) {
  const incentive = boost.incentives[0];
  const rewardAmount = incentive?.rewardAmountFormatted ?? '0';
  const tokenSymbol = incentive?.tokenSymbol ?? 'USDC';
  const tokenImageUri = incentive?.tokenImageUri;

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fireConfetti();
    }
  }, [isOpen, fireConfetti]);

  if (!isOpen) return null;

  const basescanUrl = txHash
    ? `https://basescan.org/tx/${txHash}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 bg-black rounded-3xl overflow-hidden border border-zinc-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center px-6 py-10">
          {/* Success checkmark */}
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Cashback claimed!
          </h2>
          <p className="text-zinc-400 text-sm mb-8">
            Your reward has been sent to your wallet
          </p>

          {/* Merchant info */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-800 mb-3">
              {merchant.logoUrl && (
                <Image
                  src={merchant.logoUrl}
                  alt={merchant.businessName}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <p className="font-semibold text-white">{merchant.businessName}</p>
          </div>

          {/* Reward amount card */}
          <div className="w-full bg-zinc-900 rounded-2xl p-5 mb-6 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">You earned</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-400">
                  +{rewardAmount}
                </span>
                <span className="text-lg text-green-400">{tokenSymbol}</span>
                {tokenImageUri && (
                  <Image
                    src={tokenImageUri}
                    alt={tokenSymbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
              </div>
            </div>
          </div>

          {/* View on Basescan link */}
          {basescanUrl && (
            <a
              href={basescanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 text-sm underline hover:text-zinc-300 mb-6"
            >
              View on Basescan
            </a>
          )}

          {/* Done button */}
          <button
            onClick={onClose}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-4 rounded-2xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
