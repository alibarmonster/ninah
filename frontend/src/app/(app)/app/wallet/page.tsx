'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCopy, IconEye, IconEyeOff, IconQrcode } from '@tabler/icons-react';

export default function WalletPage() {
  const [showBalance, setShowBalance] = React.useState(true);
  const [showAddress, setShowAddress] = React.useState(false);

  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const stealthAddress = 'st:0x9a3f...7b2c';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className='flex flex-1 flex-col'>
      <div className='p-4 md:p-10'>
        <h1 className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>Wallet</h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-8 font-poppins'>
          Manage your IDRX balance and wallet addresses
        </p>

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
          <h3 className='text-5xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 font-grotesk'>
            {showBalance ? 'Rp 10,500,000' : '••••••••'}
          </h3>
          <div className='flex gap-3'>
            <Button size='lg' className='flex-1 font-poppins'>
              Send IDRX
            </Button>
            <Button size='lg' variant='outline' className='flex-1 font-poppins'>
              Receive IDRX
            </Button>
          </div>
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
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 font-poppins'
                onClick={() => copyToClipboard(walletAddress)}>
                <IconCopy className='h-4 w-4 mr-2' />
                Copy
              </Button>
              <Button variant='outline' size='sm' className='flex-1 font-poppins'>
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
                onClick={() => copyToClipboard(stealthAddress)}>
                <IconCopy className='h-4 w-4 mr-2' />
                Copy
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
                <p className='font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>Rp 10,500,000</p>
                <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>10,500,000 IDRX</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
