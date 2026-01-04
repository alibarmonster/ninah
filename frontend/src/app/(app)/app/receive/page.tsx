'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconCopy, IconQrcode, IconRefresh, IconShieldCheck } from '@tabler/icons-react';

export default function ReceivePage() {
  const [stealthAddress, setStealthAddress] = useState('st:0x9a3f472e8b1c5d6f7e2a8c9b4d1f3e6a7b2c');
  const [username] = useState('@yourname');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateNewStealthAddress = () => {
    const randomAddress = `st:0x${Math.random().toString(16).slice(2, 42)}`;
    setStealthAddress(randomAddress);
  };

  return (
    <div className='flex flex-1 flex-col'>
      <div className='p-4 md:p-10'>
        <h1 className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>Receive IDRX</h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-8 font-poppins'>
          Share your receiving address or username with others
        </p>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Stealth Address Card */}
          <Card className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>
                Stealth Address
              </h2>
              <div className='px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full'>
                <span className='text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1 font-poppins'>
                  <IconShieldCheck className='h-3 w-3' />
                  Private
                </span>
              </div>
            </div>

            <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-6 font-poppins'>
              One-time address for maximum privacy. Generate a new address for each transaction.
            </p>

            {/* QR Code Placeholder */}
            <div className='bg-white p-8 rounded-lg mb-6 flex items-center justify-center border-2 border-neutral-200 dark:border-neutral-700'>
              <div className='h-48 w-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center'>
                <IconQrcode className='h-24 w-24 text-neutral-400' />
              </div>
            </div>

            {/* Stealth Address */}
            <div className='bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mb-4'>
              <p className='text-xs text-neutral-600 dark:text-neutral-400 mb-2 font-poppins'>Your stealth address</p>
              <p className='text-sm font-mono text-neutral-800 dark:text-neutral-100 break-all'>{stealthAddress}</p>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3'>
              <Button
                variant='outline'
                className='flex-1 font-poppins'
                onClick={() => copyToClipboard(stealthAddress)}>
                <IconCopy className='h-4 w-4 mr-2' />
                Copy Address
              </Button>
              <Button variant='outline' className='flex-1 font-poppins' onClick={generateNewStealthAddress}>
                <IconRefresh className='h-4 w-4 mr-2' />
                Generate New
              </Button>
            </div>
          </Card>

          {/* Username Card */}
          <Card className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>
                Your Username
              </h2>
              <div className='px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full'>
                <span className='text-xs font-medium text-blue-700 dark:text-blue-400 font-poppins'>Easy to share</span>
              </div>
            </div>

            <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-6 font-poppins'>
              Share your username for a simple way to receive payments. We&apos;ll automatically use stealth addresses.
            </p>

            {/* QR Code Placeholder */}
            <div className='bg-white p-8 rounded-lg mb-6 flex items-center justify-center border-2 border-neutral-200 dark:border-neutral-700'>
              <div className='h-48 w-48 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center'>
                <IconQrcode className='h-24 w-24 text-neutral-400' />
              </div>
            </div>

            {/* Username Display */}
            <div className='bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg mb-4 border border-primary/20'>
              <p className='text-xs text-neutral-600 dark:text-neutral-400 mb-2 font-poppins'>Your Ninah username</p>
              <p className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>{username}</p>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3'>
              <Button variant='outline' className='flex-1 font-poppins' onClick={() => copyToClipboard(username)}>
                <IconCopy className='h-4 w-4 mr-2' />
                Copy Username
              </Button>
              <Button variant='outline' className='flex-1 font-poppins'>
                <IconQrcode className='h-4 w-4 mr-2' />
                Share QR
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className='p-6 mt-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'>
          <h3 className='text-lg font-bold text-blue-900 dark:text-blue-100 mb-3 font-grotesk'>
            How Receiving Works
          </h3>
          <div className='space-y-2'>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-5 w-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-bold text-blue-700 dark:text-blue-300'>1</span>
              </div>
              <p className='text-sm text-blue-800 dark:text-blue-200 font-poppins'>
                <strong>Stealth Address:</strong> Generate a new one-time address for each transaction to maximize privacy
              </p>
            </div>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-5 w-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-bold text-blue-700 dark:text-blue-300'>2</span>
              </div>
              <p className='text-sm text-blue-800 dark:text-blue-200 font-poppins'>
                <strong>Username:</strong> Share your @username for easy payments. We automatically handle stealth
                addresses
              </p>
            </div>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-5 w-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-bold text-blue-700 dark:text-blue-300'>3</span>
              </div>
              <p className='text-sm text-blue-800 dark:text-blue-200 font-poppins'>
                <strong>QR Code:</strong> Show the QR code for quick in-person payments
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
