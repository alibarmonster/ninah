'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useSignMessage, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Stepper, { Step } from '@/components/react-bits/Stepper';
import { Check, X, Loader2, AlertCircle, Wallet, Eye, EyeOff, Shield } from 'lucide-react';
import { Validation } from '@/lib/username/validation';
import { Validation as PasswordValidation } from '@/lib/helpers/validation';
import { parseErrorMessage } from '@/lib/helpers/errors';
import { keyManager } from '@/lib/keys';
import { isUsernameAvailable } from '@/lib/contracts';
import {
  extractCommitmentFromPublicValues,
  extractUsernameHashFromPublicValues,
  encodeProofForContract,
} from '@/lib/api';
import { useUsernameProof, useRegisterUsername, useRegisterMetaKeys } from '@/hooks';

type UsernameStatus = 'idle' | 'typing' | 'validating' | 'available' | 'taken' | 'invalid';
type RegistrationStatus = 'idle' | 'generating' | 'submitting' | 'success' | 'error';

export default function CTASection() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('idle');
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState('');

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isDerivingKeys, setIsDerivingKeys] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const walletAddress = user?.wallet?.address || '0x0000000000000000000000000000000000000000';
  const userIdentifier = user?.email?.address || user?.google?.email || user?.twitter?.username || walletAddress;

  // Mutations - using embedded wallet (user pays gas for now)
  const usernameProofMutation = useUsernameProof();
  const registerUsernameMutation = useRegisterUsername();
  const registerMetaKeysMutation = useRegisterMetaKeys();

  // Debounce username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Validate and check availability
  useEffect(() => {
    const validateAndCheck = async () => {
      if (!debouncedUsername || debouncedUsername.length === 0) {
        setUsernameStatus('idle');
        setValidationError(null);
        return;
      }

      // Validate format first
      const validation = Validation.validateUsername(debouncedUsername);
      if (!validation.valid) {
        setUsernameStatus('invalid');
        setValidationError(validation.error || 'Invalid username');
        return;
      }

      // Check availability
      setUsernameStatus('validating');
      setValidationError(null);

      try {
        const available = await isUsernameAvailable(debouncedUsername);
        setUsernameStatus(available ? 'available' : 'taken');
        setValidationError(available ? null : 'Username is already taken');
      } catch {
        setUsernameStatus('invalid');
        setValidationError('Failed to check availability');
      }
    };

    validateAndCheck();
  }, [debouncedUsername]);

  // Validate password on change
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordErrors([]);
      return;
    }

    const result = PasswordValidation.validatePassword(password, [username, userIdentifier]);
    setPasswordStrength(result.strength);
    setPasswordErrors(result.errors);
  }, [password, username, userIdentifier]);

  // Handle username input
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9.\-_]/g, '');
    setUsername(value);
    setUsernameStatus('typing');
  };

  // Handle registration
  const handleRegister = useCallback(async () => {
    // Filter for Privy embedded wallet (not external wallets like Rabby)
    const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
    if (!authenticated || usernameStatus !== 'available' || !embeddedWallet) return;

    setRegistrationStatus('generating');
    setRegistrationError(null);

    // Generate random secret
    const secret = new Uint8Array(32);
    crypto.getRandomValues(secret);

    try {
      // Step 1: Generate ZK proof via backend API
      const proofResult = await usernameProofMutation.mutateAsync({
        username,
        wallet: embeddedWallet.address, // Use embedded wallet address from Privy
        secret,
      });

      // Debug: Log what the backend returned
      console.log('Backend proof result:', proofResult);
      console.log('public_values:', proofResult.public_values);
      console.log('proof:', proofResult.proof);

      setRegistrationStatus('submitting');

      // Step 2: Switch to Base Sepolia and get wallet provider
      await embeddedWallet.switchChain(84532); // Base Sepolia chain ID

      // Extract commitment from public_values
      const commitment = extractCommitmentFromPublicValues(proofResult.public_values);
      console.log('Extracted commitment:', commitment);

      // Extract usernameHash from public_values (privacy: no plaintext on-chain!)
      const usernameHash = extractUsernameHashFromPublicValues(proofResult.public_values);
      console.log('Extracted usernameHash:', usernameHash);

      // Encode proof for contract: abi.encode(vkeyHash, publicValues, proofBytes)
      const encodedProof = encodeProofForContract(proofResult.vkey, proofResult.public_values, proofResult.proof);
      console.log('Encoded proof for contract:', encodedProof);

      // Step 3: Get wallet provider and submit to contract
      const provider = await embeddedWallet.getEthereumProvider();
      const receipt = await registerUsernameMutation.mutateAsync({
        provider,
        account: embeddedWallet.address as `0x${string}`,
        usernameHash, // Privacy: no plaintext username on-chain!
        commitment,
        proof: encodedProof, // Use encoded proof (vkey + publicValues + proof)
      });

      if (receipt.status === 'success') {
        setRegistrationStatus('success');
      } else {
        setRegistrationStatus('error');
        setRegistrationError('Transaction reverted');
      }
    } catch (err) {
      setRegistrationStatus('error');
      // Parse error for user-friendly message
      const errorMessage = parseErrorMessage(err);
      setRegistrationError(errorMessage);
    } finally {
      // Zero out secret from memory
      secret.fill(0);
    }
  }, [authenticated, usernameStatus, username, wallets, usernameProofMutation, registerUsernameMutation]);

  // Handle password submission and key derivation
  const handleCreatePassword = async () => {
    if (passwordErrors.length > 0 || password !== confirmPassword) return;

    // Filter for Privy embedded wallet (not external wallets like Rabby)
    const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
    if (!embeddedWallet) {
      setKeyError('Embedded wallet not available');
      return;
    }

    setIsDerivingKeys(true);
    setKeyError(null);

    try {
      // Determine auth method from user login
      const authMethod = user?.email
        ? 'email'
        : user?.google
        ? 'email'
        : user?.twitter
        ? 'twitter'
        : user?.discord
        ? 'discord'
        : user?.phone
        ? 'phone'
        : 'wallet';

      // Initialize keys using keyManager (real implementation)
      // This will:
      // 1. Hash password with Argon2id
      // 2. Get wallet signature for two-factor derivation
      // 3. Derive master key using HKDF-Keccak256
      // 4. Generate viewing/spending keypairs
      // 5. Encrypt and store keys in IndexedDB
      await keyManager.initialize({
        password: password,
        wallet: {
          address: embeddedWallet.address,
          signMessage: async (message: string) => {
            const result = await signMessage({ message }, { address: embeddedWallet.address });
            return result.signature;
          },
        },
        userIdentifier: userIdentifier,
        authMethod: authMethod,
      });

      // Get public keys for on-chain registration
      const publicKeys = keyManager.getPublicKeys();

      // Get wallet provider for meta keys registration
      const provider = await embeddedWallet.getEthereumProvider();
      await registerMetaKeysMutation.mutateAsync({
        provider,
        account: embeddedWallet.address as `0x${string}`,
        metaViewingPub: publicKeys.metaViewingPub,
        metaSpendingPub: publicKeys.metaSpendingPub,
      });

      // Clear passwords from memory before navigation
      setPassword('');
      setConfirmPassword('');

      // Redirect to dashboard
      router.push('/app');
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Failed to create keys');
      setIsDerivingKeys(false);
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (usernameStatus) {
      case 'validating':
        return <Loader2 className='w-5 h-5 text-yellow-500 animate-spin' />;
      case 'available':
        return <Check className='w-5 h-5 text-green-500' />;
      case 'taken':
      case 'invalid':
        return <X className='w-5 h-5 text-red-500' />;
      default:
        return null;
    }
  };

  // Get status message
  const getStatusMessage = () => {
    if (validationError) {
      return <span className='text-sm text-red-500 font-poppins'>{validationError}</span>;
    }
    switch (usernameStatus) {
      case 'validating':
        return <span className='text-sm text-muted-foreground font-poppins'>Checking availability...</span>;
      case 'available':
        return <span className='text-sm text-green-500 font-poppins'>@{username} is available!</span>;
      default:
        return null;
    }
  };

  // Get border color based on status
  const getBorderColor = () => {
    switch (usernameStatus) {
      case 'available':
        return 'border-green-500 focus:ring-green-500';
      case 'taken':
      case 'invalid':
        return 'border-red-500 focus:ring-red-500';
      case 'validating':
        return 'border-yellow-500 focus:ring-yellow-500';
      default:
        return 'border-border focus:ring-primary';
    }
  };

  // Get password strength color
  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-green-400';
    return 'bg-green-500';
  };

  const getStrengthLabel = (strength: number) => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return labels[strength] || 'Very Weak';
  };

  const canProceedToStep2 = usernameStatus === 'available' && username.length > 0;
  const isPasswordValid = password.length > 0 && passwordErrors.length === 0 && password === confirmPassword;

  return (
    <section className='relative w-full bg-gradient-to-b from-background to-primary/10 py-20 md:py-32 px-4'>
      <div className='max-w-4xl mx-auto text-center'>
        {/* CTA Content */}
        <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground font-grotesk'>
          Ready to Take Control?
        </h2>
        <p className='text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-poppins'>
          Join the privacy revolution. Get started in three simple steps.
        </p>

        {/* Stepper */}
        <div className='w-full max-w-2xl mx-auto'>
          <Stepper
            initialStep={1}
            nextButtonText={canProceedToStep2 ? 'Next' : 'Check Username First'}
            backButtonText='Back'
            disableStepIndicators={registrationStatus !== 'idle'}
            canProceed={(step) => {
              if (step === 1) return usernameStatus === 'available' && username.length > 0;
              if (step === 2) return authenticated;
              // Block completion on Step 3 - we handle it manually
              if (step === 3) return false;
              return true;
            }}>
            {/* Step 1: Choose Username */}
            <Step>
              <h3 className='text-2xl font-bold mb-3 text-foreground font-grotesk'>Claim Your Username</h3>
              <p className='text-base text-muted-foreground mb-4 font-poppins'>
                Pick your unique Ninah username. This will be your identity for receiving private payments.
              </p>

              {/* Username Input */}
              <div className='mt-6 space-y-3'>
                <div className='relative'>
                  <span className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium'>@</span>
                  <input
                    type='text'
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder='yourname'
                    className={`w-full pl-9 pr-12 py-3 bg-background border-2 ${getBorderColor()} rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 font-poppins transition-colors`}
                    maxLength={32}
                  />
                  <div className='absolute right-4 top-1/2 -translate-y-1/2'>{getStatusIcon()}</div>
                </div>
                <div className='min-h-[24px] text-left'>{getStatusMessage()}</div>
                <span className='text-xs text-muted-foreground'>{username.length}/32</span>
              </div>
            </Step>

            {/* Step 2: Connect Wallet */}
            <Step>
              <h3 className='text-2xl font-bold mb-3 text-foreground font-grotesk'>Connect Wallet</h3>
              <p className='text-base text-muted-foreground mb-6 font-poppins'>
                {(() => {
                  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');
                  return authenticated && embeddedWallet
                    ? `Connected as ${embeddedWallet.address.slice(0, 6)}...${embeddedWallet.address.slice(-4)}`
                    : 'Link your wallet to secure your username with a zero-knowledge proof.';
                })()}
              </p>

              {!authenticated ? (
                <button
                  onClick={login}
                  disabled={!ready}
                  className='inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold font-poppins hover:opacity-90 transition-opacity disabled:opacity-50'>
                  <Wallet className='w-5 h-5' />
                  Connect Wallet
                </button>
              ) : (
                <button
                  onClick={logout}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-red-500/10 hover:border-red-500/20 transition-colors group cursor-pointer'>
                  <Wallet className='w-5 h-5 text-green-500 group-hover:text-red-500' />
                  <span className='text-green-500 font-poppins group-hover:text-red-500'>
                    <span className='group-hover:hidden'>Wallet Connected</span>
                    <span className='hidden group-hover:inline'>Disconnect</span>
                  </span>
                </button>
              )}
            </Step>

            {/* Step 3: Register & Create Password */}
            <Step>
              {/* Registration Phase */}
              {registrationStatus !== 'success' && (
                <>
                  <h3 className='text-2xl font-bold mb-3 text-foreground font-grotesk'>Claim @{username}</h3>

                  {registrationStatus === 'idle' && (
                    <>
                      <p className='text-base text-muted-foreground font-poppins mb-6'>
                        Generate your ZK proof and register @{username} on-chain.
                      </p>
                      <button
                        onClick={handleRegister}
                        className='px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold font-poppins hover:opacity-90 transition-opacity'>
                        Register Username
                      </button>
                    </>
                  )}

                  {registrationStatus === 'generating' && (
                    <div className='flex flex-col items-center gap-4 py-6'>
                      <Loader2 className='w-10 h-10 text-primary animate-spin' />
                      <p className='text-muted-foreground font-poppins'>Generating ZK proof...</p>
                    </div>
                  )}

                  {registrationStatus === 'submitting' && (
                    <div className='flex flex-col items-center gap-4 py-6'>
                      <Loader2 className='w-10 h-10 text-blue-500 animate-spin' />
                      <p className='text-muted-foreground font-poppins'>Registering on-chain...</p>
                    </div>
                  )}

                  {registrationStatus === 'error' && (
                    <div className='flex flex-col items-center gap-4 py-6'>
                      <div className='w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center'>
                        <AlertCircle className='w-8 h-8 text-red-500' />
                      </div>
                      <p className='text-red-500 font-poppins'>{registrationError}</p>
                      <button
                        onClick={() => setRegistrationStatus('idle')}
                        className='px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold font-poppins hover:opacity-90 transition-opacity'>
                        Try Again
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Password Creation Phase (after registration success) */}
              {registrationStatus === 'success' && (
                <div className='space-y-6'>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center'>
                      <Check className='w-6 h-6 text-green-500' />
                    </div>
                    <p className='text-green-500 font-semibold font-poppins'>@{username} registered!</p>
                  </div>

                  <div className='text-left'>
                    <h3 className='text-xl font-bold mb-2 text-foreground font-grotesk flex items-center gap-2'>
                      <Shield className='w-5 h-5' />
                      Create Your Password
                    </h3>
                    <p className='text-sm text-muted-foreground font-poppins mb-4'>
                      This password protects your stealth keys. It&apos;s combined with your wallet signature for
                      maximum security.
                    </p>

                    {/* Password Input */}
                    <div className='space-y-4'>
                      <div className='relative'>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder='Enter password'
                          className='w-full px-4 py-3 pr-12 bg-background border-2 border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-poppins'
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword(!showPassword)}
                          className='absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'>
                          {showPassword ? <EyeOff className='w-5 h-5' /> : <Eye className='w-5 h-5' />}
                        </button>
                      </div>

                      {/* Password Strength Bar */}
                      {password.length > 0 && (
                        <div className='space-y-2'>
                          <div className='flex gap-1'>
                            {[0, 1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded ${
                                  level <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-border'
                                }`}
                              />
                            ))}
                          </div>
                          <p
                            className={`text-xs font-poppins ${
                              passwordStrength >= 3 ? 'text-green-500' : 'text-yellow-500'
                            }`}>
                            Strength: {getStrengthLabel(passwordStrength)}
                          </p>
                        </div>
                      )}

                      {/* Password Errors */}
                      {passwordErrors.length > 0 && password.length > 0 && (
                        <ul className='text-xs text-red-500 font-poppins space-y-1'>
                          {passwordErrors.slice(0, 3).map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      )}

                      {/* Confirm Password */}
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder='Confirm password'
                        className={`w-full px-4 py-3 bg-background border-2 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-poppins ${
                          confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-border'
                        }`}
                      />
                      {confirmPassword && password !== confirmPassword && (
                        <p className='text-xs text-red-500 font-poppins'>Passwords do not match</p>
                      )}

                      {/* Submit Button */}
                      <button
                        onClick={handleCreatePassword}
                        disabled={!isPasswordValid || isDerivingKeys}
                        className='w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold font-poppins hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'>
                        {isDerivingKeys ? (
                          <>
                            <Loader2 className='w-5 h-5 animate-spin' />
                            Securing your keys...
                          </>
                        ) : (
                          'Create Password & Continue'
                        )}
                      </button>

                      {/* Key Derivation Error */}
                      {keyError && (
                        <div className='flex items-center gap-2 text-red-500 text-sm font-poppins'>
                          <AlertCircle className='w-4 h-4' />
                          {keyError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Step>
          </Stepper>
        </div>
      </div>
    </section>
  );
}
