'use client';

import React from 'react';
import MagicBento from '@/components/react-bits/MagicBento';
import type { BentoCardProps } from '@/components/react-bits/MagicBento';

const ninahCardData: BentoCardProps[] = [
  {
    title: 'Stealth Addresses',
    description: 'Enhanced privacy with one-time addresses for each transaction',
    label: 'Privacy',
  },
  {
    title: 'Zero-Knowledge Proofs',
    description: 'Verify transactions without revealing sensitive data',
    label: 'Security',
  },
  {
    title: 'Base Network',
    description: 'Built on secure and scalable Base blockchain infrastructure',
    label: 'Infrastructure',
  },
  {
    title: 'Self Custody',
    description: 'Smart contract secured, no one can freeze or seize your funds',
    label: 'Trustless',
  },
  {
    title: 'Stablecoin Native',
    description: 'Seamless integration with Stablecoin currency',
    label: 'Currency',
  },
  {
    title: 'Fast Settlements',
    description: 'Quick transaction confirmation with low network fees',
    label: 'Speed',
  },
];

export interface WhyChooseNinahProps {
  className?: string;
}

export default function WhyChooseNinah({ className = '' }: WhyChooseNinahProps) {
  return (
    <section className={`relative w-full bg-background py-24 px-4 ${className}`}>
      {/* Section Title */}
      <div className='max-w-6xl mx-auto mb-16 text-center'>
        <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground font-grotesk'>
          Why Choose Ninah?
        </h2>
        <p className='text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-poppins'>
          Experience the future of private payments with cutting-edge blockchain technology
        </p>
      </div>

      {/* Magic Bento Grid */}
      <div className='flex justify-center items-center'>
        <MagicBento
          cardData={ninahCardData}
          textAutoHide={false}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          spotlightRadius={300}
          particleCount={15}
          enableTilt={false}
          glowColor='96, 165, 250'
          clickEffect={true}
          enableMagnetism={true}
        />
      </div>
    </section>
  );
}
