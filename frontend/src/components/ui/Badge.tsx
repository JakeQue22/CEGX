'use client';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
};

const statusVariantMap: Record<string, BadgeVariant> = {
  OPEN: 'info',
  WON: 'success',
  LOST: 'danger',
  DRAFT: 'neutral',
  SCHEDULED: 'warning',
  SENT: 'success',
  FAILED: 'danger',
  ADMIN: 'purple',
  SALES_MANAGER: 'info',
  PROCUREMENT_OFFICER: 'info',
  VIEWER: 'neutral',
};

export function Badge({ label, variant }: BadgeProps) {
  const v = variant ?? statusVariantMap[label] ?? 'neutral';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[v]}`}>
      {label.replace('_', ' ')}
    </span>
  );
}
