'use client';

import React from 'react';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCopy, IconEye, IconEyeOff, IconQrcode, IconDroplet, IconLoader2 } from '@tabler/icons-react';
import { useWalletBalance } from '@/hooks';
import { useRouter } from 'next/navigation';

export default function WalletPage() {
  const router = useRouter();
  const { client: smartWalletClient } = useSmartWallets();

  // Use smart wallet address for balance and display
  const walletAddress = (smartWalletClient?.account?.address as `0x${string}`) || undefined;

  const [showBalance, setShowBalance] = React.useState(true);
  const [showAddress, setShowAddress] = React.useState(false);
  const [copied, setCopied] = React.useState<'wallet' | 'stealth' | null>(null);

  // Faucet state
  const [faucetLoading, setFaucetLoading] = React.useState(false);
  const [faucetMessage, setFaucetMessage] = React.useState<string | null>(null);
  const [faucetError, setFaucetError] = React.useState<string | null>(null);

  // Fetch wallet balance
  const { balance, loading: balanceLoading, error: balanceError, refetch: refetchBalance } = useWalletBalance(walletAddress);

  // Request tokens from faucet
  const requestFaucet = async () => {
    if (!walletAddress) return;

    setFaucetLoading(true);
    setFaucetMessage(null);
    setFaucetError(null);

    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Faucet request failed');
      }

      setFaucetMessage(data.message);
      // Refresh balance after a short delay
      setTimeout(() => refetchBalance(), 2000);
    } catch (error) {
      setFaucetError(error instanceof Error ? error.message : 'Failed to request tokens');
    } finally {
      setFaucetLoading(false);
    }
  };

  // Format balance for display
  const formatIDRBalance = (balance: string | null) => {
    if (!balance) return 'Rp 0';
    const num = parseFloat(balance);
    return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const copyToClipboard = async (text: string, type: 'wallet' | 'stealth') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // For stealth address - this would come from meta keys registration
  // For now showing a placeholder until the user registers meta keys
  const stealthAddress = 'st:0x9a3f...7b2c'; // TODO: Generate from meta keys

  return (
    <div className='flex flex-1 flex-col'>
      <div className='p-4 md:p-10'>
        <h1 className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>Wallet</h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-8 font-poppins'>
          Manage your IDRX balance and wallet addresses
        </p>

        {/* Error State */}
        {balanceError && (
          <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <p className='text-red-600 dark:text-red-400 font-poppins'>Error loading balance: {balanceError.message}</p>
          </div>
        )}

        {/* Balance Card */}
        <Card className='p-8 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-medium text-neutral-600 dark:text-neutral-400 font-poppins'>Total Balance</h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className='p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors'>
              {showBalance ? (
                <IconEye className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
              ) : (
                <IconEyeOff className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
              )}
            </button>
          </div>
          {balanceLoading ? (
            <div className='h-14 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-6' />
          ) : (
            <h3 className='text-5xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 font-grotesk'>
              {showBalance ? formatIDRBalance(balance) : '••••••••'}
            </h3>
          )}
          <div className='flex gap-3'>
            <Button size='lg' className='flex-1 font-poppins' onClick={() => router.push('/app/send')}>
              Send IDRX
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='flex-1 font-poppins'
              onClick={() => router.push('/app/receive')}>
              Receive IDRX
            </Button>
          </div>
        </Card>

        {/* Faucet Card - Test Only */}
        <Card className='p-6 mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-bold text-blue-900 dark:text-blue-100 mb-1 font-grotesk flex items-center gap-2'>
                <IconDroplet className='h-5 w-5' />
                Test Faucet
              </h3>
              <p className='text-sm text-blue-700 dark:text-blue-300 font-poppins'>
                Get free test IDRX tokens for development
              </p>
            </div>
            <Button
              onClick={requestFaucet}
              disabled={faucetLoading || !walletAddress}
              className='bg-blue-600 hover:bg-blue-700 font-poppins'>
              {faucetLoading ? (
                <>
                  <IconLoader2 className='h-4 w-4 mr-2 animate-spin' />
                  Requesting...
                </>
              ) : (
                <>
                  <IconDroplet className='h-4 w-4 mr-2' />
                  Get 10,000 IDRX
                </>
              )}
            </Button>
          </div>
          {faucetMessage && (
            <p className='mt-3 text-sm text-green-600 dark:text-green-400 font-poppins'>{faucetMessage}</p>
          )}
          {faucetError && (
            <p className='mt-3 text-sm text-red-600 dark:text-red-400 font-poppins'>{faucetError}</p>
          )}
        </Card>

        {/* Wallet Addresses */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          {/* Regular Wallet Address */}
          <Card className='p-6'>
            <h3 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 font-grotesk'>
              Wallet Address
            </h3>
            <div className='bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4'>
              <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-2 font-poppins'>Your wallet address</p>
              {walletAddress ? (
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-mono text-neutral-800 dark:text-neutral-100 break-all'>
                    {showAddress ? walletAddress : `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`}
                  </p>
                  <button
                    onClick={() => setShowAddress(!showAddress)}
                    className='p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors flex-shrink-0'>
                    {showAddress ? (
                      <IconEyeOff className='h-4 w-4 text-neutral-600 dark:text-neutral-400' />
                    ) : (
                      <IconEye className='h-4 w-4 text-neutral-600 dark:text-neutral-400' />
                    )}
                  </button>
                </div>
              ) : (
                <p className='text-sm text-neutral-500 dark:text-neutral-400 font-poppins'>No wallet connected</p>
              )}
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 font-poppins'
                onClick={() => walletAddress && copyToClipboard(walletAddress, 'wallet')}
                disabled={!walletAddress}>
                <IconCopy className='h-4 w-4 mr-2' />
                {copied === 'wallet' ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant='outline' size='sm' className='flex-1 font-poppins' disabled={!walletAddress}>
                <IconQrcode className='h-4 w-4 mr-2' />
                QR Code
              </Button>
            </div>
          </Card>

          {/* Stealth Address */}
          <Card className='p-6'>
            <h3 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4 font-grotesk'>
              Stealth Address
            </h3>
            <div className='bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4'>
              <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-2 font-poppins'>
                One-time receiving address
              </p>
              <p className='text-sm font-mono text-neutral-800 dark:text-neutral-100'>{stealthAddress}</p>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 font-poppins'
                onClick={() => copyToClipboard(stealthAddress, 'stealth')}>
                <IconCopy className='h-4 w-4 mr-2' />
                {copied === 'stealth' ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant='outline' size='sm' className='flex-1 font-poppins'>
                Generate New
              </Button>
            </div>
          </Card>
        </div>

        {/* Token Holdings */}
        <Card className='p-6'>
          <h3 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 font-grotesk'>Token Holdings</h3>
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
              <div className='flex items-center gap-4'>
                <div className='h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center'>
                  <span className='text-lg font-bold text-primary font-grotesk'>ID</span>
                </div>
                <div>
                  <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>IDRX</p>
                  <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>Indonesian Rupiah</p>
                </div>
              </div>
              <div className='text-right'>
                {balanceLoading ? (
                  <div className='space-y-2'>
                    <div className='h-6 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse ml-auto' />
                    <div className='h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse ml-auto' />
                  </div>
                ) : (
                  <>
                    <p className='font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>
                      {formatIDRBalance(balance)}
                    </p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                      {balance ? parseFloat(balance).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0'} IDRX
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
