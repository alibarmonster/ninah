'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Validation } from '@/lib/username/validation';
import { isUsernameAvailable } from '@/lib/contracts/NinjaRupiah';
import { IconCheck, IconX, IconLoader2 } from '@tabler/icons-react';

export type UsernameStatus = 'idle' | 'typing' | 'validating' | 'available' | 'taken' | 'invalid';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onStatusChange?: (status: UsernameStatus) => void;
  disabled?: boolean;
  className?: string;
}

export default function UsernameInput({
  value,
  onChange,
  onStatusChange,
  disabled = false,
  className = '',
}: UsernameInputProps) {
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Update status callback
  const updateStatus = useCallback(
    (newStatus: UsernameStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange],
  );

  // Debounce the value for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Validate and check availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!debouncedValue || debouncedValue.length === 0) {
        updateStatus('idle');
        setError(null);
        return;
      }

      // First validate format
      const validation = Validation.validateUsername(debouncedValue);
      if (!validation.valid) {
        updateStatus('invalid');
        setError(validation.error || 'Invalid username');
        return;
      }

      // Then check availability
      updateStatus('validating');
      setError(null);

      try {
        const available = await isUsernameAvailable(debouncedValue);
        if (available) {
          updateStatus('available');
          setError(null);
        } else {
          updateStatus('taken');
          setError('Username is already taken');
        }
      } catch (err) {
        updateStatus('invalid');
        setError('Failed to check availability');
      }
    };

    checkAvailability();
  }, [debouncedValue, updateStatus]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9.\-_]/g, '');
    onChange(newValue);
    if (newValue !== value) {
      updateStatus('typing');
    }
  };

  // Get status icon
  const renderStatusIcon = () => {
    switch (status) {
      case 'available':
        return <IconCheck className='w-5 h-5 text-green-500' />;
      case 'taken':
      case 'invalid':
        return <IconX className='w-5 h-5 text-red-500' />;
      case 'validating':
        return <IconLoader2 className='w-5 h-5 text-yellow-500 animate-spin' />;
      default:
        return null;
    }
  };

  // Get border color
  const getBorderColor = () => {
    switch (status) {
      case 'available':
        return 'border-green-500 focus:border-green-500';
      case 'taken':
      case 'invalid':
        return 'border-red-500 focus:border-red-500';
      case 'validating':
        return 'border-yellow-500 focus:border-yellow-500';
      default:
        return 'border-input focus:border-primary';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className='relative'>
        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium'>@</span>
        <input
          type='text'
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder='username'
          maxLength={32}
          className={`w-full pl-8 pr-10 py-3 rounded-lg bg-background border-2 ${getBorderColor()} outline-none transition-colors font-poppins text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        <div className='absolute right-3 top-1/2 -translate-y-1/2'>{renderStatusIcon()}</div>
      </div>

      {/* Error/Status Message */}
      <div className='mt-2 h-5'>
        {error && <p className='text-sm text-red-500 font-poppins'>{error}</p>}
        {status === 'available' && <p className='text-sm text-green-500 font-poppins'>Username is available!</p>}
      </div>

      {/* Character count */}
      <div className='flex justify-end'>
        <span className='text-xs text-muted-foreground'>{value.length}/32</span>
      </div>
    </div>
  );
}
