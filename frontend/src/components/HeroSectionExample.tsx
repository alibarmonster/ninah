'use client';

import React from 'react';
import HeroSection from './HeroSection';

/**
 * Example usage of the HeroSection component
 * This demonstrates how to set up the hero section with CardNav and GooeyNav
 */
export default function HeroSectionExample() {
  // CardNav configuration
  const cardNavItems = [
    {
      label: 'Products',
      bgColor: '#3b82f6',
      textColor: '#ffffff',
      links: [
        { label: 'Wallet', href: '/wallet', ariaLabel: 'Go to Wallet' },
        { label: 'Exchange', href: '/exchange', ariaLabel: 'Go to Exchange' },
        { label: 'Staking', href: '/staking', ariaLabel: 'Go to Staking' }
      ]
    },
    {
      label: 'Resources',
      bgColor: '#8b5cf6',
      textColor: '#ffffff',
      links: [
        { label: 'Documentation', href: '/docs', ariaLabel: 'View Documentation' },
        { label: 'API Reference', href: '/api', ariaLabel: 'View API Reference' },
        { label: 'Tutorials', href: '/tutorials', ariaLabel: 'View Tutorials' }
      ]
    },
    {
      label: 'Company',
      bgColor: '#ec4899',
      textColor: '#ffffff',
      links: [
        { label: 'About Us', href: '/about', ariaLabel: 'Learn About Us' },
        { label: 'Blog', href: '/blog', ariaLabel: 'Read Our Blog' },
        { label: 'Careers', href: '/careers', ariaLabel: 'View Careers' }
      ]
    }
  ];

  // GooeyNav configuration - typically for page sections
  const gooeyNavItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' }
  ];

  return (
    <HeroSection
      logo="/logo.svg"
      logoAlt="Ninja Rupiah Logo"
      cardNavItems={cardNavItems}
      gooeyNavItems={gooeyNavItems}
      title="Ninja Rupiah"
      subtitle="Privacy-first cryptocurrency platform with stealth addresses and zero-knowledge proofs"
      ctaText="Launch App"
      ctaHref="/app"
    />
  );
}
