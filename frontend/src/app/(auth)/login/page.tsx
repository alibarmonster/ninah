'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

// Dynamically import Dither with no SSR to prevent server-side rendering issues
const Dither = dynamic(() => import('@/components/react-bits/Dither'), {
  ssr: false,
  loading: () => <div className='w-full h-full bg-background' />,
});

export default function LoginPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin({
    onComplete: ({ user, isNewUser, wasAlreadyAuthenticated, loginMethod }) => {
      console.log('Login successful:', { user, isNewUser, wasAlreadyAuthenticated, loginMethod });
      // Redirect to app after successful login
      router.push('/app');
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (ready && authenticated) {
      router.push('/app');
    }
  }, [ready, authenticated, router]);

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      {/* Dither Background */}
      <div className='absolute inset-0 z-0'>
        <Dither
          waveSpeed={0.03}
          waveFrequency={2.5}
          waveAmplitude={0.35}
          waveColor={[0.37, 0.64, 0.98]} // Blue color matching the theme
          colorNum={6}
          pixelSize={3}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={1.2} // Larger radius for more noticeable mouse interaction
        />
      </div>

      {/* Login Form */}
      <div className='relative z-10 flex items-center justify-center min-h-screen px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='w-full max-w-md'>
          {/* Card Container */}
          <div className='bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8'>
            {/* Logo/Header */}
            <div className='text-center mb-8'>
              <h1 className='text-4xl font-bold font-grotesk text-foreground mb-2'>Welcome Back</h1>
              <p className='text-muted-foreground font-poppins'>Sign in to your Ninah account</p>
            </div>

            {!ready ? (
              <div className='flex items-center justify-center py-12'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Main Login Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={login}
                  className='w-full bg-primary text-primary-foreground py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg font-poppins text-lg'>
                  Sign In with Privy
                </motion.button>

                <p className='text-center text-sm text-muted-foreground font-poppins px-4'>
                  Securely log in with email, Google, or connect your wallet
                </p>
              </div>
            )}

            {/* Features */}
            <div className='mt-8 space-y-3'>
              <div className='flex items-start space-x-3'>
                <svg
                  className='w-5 h-5 text-primary mt-0.5 shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                <p className='text-sm text-muted-foreground font-poppins'>
                  No password required - secure authentication
                </p>
              </div>
              <div className='flex items-start space-x-3'>
                <svg
                  className='w-5 h-5 text-primary mt-0.5 shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                <p className='text-sm text-muted-foreground font-poppins'>Embedded wallet created automatically</p>
              </div>
              <div className='flex items-start space-x-3'>
                <svg
                  className='w-5 h-5 text-primary mt-0.5 shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                <p className='text-sm text-muted-foreground font-poppins'>Private, KYC-free payments on Base</p>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className='mt-8 text-center text-sm text-muted-foreground font-poppins'>
              First time here?{' '}
              <button onClick={login} className='text-primary hover:text-primary/80 font-semibold transition-colors'>
                Create an account
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Back to Home */}
      <Link
        href='/'
        className='absolute top-8 left-8 z-20 text-foreground/80 hover:text-foreground transition-colors font-poppins flex items-center space-x-2'>
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
        </svg>
        <span>Back to Home</span>
      </Link>
    </div>
  );
}
