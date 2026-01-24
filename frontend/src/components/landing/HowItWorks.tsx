'use client';

import React, { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Create Wallet',
    description: 'Email or existing wallet. Your keys stay yours.',
  },
  {
    number: '02',
    title: 'Generate Keys',
    description: 'Stealth meta-address. Untraceable by design.',
  },
  {
    number: '03',
    title: 'Share Username',
    description: 'Just your @username. Real address stays hidden.',
  },
  {
    number: '04',
    title: 'Receive Privately',
    description: 'One-time address. Only you can access.',
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(-1);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the step reveals
            steps.forEach((_, index) => {
              setTimeout(() => setActiveStep(index), index * 200);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-32 px-6 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(222 47% 6%) 50%, hsl(var(--background)) 100%)',
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(90deg, white 1px, transparent 1px),
            linear-gradient(180deg, white 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="mb-24">
          <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-4 font-mono">
            Protocol
          </p>
          <h2 className="text-5xl md:text-7xl font-light text-white tracking-tight leading-[0.9]">
            Four steps to
            <br />
            <span className="text-zinc-500">invisibility</span>
          </h2>
        </div>

        {/* Steps - Diagonal stagger layout */}
        <div className="relative">
          {/* Transmission line */}
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none hidden lg:block"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                <stop offset="20%" stopColor="rgb(59, 130, 246)" stopOpacity="0.5" />
                <stop offset="80%" stopColor="rgb(59, 130, 246)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 120 80 Q 300 80, 350 200 Q 400 320, 580 320 Q 760 320, 810 440 Q 860 560, 1040 560"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1"
              strokeDasharray="8 4"
              className="opacity-40"
            />
          </svg>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`
                  relative transition-all duration-700 ease-out
                  ${index <= activeStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  marginTop: `${index * 40}px`,
                }}
              >
                {/* Card */}
                <div className="group relative">
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-px bg-gradient-to-b from-blue-500/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

                  <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 transition-all duration-300 group-hover:border-zinc-700/50 group-hover:bg-zinc-900/70">
                    {/* Number */}
                    <span className="text-6xl font-extralight text-zinc-800 group-hover:text-zinc-700 transition-colors font-mono block mb-6">
                      {step.number}
                    </span>

                    {/* Content */}
                    <h3 className="text-lg font-medium text-white mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Progress indicator */}
                    <div className="mt-6 h-px bg-zinc-800 relative overflow-hidden">
                      <div
                        className={`
                          absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400
                          transition-all duration-1000 ease-out
                          ${index <= activeStep ? 'w-full' : 'w-0'}
                        `}
                        style={{ transitionDelay: `${index * 200 + 400}ms` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-24 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <p className="text-xs text-zinc-600 tracking-widest uppercase font-mono">
            End-to-end privacy
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        </div>
      </div>
    </section>
  );
}
