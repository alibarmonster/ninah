'use client';

import React from 'react';
import SpotlightCard from '@/components/react-bits/SpotlightCard';
import { EyeOff, ShieldCheck, Zap, ArrowLeftRight, Lock, Wallet } from 'lucide-react';

const features = [
  {
    icon: EyeOff,
    title: 'Stealth Addresses',
    description:
      'Generate unique one-time addresses for every transaction, keeping your identity private and secure on the blockchain.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero-Knowledge Proofs',
    description:
      'Verify transactions without revealing sensitive information. Complete privacy meets complete transparency.',
  },
  {
    icon: Zap,
    title: 'IDRX Network',
    description:
      'Built on high-performance infrastructure for instant, low-cost peer-to-peer payments in Indonesian Rupiah.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Peer-to-Peer',
    description:
      'Send and receive payments directly without intermediaries. Your money, your control, your privacy.',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description:
      'Military-grade encryption protects your transaction data from sender to receiver. No one else can see.',
  },
  {
    icon: Wallet,
    title: 'Self-Custody',
    description:
      'You hold the keys to your funds. No bank, no third party, no risks of centralized control or censorship.',
  },
];

export default function Features() {
  return (
    <section className="relative w-full bg-background py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground font-grotesk">
            Why Choose Ninah?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-poppins">
            Privacy-first payments designed for the modern era. Built with cutting-edge cryptography.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <SpotlightCard key={index} spotlightColor="rgba(96, 165, 250, 0.25)">
                <div className="relative z-10">
                  <IconComponent className="w-12 h-12 mb-4 text-primary" strokeWidth={1.5} />
                  <h3 className="text-2xl font-bold mb-3 text-foreground font-grotesk">{feature.title}</h3>
                  <p className="text-base text-muted-foreground font-poppins">{feature.description}</p>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
