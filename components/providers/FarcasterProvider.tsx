'use client';

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import sdk, { type Context } from '@farcaster/frame-sdk';

interface FarcasterContextValue {
  isLoaded: boolean;
  context: Context.MiniAppContext | null;
}

const FarcasterContext = createContext<FarcasterContextValue>({
  isLoaded: false,
  context: null,
});

export function useFarcaster() {
  return useContext(FarcasterContext);
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        await sdk.actions.ready();
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Farcaster SDK:', error);
        setIsLoaded(true);
      }
    };

    init();
  }, []);

  return (
    <FarcasterContext.Provider value={{ isLoaded, context }}>
      {children}
    </FarcasterContext.Provider>
  );
}
