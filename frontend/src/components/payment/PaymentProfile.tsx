'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'motion/react';
import { Button as StatefulButton } from '@/components/aceternity/StatefulButton';
// TODO: Uncomment when contract is ready
// import { Stealth } from '@/lib/crypto/stealth';
// import { Bytes } from '@/lib/helpers/bytes';

interface PaymentProfileProps {
  username: string;
  avatar: string;
  metaViewingPub: string;
  metaSpendingPub: string;
}

export function PaymentProfile({ 
  username, 
  avatar, 
  metaViewingPub, 
  metaSpendingPub 
}: PaymentProfileProps) {
  const { connectWallet, authenticated } = usePrivy();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'sending' | 'success' | 'error'>('idle');

  const handlePay = async () => {
    if (!authenticated) {
      connectWallet();
      return;
    }

    setStatus('generating');

    try {
      // TODO: Uncomment when contract is ready
      // // 1. Generate Stealth Address
      // const viewingPubBytes = Bytes.hexToBytes(metaViewingPub.replace('0x', ''));
      // const spendingPubBytes = Bytes.hexToBytes(metaSpendingPub.replace('0x', ''));
      // const stealthData = Stealth.generateStealthAddress(viewingPubBytes, spendingPubBytes);
      // // 2. Transfer IDRX to stealth address
      // await idrxContract.transfer(stealthData.stealthAddress, parseUnits(amount, 2));
      // // 3. Announce ephemeral pubkey and view tag
      // await ninjaContract.announce(stealthData.ephemeralPub, stealthData.viewTag);

      // Mock delay for generating
      await new Promise(r => setTimeout(r, 1000));

      setStatus('sending');

      // Mock delay for sending
      await new Promise(r => setTimeout(r, 1500));

      // Mock: amount < 10 = success, amount >= 10 = fail (for testing)
      const amountNum = parseFloat(amount) || 0;
      if (amountNum >= 10) {
        throw new Error('Insufficient balance');
      }

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-black border border-neutral-200 dark:border-white/[0.2] rounded-2xl shadow-xl">
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative">
          <img 
            src={avatar} 
            alt={username} 
            className="w-24 h-24 rounded-full border-4 border-violet-500 shadow-lg"
          />
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">
            @{username}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Accepting payments securely & anonymously
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1 block">
            Amount (IDRX)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-3 text-2xl font-mono font-bold text-neutral-800 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>

        {authenticated ? (
          <StatefulButton
            onClick={handlePay}
            state={
              status === 'generating' || status === 'sending'
                ? 'loading'
                : 'idle'
            }
            className="w-full py-4 rounded-xl font-bold text-lg bg-violet-600 hover:bg-violet-500 hover:ring-violet-500"
          >
            {status === 'idle' && 'Pay Now'}
            {status === 'generating' && 'Generating stealth address...'}
            {status === 'sending' && 'Sending payment...'}
            {status === 'success' && 'Payment Sent!'}
            {status === 'error' && 'Try Again'}
          </StatefulButton>
        ) : (
          <button
            onClick={() => connectWallet()}
            className="w-full py-4 rounded-xl font-bold text-lg bg-neutral-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all transform active:scale-95"
          >
            Connect Wallet to Pay
          </button>
        )}

        {status === 'success' && (
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-center text-sm font-medium"
           >
             Transaction successful!
           </motion.div>
        )}

        {status === 'error' && (
           <motion.div
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-center text-sm font-medium"
           >
             Payment failed. Please try again.
           </motion.div>
        )}
      </div>
    </div>
  );
}
