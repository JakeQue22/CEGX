'use client';

import Link from 'next/link';
import { MarketingLead } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface LeadCardProps {
  lead: MarketingLead;
}

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  RESPONDED: 'success',
  QUALIFIED: 'success',
  CONVERTED: 'neutral',
};

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <Link href={`/marketing/leads/${lead.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group border-l-4 border-l-purple-400">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {lead.companyName}
          </h4>
          <Badge label={lead.status} variant={statusVariant[lead.status] ?? 'neutral'} />
        </div>

        {lead.contactName && (
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {lead.contactName}
          </p>
        )}

        {lead.industry && (
          <p className="text-xs text-gray-400 mb-2">{lead.industry}</p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
            LEAD
          </span>
          <span>{lead._count?.outreachEmails ?? 0} emails</span>
        </div>
      </div>
    </Link>
  );
}
