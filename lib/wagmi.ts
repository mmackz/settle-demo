import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

export const config = createConfig({
  chains: [base],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: {
    [base.id]: http('https://8453.rpc.thirdweb.com'),
  },
  connectors: [
    farcasterMiniApp(),
  ],
});
