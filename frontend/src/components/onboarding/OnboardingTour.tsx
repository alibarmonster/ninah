'use client';

import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h3 className="text-lg font-bold mb-2">Welcome to Ninah! 👋</h3>
        <p className="text-sm text-zinc-400">
          Let&apos;s take a quick tour to help you get started with private stablecoin payments.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[href="/app"]',
    content: (
      <div>
        <h3 className="text-base font-bold mb-2">Dashboard</h3>
        <p className="text-sm text-zinc-400">
          Your home base. View your balance, transaction history, and payment stats at a glance.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[href="/app/wallet"]',
    content: (
      <div>
        <h3 className="text-base font-bold mb-2">Wallet</h3>
        <p className="text-sm text-zinc-400">
          Manage your funds. Get testnet tokens from the faucet to start experimenting.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[href="/app/send"]',
    content: (
      <div>
        <h3 className="text-base font-bold mb-2">Send Payments</h3>
        <p className="text-sm text-zinc-400">
          Send stablecoins privately. Just enter a username and amount — the recipient&apos;s real address stays hidden.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[href="/app/receive"]',
    content: (
      <div>
        <h3 className="text-base font-bold mb-2">Receive Payments</h3>
        <p className="text-sm text-zinc-400">
          Scan for incoming stealth payments and claim them to your wallet. Only you can see and access these funds.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[href="/app/settings"]',
    content: (
      <div>
        <h3 className="text-base font-bold mb-2">Settings</h3>
        <p className="text-sm text-zinc-400">
          Configure your account, manage stealth keys, and set your username for receiving payments.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h3 className="text-lg font-bold mb-2">You&apos;re all set! 🎉</h3>
        <p className="text-sm text-zinc-400">
          Start by getting some testnet tokens from the Wallet page, then try sending a private payment.
        </p>
      </div>
    ),
    placement: 'center',
  },
];

const TOUR_COMPLETED_KEY = 'ninah_onboarding_completed';

export default function OnboardingTour() {
  const [run, setRun] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has completed the tour
    const hasCompletedTour = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!hasCompletedTour) {
      // Small delay to let the page render
      const timer = setTimeout(() => setRun(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    }
  };

  // Don't render on server
  if (!mounted) return null;

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleJoyrideCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Get Started',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      styles={{
        options: {
          arrowColor: '#18181b',
          backgroundColor: '#18181b',
          overlayColor: 'rgba(0, 0, 0, 0.75)',
          primaryColor: '#3b82f6',
          textColor: '#fafafa',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
        },
        tooltipContent: {
          padding: '12px 0 0 0',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          color: '#fff',
          fontSize: 14,
          fontWeight: 500,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#a1a1aa',
          fontSize: 14,
          fontWeight: 500,
          marginRight: 8,
        },
        buttonSkip: {
          color: '#71717a',
          fontSize: 13,
        },
        spotlight: {
          borderRadius: 8,
        },
        beacon: {
          display: 'none',
        },
      }}
    />
  );
}

// Export a function to reset the tour (useful for settings page)
export function resetOnboardingTour() {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}
