'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconUser,
  IconLock,
  IconBell,
  IconMoon,
  IconShield,
  IconLanguage,
  IconDevices,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { resetOnboardingTour } from '@/components/onboarding';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className='flex flex-1 flex-col'>
      <div className='p-4 md:p-10'>
        <h1 className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>Settings</h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-8 font-poppins'>
          Manage your account and privacy preferences
        </p>

        <div className='space-y-6'>
          {/* Profile Settings */}
          <Card className='p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <IconUser className='h-5 w-5 text-primary' />
              </div>
              <h2 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>Profile</h2>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 font-poppins'>
                  Username
                </label>
                <div className='flex gap-3'>
                  <input
                    type='text'
                    value='@yourname'
                    readOnly
                    className='flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-100 font-poppins'
                  />
                  <Button variant='outline' className='font-poppins'>
                    Change
                  </Button>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 font-poppins'>
                  Email
                </label>
                <div className='flex gap-3'>
                  <input
                    type='email'
                    value='your.email@example.com'
                    readOnly
                    className='flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-100 font-poppins'
                  />
                  <Button variant='outline' className='font-poppins'>
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className='p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <IconLock className='h-5 w-5 text-primary' />
              </div>
              <h2 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>Security</h2>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <IconShield className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                      Two-Factor Authentication
                    </p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                      Add an extra layer of security
                    </p>
                  </div>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <IconDevices className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                      Connected Devices
                    </p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                      Manage your connected devices
                    </p>
                  </div>
                </div>
                <Button variant='outline' size='sm' className='font-poppins'>
                  View
                </Button>
              </div>

              <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <IconLock className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                      Change Password
                    </p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                      Update your password regularly
                    </p>
                  </div>
                </div>
                <Button variant='outline' size='sm' className='font-poppins'>
                  Change
                </Button>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className='p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <IconBell className='h-5 w-5 text-primary' />
              </div>
              <h2 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>Preferences</h2>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <IconBell className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                      Push Notifications
                    </p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                      Get notified about transactions
                    </p>
                  </div>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className='sr-only peer'
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <IconMoon className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>Dark Mode</p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                      Currently enabled
                    </p>
                  </div>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input type='checkbox' checked={darkMode} readOnly className='sr-only peer' />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <IconLanguage className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>Language</p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>English (US)</p>
                  </div>
                </div>
                <Button variant='outline' size='sm' className='font-poppins'>
                  Change
                </Button>
              </div>

              <div className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <IconPlayerPlay className='h-5 w-5 text-neutral-600 dark:text-neutral-400' />
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>App Tour</p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                      Replay the onboarding guide
                    </p>
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='font-poppins'
                  onClick={() => {
                    resetOnboardingTour();
                    window.location.reload();
                  }}>
                  Replay
                </Button>
              </div>
            </div>
          </Card>

          {/* Privacy */}
          <Card className='p-6'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <IconShield className='h-5 w-5 text-primary' />
              </div>
              <h2 className='text-xl font-bold text-neutral-800 dark:text-neutral-100 font-grotesk'>Privacy</h2>
            </div>

            <div className='space-y-3'>
              <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                Your privacy is our priority. All transactions use stealth addresses and zero-knowledge proofs by
                default.
              </p>
              <div className='flex gap-3'>
                <Button variant='outline' className='font-poppins'>
                  Export Data
                </Button>
                <Button variant='outline' className='text-red-600 hover:text-red-700 font-poppins'>
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
