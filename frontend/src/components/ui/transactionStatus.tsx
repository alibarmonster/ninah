'use client';

import React, { useState, useEffect } from 'react';
import { IconCheck, IconX, IconCopy, IconExternalLink } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface TransactionStatusProps {
  variant: 'success' | 'error';
  title?: string;
  message?: string;
  txHash?: string;
  explorerUrl?: string;
  details?: { label: string; value: string }[];
  className?: string;
  onDismiss?: () => void;
}

export function TransactionStatus({
  variant,
  title,
  message,
  txHash,
  explorerUrl,
  details,
  className,
  onDismiss,
}: TransactionStatusProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyTxHash = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateHash = (hash: string) => {
    if (hash.length <= 20) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const defaultTitles = {
    success: 'Transaction Complete',
    error: 'Transaction Failed',
  };

  const displayTitle = title || defaultTitles[variant];

  // Generate explorer URL if not provided but txHash exists
  const finalExplorerUrl = explorerUrl || (txHash ? `https://sepolia.basescan.org/tx/${txHash}` : undefined);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border backdrop-blur-sm',
        'transition-all duration-500 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        variant === 'success' && [
          'bg-gradient-to-br from-emerald-950/90 via-neutral-900/95 to-neutral-900/90',
          'border-emerald-500/30',
          'shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]',
        ],
        variant === 'error' && [
          'bg-gradient-to-br from-rose-950/90 via-neutral-900/95 to-neutral-900/90',
          'border-rose-500/30',
          'shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)]',
        ],
        className
      )}>
      {/* Animated scan line effect */}
      <div
        className={cn(
          'absolute inset-0 opacity-[0.03]',
          'bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]'
        )}
      />

      {/* Glow pulse at top */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-px',
          variant === 'success' && 'bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent',
          variant === 'error' && 'bg-gradient-to-r from-transparent via-rose-400/60 to-transparent'
        )}
      />

      <div className='relative p-5'>
        {/* Header */}
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            {/* Status icon with glow */}
            <div
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full',
                variant === 'success' && 'bg-emerald-500/20',
                variant === 'error' && 'bg-rose-500/20'
              )}>
              {/* Pulse ring */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full animate-ping opacity-30',
                  variant === 'success' && 'bg-emerald-500/40',
                  variant === 'error' && 'bg-rose-500/40'
                )}
                style={{ animationDuration: '2s' }}
              />
              {variant === 'success' ? (
                <IconCheck className='h-5 w-5 text-emerald-400' strokeWidth={2.5} />
              ) : (
                <IconX className='h-5 w-5 text-rose-400' strokeWidth={2.5} />
              )}
            </div>

            <div>
              <h4
                className={cn(
                  'font-grotesk text-base font-semibold tracking-tight',
                  variant === 'success' && 'text-emerald-100',
                  variant === 'error' && 'text-rose-100'
                )}>
                {displayTitle}
              </h4>
              {message && (
                <p className='mt-0.5 font-poppins text-sm text-neutral-400'>{message}</p>
              )}
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className='rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300'>
              <IconX className='h-4 w-4' />
            </button>
          )}
        </div>

        {/* Transaction details */}
        {details && details.length > 0 && (
          <div className='mt-4 space-y-2'>
            {details.map((detail, index) => (
              <div key={index} className='flex items-center justify-between'>
                <span className='font-poppins text-xs text-neutral-500'>{detail.label}</span>
                <span className='font-poppins text-sm text-neutral-200'>{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Transaction hash */}
        {txHash && (
          <div
            className={cn(
              'mt-4 rounded-md border p-3',
              'bg-black/30 border-neutral-800/50'
            )}>
            <div className='flex items-center justify-between gap-2'>
              <div className='min-w-0 flex-1'>
                <p className='mb-1 font-poppins text-[10px] uppercase tracking-wider text-neutral-500'>
                  Transaction Hash
                </p>
                <p className='truncate font-mono text-xs text-neutral-300'>{truncateHash(txHash)}</p>
              </div>

              <div className='flex items-center gap-1'>
                <button
                  onClick={copyTxHash}
                  className={cn(
                    'rounded-md p-2 transition-all duration-200',
                    'hover:bg-neutral-800/80',
                    copied
                      ? 'text-emerald-400'
                      : 'text-neutral-500 hover:text-neutral-300'
                  )}
                  title={copied ? 'Copied!' : 'Copy hash'}>
                  {copied ? (
                    <IconCheck className='h-4 w-4' />
                  ) : (
                    <IconCopy className='h-4 w-4' />
                  )}
                </button>

                {finalExplorerUrl && (
                  <a
                    href={finalExplorerUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={cn(
                      'rounded-md p-2 transition-all duration-200',
                      'text-neutral-500 hover:bg-neutral-800/80 hover:text-neutral-300'
                    )}
                    title='View on explorer'>
                    <IconExternalLink className='h-4 w-4' />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-px',
          variant === 'success' && 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent',
          variant === 'error' && 'bg-gradient-to-r from-transparent via-rose-500/30 to-transparent'
        )}
      />
    </div>
  );
}

// Compact inline version for claim success/error within cards
export function TransactionStatusInline({
  variant,
  message,
  txHash,
  explorerUrl,
  className,
}: {
  variant: 'success' | 'error';
  message: string;
  txHash?: string;
  explorerUrl?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyTxHash = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalExplorerUrl = explorerUrl || (txHash ? `https://sepolia.basescan.org/tx/${txHash}` : undefined);

  return (
    <div
      className={cn(
        'mt-3 overflow-hidden rounded-lg border backdrop-blur-sm',
        variant === 'success' && [
          'bg-gradient-to-r from-emerald-950/80 to-neutral-900/80',
          'border-emerald-500/20',
        ],
        variant === 'error' && [
          'bg-gradient-to-r from-rose-950/80 to-neutral-900/80',
          'border-rose-500/20',
        ],
        className
      )}>
      <div className='p-3'>
        <div className='flex items-center gap-2'>
          {variant === 'success' ? (
            <IconCheck className='h-4 w-4 flex-shrink-0 text-emerald-400' />
          ) : (
            <IconX className='h-4 w-4 flex-shrink-0 text-rose-400' />
          )}
          <span
            className={cn(
              'font-poppins text-xs',
              variant === 'success' && 'text-emerald-200',
              variant === 'error' && 'text-rose-200'
            )}>
            {message}
          </span>
        </div>

        {txHash && (
          <div className='mt-2 flex items-center gap-2 pl-6'>
            <button
              onClick={copyTxHash}
              className={cn(
                'flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[10px] transition-all',
                'bg-black/30 hover:bg-black/50',
                copied ? 'text-emerald-400' : 'text-neutral-400 hover:text-neutral-200'
              )}>
              {copied ? <IconCheck className='h-3 w-3' /> : <IconCopy className='h-3 w-3' />}
              {copied ? 'Copied' : 'Copy Tx'}
            </button>

            {finalExplorerUrl && (
              <a
                href={finalExplorerUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-1 rounded px-2 py-1 font-poppins text-[10px] text-neutral-400 transition-all hover:bg-black/30 hover:text-neutral-200'>
                <IconExternalLink className='h-3 w-3' />
                View
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
