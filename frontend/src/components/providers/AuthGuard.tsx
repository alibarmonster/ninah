'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { keyManager, KeyManager } from '@/lib/keys';
import UnlockScreen from '@/components/auth/UnlockScreen';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  const [hasKeys, setHasKeys] = useState(false);
  const [checkingKeys, setCheckingKeys] = useState(true);
  // This state is only to trigger re-render after unlock
  const [, forceUpdate] = useState(0);

  // Always check singleton directly
  const isUnlocked = keyManager.isUnlocked();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
      return;
    }

    // Skip checking if already unlocked
    if (isUnlocked) {
      setCheckingKeys(false);
      return;
    }

    const checkKeys = async () => {
      if (ready && authenticated && user?.wallet?.address) {
        try {
          const exists = await KeyManager.keysExist(user.wallet.address);
          setHasKeys(exists);
        } catch (error) {
          console.error('Error checking keys:', error);
        } finally {
          setCheckingKeys(false);
        }
      } else if (ready && !authenticated) {
        setCheckingKeys(false);
      }
    };

    checkKeys();
  }, [ready, authenticated, user, router, isUnlocked]);

  const handleUnlock = () => {
    // Force re-render to pick up new isUnlocked state from singleton
    forceUpdate((n) => n + 1);
  };

  // Fast path: if singleton says unlocked and user is authenticated, render immediately
  if (isUnlocked && ready && authenticated) {
    return <>{children}</>;
  }

  // Show loading state while Privy is initializing or checking keys
  if (!ready || (authenticated && checkingKeys)) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin' />
          <p className='text-muted-foreground font-poppins'>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authenticated) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='flex flex-col items-center gap-6 p-8 rounded-xl bg-card border border-border'>
          <h2 className='text-2xl font-bold text-foreground font-grotesk'>Authentication Required</h2>
          <p className='text-muted-foreground font-poppins text-center max-w-md'>
            Please log in to access the app dashboard.
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated but keys are locked
  if (hasKeys && !isUnlocked) {
    return <UnlockScreen onUnlock={handleUnlock} />;
  }

  // User is authenticated, keys are unlocked (or don't exist yet - new user), render children
  return <>{children}</>;
}
