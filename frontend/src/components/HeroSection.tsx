'use client';

import React from 'react';
import PixelSnow from './react-bits/PixelSnow';
import CardNav from './react-bits/CardNav';
import GooeyNav from './react-bits/GooeyNav';

export interface HeroSectionProps {
  // CardNav props
  logo: string;
  logoAlt?: string;
  cardNavItems: Array<{
    label: string;
    bgColor: string;
    textColor: string;
    links: Array<{
      label: string;
      href: string;
      ariaLabel: string;
    }>;
  }>;

  // GooeyNav props
  gooeyNavItems: Array<{
    label: string;
    href: string;
  }>;

  // Hero content
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;

  // Styling
  className?: string;
}

export default function HeroSection({
  logo,
  logoAlt,
  cardNavItems,
  title = 'Welcome to Ninja Rupiah',
  subtitle = 'Secure, private, and fast cryptocurrency transactions',
  ctaText = 'Get Started',
  ctaHref = '#get-started',
  className = '',
}: HeroSectionProps) {
  return (
    <section className={`relative min-h-screen w-full bg-background overflow-hidden ${className}`}>
      {/* PixelSnow Background */}
      <PixelSnow
        color='#60a5fa'
        variant='square'
        speed={0.6}
        density={0.25}
        direction={125}
        brightness={1}
        className='z-0'
        pixelResolution={200}
        farPlane={20}
      />

      {/* CardNav - Fixed at top */}
      <CardNav
        logo={logo}
        logoAlt={logoAlt}
        items={cardNavItems}
        baseColor='oklch(var(--card))'
        menuColor='oklch(var(--card-foreground))'
        buttonBgColor='oklch(var(--primary))'
        buttonTextColor='oklch(var(--primary-foreground))'
      />

      {/* Hero Content */}
      <div className='relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-32 pb-20'>
        {/* Main Title */}
        <h1 className='text-5xl md:text-7xl lg:text-8xl font-bold text-center mb-6 bg-linear-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent'>
          {title}
        </h1>

        {/* Subtitle */}
        <p className='text-lg md:text-xl lg:text-2xl text-muted-foreground text-center max-w-3xl mb-12'>{subtitle}</p>

        {/* CTA Button */}
        <a
          href={ctaHref}
          className='px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:opacity-90 mb-16'>
          {ctaText}
        </a>
      </div>
    </section>
  );
}
