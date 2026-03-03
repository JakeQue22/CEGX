'use client';

interface GBPAmountProps {
  amount: number;
  className?: string;
  showSign?: boolean;
}

export function GBPAmount({ amount, className = '', showSign = false }: GBPAmountProps) {
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const isNegative = amount < 0;
  const sign = showSign && amount > 0 ? '+' : '';

  return (
    <span className={`font-mono ${isNegative ? 'text-red-600' : ''} ${className}`}>
      {isNegative ? '-' : sign}
      {formatted}
    </span>
  );
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
