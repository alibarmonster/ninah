'use client';

import React, { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import UsernameInput, { UsernameStatus } from '@/components/username/UsernameInput';
import {
  extractCommitmentFromPublicValues,
  extractUsernameHashFromPublicValues,
  encodeProofForContract,
} from '@/lib/api';
import { useUsernameProof, useRegisterUsername } from '@/hooks';
import { IconLoader2, IconCheck, IconAlertCircle } from '@tabler/icons-react';

type RegistrationStep = 'input' | 'generating' | 'submitting' | 'success' | 'error';

interface UsernameRegistrationProps {
  onSuccess?: (username: string) => void;
  className?: string;
}

export default function UsernameRegistration({ onSuccess, className = '' }: UsernameRegistrationProps) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [step, setStep] = useState<RegistrationStep>('input');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const walletAddress = user?.wallet?.address || '0x0000000000000000000000000000000000000000';

  // Mutations
  const usernameProofMutation = useUsernameProof();
  const registerUsernameMutation = useRegisterUsername();

  const canRegister = usernameStatus === 'available' && username.length > 0;

  const handleRegister = async () => {
    const wallet = wallets[0];
    if (!canRegister || !wallet) return;

    setError(null);
    setStep('generating');

    // Generate a random secret (32 bytes)
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);

    try {
      // Step 1: Generate ZK proof via backend API
      console.log('Generating ZK proof for username:', username);
      const proofResult = await usernameProofMutation.mutateAsync({
        username,
        wallet: walletAddress,
        secret,
      });

      setStep('submitting');

      // Step 2: Get Privy wallet provider
      const provider = await wallet.getEthereumProvider();

      // Step 3: Submit to contract (privacy-preserving)
      console.log('Submitting registration to contract...');

      // Extract values from proof result
      const usernameHash = extractUsernameHashFromPublicValues(proofResult.public_values);
      const commitment = extractCommitmentFromPublicValues(proofResult.public_values);
      const encodedProof = encodeProofForContract(proofResult.vkey, proofResult.public_values, proofResult.proof);

      const receipt = await registerUsernameMutation.mutateAsync({
        provider,
        account: walletAddress as `0x${string}`,
        usernameHash, // Privacy: no plaintext on-chain
        commitment,
        proof: encodedProof,
      });

      if (receipt.status === 'success') {
        setTxHash(receipt.transactionHash);
        setStep('success');
        onSuccess?.(username);

        // Redirect to app after 2 seconds
        setTimeout(() => {
          router.push('/app');
        }, 2000);
      } else {
        setError('Transaction reverted');
        setStep('error');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStep('error');
    } finally {
      // Zero out secret from memory
      secret.fill(0);
    }
  };

  const handleRetry = () => {
    setStep('input');
    setError(null);
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-foreground font-grotesk mb-2'>Claim Your Username</h1>
        <p className='text-muted-foreground font-poppins'>Choose a unique username for private payments</p>
      </div>

      {/* Input Step */}
      {step === 'input' && (
        <div className='space-y-6'>
          <UsernameInput value={username} onChange={setUsername} onStatusChange={setUsernameStatus} disabled={false} />

          <button
            onClick={handleRegister}
            disabled={!canRegister}
            className='w-full py-4 rounded-lg bg-primary text-primary-foreground font-semibold font-poppins transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'>
            Register Username
          </button>

          <p className='text-sm text-muted-foreground text-center font-poppins'>
            This will generate a ZK proof to register your username on-chain.
          </p>
        </div>
      )}

      {/* Generating Proof Step */}
      {step === 'generating' && (
        <div className='text-center py-12 space-y-4'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10'>
            <IconLoader2 className='w-8 h-8 text-primary animate-spin' />
          </div>
          <h2 className='text-xl font-semibold text-foreground font-grotesk'>Generating ZK Proof</h2>
          <p className='text-muted-foreground font-poppins'>This may take a few seconds...</p>
          <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
            <span className='inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse' />
            Proving that @{username} belongs to you
          </div>
        </div>
      )}

      {/* Submitting Transaction Step */}
      {step === 'submitting' && (
        <div className='text-center py-12 space-y-4'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10'>
            <IconLoader2 className='w-8 h-8 text-primary animate-spin' />
          </div>
          <h2 className='text-xl font-semibold text-foreground font-grotesk'>Registering On-Chain</h2>
          <p className='text-muted-foreground font-poppins'>Submitting your proof to the blockchain...</p>
          <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
            <span className='inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse' />
            Confirming transaction
          </div>
        </div>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <div className='text-center py-12 space-y-4'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10'>
            <IconCheck className='w-8 h-8 text-green-500' />
          </div>
          <h2 className='text-xl font-semibold text-foreground font-grotesk'>Welcome, @{username}!</h2>
          <p className='text-muted-foreground font-poppins'>Your username has been registered successfully.</p>
          {txHash && (
            <p className='text-xs text-muted-foreground font-mono break-all'>
              Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
          )}
          <p className='text-sm text-muted-foreground font-poppins'>Redirecting to dashboard...</p>
        </div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className='text-center py-12 space-y-4'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10'>
            <IconAlertCircle className='w-8 h-8 text-red-500' />
          </div>
          <h2 className='text-xl font-semibold text-foreground font-grotesk'>Registration Failed</h2>
          <p className='text-red-500 font-poppins'>{error}</p>
          <button
            onClick={handleRetry}
            className='px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold font-poppins hover:opacity-90 transition-opacity'>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
