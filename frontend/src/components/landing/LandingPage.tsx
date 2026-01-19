'use client';

import React from 'react';
import Hero from './Hero';
import WhyChooseNinah from './WhyChooseNinah';
import HowItWorks from './HowItWorks';
import CTASection from './CTASection';
import Footer from './Footer';

export default function LandingPage() {
  const navItems = [
    {
      label: 'Products',
      bgColor: 'oklch(var(--primary))',
      textColor: 'oklch(var(--primary-foreground))',
      links: [
        { label: 'Wallet', href: '/wallet', ariaLabel: 'Go to Wallet' },
        { label: 'Payments', href: '/payments', ariaLabel: 'Send Payments' },
        { label: 'Receive', href: '/receive', ariaLabel: 'Receive Payments' },
      ],
    },
    {
      label: 'Features',
      bgColor: 'oklch(var(--accent))',
      textColor: 'oklch(var(--accent-foreground))',
      links: [
        { label: 'Stealth Addresses', href: '/features/stealth', ariaLabel: 'Learn about Stealth Addresses' },
        { label: 'Zero-Knowledge', href: '/features/zkp', ariaLabel: 'Learn about Zero-Knowledge Proofs' },
        { label: 'Privacy', href: '/features/privacy', ariaLabel: 'Learn about Privacy Features' },
      ],
    },
    {
      label: 'Resources',
      bgColor: 'oklch(var(--secondary))',
      textColor: 'oklch(var(--secondary-foreground))',
      links: [
        { label: 'Documentation', href: '/docs', ariaLabel: 'View Documentation' },
        { label: 'API Reference', href: '/api', ariaLabel: 'View API Reference' },
        { label: 'Community', href: '/community', ariaLabel: 'Join Community' },
      ],
    },
  ];

  return (
    <>
      <Hero navItems={navItems} />
      <WhyChooseNinah />
      <HowItWorks />
      <CTASection />
      <Footer />
    </>
  );
}
