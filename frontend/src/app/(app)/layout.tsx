'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/aceternity/Sidebar';
import {
  IconHome,
  IconWallet,
  IconArrowsExchange,
  IconDownload,
  IconSettings,
  IconUserCircle,
  IconLogout,
} from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import AuthGuard from '@/components/providers/AuthGuard';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { keyManager } from '@/lib/keys';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = usePrivy();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    keyManager.lock();
    await logout();
    router.push('/login');
  };

  const links = [
    {
      label: 'Dashboard',
      href: '/app',
      icon: <IconHome className='text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0' />,
    },
    {
      label: 'Wallet',
      href: '/app/wallet',
      icon: <IconWallet className='text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0' />,
    },
    {
      label: 'Send',
      href: '/app/send',
      icon: <IconArrowsExchange className='text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0' />,
    },
    {
      label: 'Receive',
      href: '/app/receive',
      icon: <IconDownload className='text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0' />,
    },
    {
      label: 'Settings',
      href: '/app/settings',
      icon: <IconSettings className='text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0' />,
    },
  ];

  return (
    <AuthGuard>
      <OnboardingTour />
      <div
        className={cn(
          'flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden',
          'h-screen',
        )}>
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className='justify-between gap-10'>
            <div className='flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
              {open ? <Logo /> : <LogoIcon />}
              <div className='mt-8 flex flex-col gap-2'>
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div>
              <SidebarLink
                link={{
                  label: 'Profile',
                  href: '/app/profile',
                  icon: <IconUserCircle className='text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0' />,
                }}
              />
              <SidebarLink
                link={{
                  label: 'Logout',
                  icon: <IconLogout className='text-neutral-700 dark:text-neutral-200 h-5 w-5 shrink-0' />,
                  onClick: handleLogout,
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        <main className='flex-1 overflow-auto'>{children}</main>
      </div>
    </AuthGuard>
  );
}

const Logo = () => {
  return (
    <Link href='/' className='font-normal flex space-x-2 items-center text-sm py-1 relative z-20'>
      <Image src='/ninah-logo.svg' alt='Ninah' width={160} height={53} className='h-10 w-auto' />
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link href='/' className='font-normal flex space-x-2 items-center text-sm py-1 relative z-20'>
      <Image src='/ninah-only-logo.svg' alt='Ninah' width={48} height={48} className='h-12 w-12 shrink-0' />
    </Link>
  );
};
