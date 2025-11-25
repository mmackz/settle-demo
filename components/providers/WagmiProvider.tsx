'use client';

import { WagmiProvider as WagmiProviderBase, type State } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { config } from '@/lib/wagmi';

export function WagmiProvider({
  children,
  initialState
}: {
  children: ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 15,
        refetchInterval: 1000 * 30,
      },
    },
  }));

  return (
    <WagmiProviderBase config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}
