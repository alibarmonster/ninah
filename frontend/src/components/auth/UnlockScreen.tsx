'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Loader2, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { keyManager } from '@/lib/keys';

interface UnlockScreenProps {
  onUnlock: () => void;
}

export default function UnlockScreen({ onUnlock }: UnlockScreenProps) {
  const { user, logout } = usePrivy();
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    keyManager.lock();
    logout();
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsUnlocking(true);
    setError(null);

    try {
      if (!user?.wallet?.address) {
        throw new Error('Wallet connection lost');
      }

      // Password-only unlock - no wallet signature needed!
      await keyManager.unlock({
        password,
        walletAddress: user.wallet.address,
      });

      // Clear password from memory before callback
      setPassword('');

      // Unlock successful
      onUnlock();
    } catch (err) {
      // Show generic error for security
      setError('Incorrect password');
      setIsUnlocking(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-background relative overflow-hidden'>
      {/* Background Decor */}
      <div className='absolute inset-0 z-0 pointer-events-none'>
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl' />
      </div>

      <div className='relative z-10 w-full max-w-md p-8'>
        <div className='flex flex-col items-center gap-6 text-center'>
          {/* Lock Icon Animation */}
          <div className='w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-2'>
            <Lock className='w-10 h-10 text-primary' />
          </div>

          <div className='space-y-2'>
            <h1 className='text-3xl font-bold font-grotesk tracking-tight'>Welcome Back</h1>
            <p className='text-muted-foreground font-poppins'>
              Please enter your password to unlock your keys
            </p>
          </div>

          <form onSubmit={handleUnlock} className='w-full space-y-4 mt-4'>
            <div className='space-y-2'>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Enter your password'
                className={`w-full px-4 py-3 bg-card border-2 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-poppins transition-all ${
                  error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'
                }`}
                autoFocus
              />
              {error && (
                <div className='flex items-center gap-2 text-red-500 text-sm font-poppins px-1'>
                  <AlertCircle className='w-4 h-4' />
                  {error}
                </div>
              )}
            </div>

            <button
              type='submit'
              disabled={!password || isUnlocking}
              className='w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold font-poppins hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20'>
              {isUnlocking ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Unlocking...
                </>
              ) : (
                <>
                  Unlock Dashboard
                  <ArrowRight className='w-5 h-5' />
                </>
              )}
            </button>
          </form> 

          <div className='pt-6 border-t border-border w-full'>
            <button
              onClick={handleLogout}
              className='text-sm text-muted-foreground hover:text-foreground transition-colors font-poppins'>
              Log out and switch account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
