'use client';

import { PrivyProvider } from '@privy-io/react-auth';
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
      }}>
      {children}
    </PrivyProvider>
  );
}
