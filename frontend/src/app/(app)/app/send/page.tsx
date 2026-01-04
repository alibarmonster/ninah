'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconUser, IconCoins, IconLock, IconSend } from '@tabler/icons-react';

export default function SendPage() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [useStealthAddress, setUseStealthAddress] = useState(true);

  const handleSend = () => {
    console.log('Sending:', { recipient, amount, useStealthAddress });
  };

  return (
    <div className='flex flex-1 flex-col'>
      <div className='p-4 md:p-10'>
        <h1 className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>Send IDRX</h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-8 font-poppins'>
          Send private payments with stealth addresses and zero-knowledge proofs
        </p>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Send Form */}
          <div className='lg:col-span-2'>
            <Card className='p-6'>
              <h2 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 font-grotesk'>
                Payment Details
              </h2>

              {/* Recipient */}
              <div className='mb-6'>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 font-poppins'>
                  Recipient
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 -translate-y-1/2'>
                    <IconUser className='h-5 w-5 text-neutral-400' />
                  </div>
                  <input
                    type='text'
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder='@username or stealth address'
                    className='w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary font-poppins'
                  />
                </div>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-poppins'>
                  Enter a Ninah username or a stealth address
                </p>
              </div>

              {/* Amount */}
              <div className='mb-6'>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 font-poppins'>
                  Amount
                </label>
                <div className='relative'>
                  <div className='absolute left-3 top-1/2 -translate-y-1/2'>
                    <IconCoins className='h-5 w-5 text-neutral-400' />
                  </div>
                  <input
                    type='text'
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder='0.00'
                    className='w-full pl-10 pr-20 py-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary font-poppins text-2xl font-bold'
                  />
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    <span className='text-sm font-medium text-neutral-500 dark:text-neutral-400 font-poppins'>
                      IDRX
                    </span>
                  </div>
                </div>
                <div className='flex items-center justify-between mt-2'>
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 font-poppins'>
                    Available: Rp 10,500,000
                  </p>
                  <button className='text-xs text-primary hover:underline font-poppins font-medium'>
                    Use Max
                  </button>
                </div>
              </div>

              {/* Privacy Options */}
              <div className='mb-6'>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3 font-poppins'>
                  Privacy Settings
                </label>
                <div className='space-y-3'>
                  <label className='flex items-start p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'>
                    <input
                      type='checkbox'
                      checked={useStealthAddress}
                      onChange={(e) => setUseStealthAddress(e.target.checked)}
                      className='mt-1 mr-3'
                    />
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <IconLock className='h-4 w-4 text-primary' />
                        <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                          Use Stealth Address
                        </p>
                      </div>
                      <p className='text-sm text-neutral-600 dark:text-neutral-400 mt-1 font-poppins'>
                        Generate a one-time address for maximum privacy
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Send Button */}
              <Button
                size='lg'
                className='w-full font-poppins font-semibold text-lg'
                onClick={handleSend}
                disabled={!recipient || !amount}>
                <IconSend className='h-5 w-5 mr-2' />
                Send Payment
              </Button>
            </Card>
          </div>

          {/* Transaction Summary */}
          <div className='lg:col-span-1'>
            <Card className='p-6 sticky top-6'>
              <h3 className='text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4 font-grotesk'>
                Transaction Summary
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700'>
                  <span className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>Amount</span>
                  <span className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                    {amount || '0.00'} IDRX
                  </span>
                </div>
                <div className='flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700'>
                  <span className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>Network Fee</span>
                  <span className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>~500 IDRX</span>
                </div>
                <div className='flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700'>
                  <span className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>Privacy</span>
                  <span className='text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-poppins font-medium'>
                    {useStealthAddress ? 'Maximum' : 'Standard'}
                  </span>
                </div>
                <div className='flex items-center justify-between pt-3'>
                  <span className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>Total</span>
                  <span className='text-lg font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>
                    {amount ? (parseFloat(amount) + 500).toLocaleString() : '0'} IDRX
                  </span>
                </div>
              </div>

              <div className='mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                <p className='text-sm text-blue-800 dark:text-blue-300 font-poppins'>
                  <strong>Privacy Mode Active:</strong> Your transaction will be completely private using stealth
                  addresses and zero-knowledge proofs.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
