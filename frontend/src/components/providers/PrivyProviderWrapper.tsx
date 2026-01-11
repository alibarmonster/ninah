'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { baseSepolia } from 'viem/chains';
import { ReactNode } from 'react';

export default function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#60a5fa',
          logo: '/ninah-only-logo.svg',
        },
        loginMethods: ['email', 'google', 'twitter'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}>
      <SmartWalletsProvider>{children}</SmartWalletsProvider>
    </PrivyProvider>
  );
}
