'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconWallet,
  IconArrowsExchange,
  IconDownload,
  IconTrendingUp,
  IconSend,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useWalletBalance, useStealthPayments } from '@/hooks';

// localStorage key for stats history
const STATS_HISTORY_KEY = 'ninah_stats_history';

interface StatsSnapshot {
  balance: string;
  totalReceived: string;
  totalSent: string;
  totalTransactions: number;
  timestamp: number;
}

// Calculate percentage change between two values
function calculatePercentageChange(current: string, previous: string): { change: string; type: 'positive' | 'negative' | 'neutral' } {
  const currentNum = parseFloat(current) || 0;
  const previousNum = parseFloat(previous) || 0;

  if (previousNum === 0) {
    if (currentNum > 0) return { change: 'New', type: 'positive' };
    return { change: '-', type: 'neutral' };
  }

  const percentChange = ((currentNum - previousNum) / previousNum) * 100;

  if (percentChange === 0) return { change: '0%', type: 'neutral' };
  if (percentChange > 0) return { change: `+${percentChange.toFixed(1)}%`, type: 'positive' };
  return { change: `${percentChange.toFixed(1)}%`, type: 'negative' };
}

export default function DashboardPage() {
  const { client: smartWalletClient } = useSmartWallets();

  // Use smart wallet address instead of embedded wallet
  const walletAddress = (smartWalletClient?.account?.address as `0x${string}`) || undefined;

  // Fetch wallet balance and stealth payments
  const { balance, loading: balanceLoading, error: balanceError } = useWalletBalance(walletAddress);
  const { transactions, loading: paymentsLoading, error: paymentsError, stats } = useStealthPayments(walletAddress);

  // State for previous stats (for percentage calculation)
  const [previousStats, setPreviousStats] = useState<StatsSnapshot | null>(null);

  // Load previous stats from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STATS_HISTORY_KEY);
      if (stored) {
        setPreviousStats(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load stats history:', e);
    }
  }, []);

  // Save current stats to localStorage when data loads (once per session)
  const saveStatsSnapshot = useCallback(() => {
    if (balanceLoading || paymentsLoading || !balance) return;

    const currentSnapshot: StatsSnapshot = {
      balance: balance || '0',
      totalReceived: stats.totalReceived,
      totalSent: stats.totalSent,
      totalTransactions: stats.totalTransactions,
      timestamp: Date.now(),
    };

    // Only save if we have previous stats or this is first time
    // Save snapshot for next session comparison (24 hour minimum gap)
    const shouldSave = !previousStats || (Date.now() - previousStats.timestamp > 24 * 60 * 60 * 1000);

    if (shouldSave) {
      try {
        localStorage.setItem(STATS_HISTORY_KEY, JSON.stringify(currentSnapshot));
      } catch (e) {
        console.warn('Failed to save stats history:', e);
      }
    }
  }, [balance, balanceLoading, paymentsLoading, stats, previousStats]);

  useEffect(() => {
    saveStatsSnapshot();
  }, [saveStatsSnapshot]);

  // Format balance for display
  const formatIDRBalance = (balance: string | null) => {
    if (!balance) return 'Rp 0';
    const num = parseFloat(balance);
    return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate actual percentage changes from previous stats
  const balanceChange = calculatePercentageChange(balance || '0', previousStats?.balance || '0');
  const receivedChange = calculatePercentageChange(stats.totalReceived, previousStats?.totalReceived || '0');
  const sentChange = calculatePercentageChange(stats.totalSent, previousStats?.totalSent || '0');
  const txCountChange = stats.totalTransactions - (previousStats?.totalTransactions || 0);

  const statsData = [
    {
      title: 'Total Balance',
      value: formatIDRBalance(balance),
      icon: IconWallet,
      change: balanceChange.change,
      changeType: balanceChange.type,
      loading: balanceLoading,
    },
    {
      title: 'Total Received',
      value: formatIDRBalance(stats.totalReceived),
      icon: IconDownload,
      change: receivedChange.change,
      changeType: receivedChange.type,
      loading: paymentsLoading,
    },
    {
      title: 'Total Sent',
      value: formatIDRBalance(stats.totalSent),
      icon: IconSend,
      change: sentChange.change,
      changeType: sentChange.type,
      loading: paymentsLoading,
    },
    {
      title: 'Total Payments',
      value: stats.totalTransactions.toString(),
      icon: IconTrendingUp,
      change: txCountChange > 0 ? `+${txCountChange} new` : txCountChange === 0 ? '-' : `${txCountChange}`,
      changeType: txCountChange > 0 ? 'positive' : txCountChange === 0 ? 'neutral' : 'negative',
      loading: paymentsLoading,
    },
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  // Get paginated transactions
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className='flex flex-1 flex-col'>
      <div className='p-4 md:p-10'>
        <h1 className='text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>Dashboard</h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-8 font-poppins'>
          Welcome back! Here&apos;s an overview of your private payments.
        </p>

        {/* Error States */}
        {balanceError && (
          <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <p className='text-red-600 dark:text-red-400 font-poppins'>Error loading balance: {balanceError.message}</p>
          </div>
        )}
        {paymentsError && (
          <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <p className='text-red-600 dark:text-red-400 font-poppins'>
              Error loading transactions: {paymentsError.message}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className='p-6 hover:shadow-lg transition-shadow duration-300'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <p className='text-sm text-neutral-600 dark:text-neutral-400 mb-1 font-poppins'>{stat.title}</p>
                    {stat.loading ? (
                      <div className='h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-2' />
                    ) : (
                      <h3 className='text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 font-grotesk'>
                        {stat.value}
                      </h3>
                    )}
                    <p
                      className={`text-sm font-medium font-poppins ${
                        stat.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : stat.changeType === 'neutral'
                            ? 'text-neutral-600 dark:text-neutral-400'
                            : 'text-red-600 dark:text-red-400'
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

        {/* Payment History */}
        <Card className='p-6'>
          <h2 className='text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6 font-grotesk'>
            Payment History
          </h2>

          {paymentsLoading ? (
            <div className='space-y-4'>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className='h-16 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg animate-pulse' />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className='text-center py-12'>
              <IconArrowsExchange className='h-12 w-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4' />
              <p className='text-neutral-600 dark:text-neutral-400 font-poppins'>
                No stealth payments found. Go to Receive page to scan for incoming payments.
              </p>
            </div>
          ) : (
            <>
              <div className='space-y-4'>
                {paginatedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className='flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'>
                    <div className='flex items-center gap-4'>
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === 'sent'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                        {transaction.type === 'sent' ? (
                          <IconSend className='h-5 w-5 text-red-600 dark:text-red-400' />
                        ) : (
                          <IconDownload className='h-5 w-5 text-green-600 dark:text-green-400' />
                        )}
                      </div>
                      <div>
                        <p className='font-medium text-neutral-800 dark:text-neutral-100 font-poppins'>
                          {transaction.type === 'sent' ? 'Sent to someone' : 'Received from someone'}
                        </p>
                        <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                          {formatRelativeTime(transaction.timestamp)} • Stealth:{' '}
                          {truncateAddress(transaction.stealthAddress)}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p
                        className={`font-bold font-grotesk ${
                          transaction.type === 'sent'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                        {transaction.type === 'sent' ? '- ' : '+ '}
                        {formatIDRBalance(transaction.amount)}
                      </p>
                      <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins capitalize'>
                        {transaction.type === 'sent'
                          ? 'Sent'
                          : transaction.status === 'claimed'
                            ? 'Claimed'
                            : 'Ready to Claim'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className='flex items-center justify-between mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700'>
                  <p className='text-sm text-neutral-600 dark:text-neutral-400 font-poppins'>
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className='font-poppins'>
                      <IconChevronLeft className='h-4 w-4 mr-1' />
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className='font-poppins'>
                      Next
                      <IconChevronRight className='h-4 w-4 ml-1' />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
