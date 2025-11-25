'use client';

import { BoostCore } from '@boostxyz/sdk';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { config } from '@/lib/wagmi';

interface BoostContextValue {
  core: BoostCore;
}

const BoostContext = createContext<BoostContextValue | null>(null);

export function useBoost() {
  const context = useContext(BoostContext);
  if (!context) {
    throw new Error('useBoost must be used within BoostProvider');
  }
  return context;
}

export function BoostProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({
    core: new BoostCore({ config }),
  }), []);

  return (
    <BoostContext.Provider value={value}>
      {children}
    </BoostContext.Provider>
  );
}
