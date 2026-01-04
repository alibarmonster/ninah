'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { IconWallet, IconArrowsExchange, IconDownload, IconTrendingUp } from '@tabler/icons-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Balance',
      value: 'Rp 10,500,000',
      icon: IconWallet,
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Sent This Month',
      value: 'Rp 2,340,000',
      icon: IconArrowsExchange,
      change: '+8.2%',
      changeType: 'positive' as const,
    },
    {
      title: 'Received This Month',
      value: 'Rp 4,120,000',
      icon: IconDownload,
      change: '+15.3%',
      changeType: 'positive' as const,
    },
    {
      title: 'Total Transactions',
      value: '156',
      icon: IconTrendingUp,
      change: '+23',
      changeType: 'positive' as const,
    },
  ];

  const recentTransactions = [
    {
      id: 1,
      type: 'received',
      from: '@alice',
      amount: 'Rp 500,000',
      date: '2 hours ago',
      status: 'completed',
    },
    {
      id: 2,
      type: 'sent',
      to: '@bob',
      amount: 'Rp 250,000',
      date: '5 hours ago',
      status: 'completed',
    },
    {
      id: 3,
      type: 'received',
      from: '@charlie',
      amount: 'Rp 1,200,000',
      date: '1 day ago',
      status: 'completed',
    },
    {
      id: 4,
      type: 'sent',
      to: '@dana',
      amount: 'Rp 750,000',
      date: '2 days ago',
      status: 'completed',
    },
  ];

  return (
    <div className='flex flex-1 flex-col'>
      <div className='p-4 md:p-10'>
        <h1 className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>Dashboard</h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-8 font-poppins'>
          Welcome back! Here&apos;s an overview of your private payments.
        </p>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className='p-6 hover:shadow-lg transition-shadow duration-300'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-poppins'>{stat.title}</p>
                    <h3 className='text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>
                      {stat.value}
                    </h3>
                    <p
                      className={`text-sm font-medium font-poppins ${
                        stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className='p-3 bg-primary/10 rounded-lg'>
                    <IconComponent className='h-6 w-6 text-primary' />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <Card className='p-6'>
          <h2 className='text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 font-grotesk'>
            Recent Transactions
          </h2>
          <div className='space-y-4'>
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'>
                <div className='flex items-center gap-4'>
                  <div
                    className={`p-2 rounded-full ${
                      transaction.type === 'received'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                    {transaction.type === 'received' ? (
                      <IconDownload
                        className={`h-5 w-5 ${
                          transaction.type === 'received' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                        }`}
                      />
                    ) : (
                      <IconArrowsExchange
                        className={`h-5 w-5 ${
                          transaction.type === 'received' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                      {transaction.type === 'received' ? 'Received from' : 'Sent to'}{' '}
                      {transaction.type === 'received' ? transaction.from : transaction.to}
                    </p>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>{transaction.date}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p
                    className={`font-bold font-grotesk ${
                      transaction.type === 'received'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-neutral-800 dark:text-neutral-100'
                    }`}>
                    {transaction.type === 'received' ? '+' : '-'} {transaction.amount}
                  </p>
                  <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins capitalize'>
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
