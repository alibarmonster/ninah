import { useState, useEffect, useCallback } from 'react';
import { getBalance, getDecimals } from '@/lib/contracts/MockIDRX';
import { formatUnits } from 'viem';

interface WalletBalanceState {
  balance: string | null;
  rawBalance: bigint | null;
  loading: boolean;
  error: Error | null;
}

interface WalletBalanceResult extends WalletBalanceState {
  refetch: () => void;
}

/**
 * Custom hook to fetch and monitor user's IDRX token balance
 * @param address - User's wallet address
 * @param refreshInterval - How often to refresh balance in milliseconds (default: 30000ms = 30s)
 * @returns Object containing balance, loading state, error state, and refetch function
 */
export function useWalletBalance(address: `0x${string}` | undefined, refreshInterval: number = 30000): WalletBalanceResult {
  const [state, setState] = useState<WalletBalanceState>({
    balance: null,
    rawBalance: null,
    loading: true,
    error: null,
  });
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!address) {
      setState({
        balance: null,
        rawBalance: null,
        loading: false,
        error: null,
      });
      return;
    }

    let isMounted = true;

    const fetchBalance = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true }));

        const [balanceWei, decimals] = await Promise.all([getBalance(address), getDecimals()]);

        if (!isMounted) return;

        // Convert from wei to human-readable format
        const formattedBalance = formatUnits(balanceWei, decimals);

        setState({
          balance: formattedBalance,
          rawBalance: balanceWei,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (!isMounted) return;

        console.error('Error fetching wallet balance:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch balance'),
        }));
      }
    };

    // Initial fetch
    fetchBalance();

    // Set up periodic refresh
    const intervalId = setInterval(fetchBalance, refreshInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [address, refreshInterval, refetchTrigger]);

  return { ...state, refetch };
}
