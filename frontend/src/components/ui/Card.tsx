'use client';

import { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
  trend?: { value: number; label: string };
}

export function Card({ title, value, subtitle, icon, color = '#3b82f6', trend }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      {icon && (
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="mt-0.5 text-sm text-gray-400">{subtitle}</p>}
        {trend && (
          <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
