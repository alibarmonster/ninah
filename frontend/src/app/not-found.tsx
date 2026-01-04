'use client';

import React from 'react';
import FuzzyText from '@/components/react-bits/FuzzyText';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen w-full bg-background flex flex-col items-center justify-center px-4'>
      <div className='text-center'>
        {/* 404 Number with Fuzzy Effect */}
        <div className='mb-8'>
          <FuzzyText fontSize='clamp(6rem, 20vw, 12rem)' fontWeight={900} baseIntensity={0.3} hoverIntensity={0.7}>
            404
          </FuzzyText>
        </div>

        {/* Error Message */}
        <h1 className='text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-foreground font-grotesk'>
          This page could not be found.
        </h1>

        <p className='text-base md:text-lg text-muted-foreground mb-8 max-w-md mx-auto font-poppins'>
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Back to Home Button */}
        <Link href='/'>
          <Button
            size='lg'
            className='px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 font-poppins'>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
