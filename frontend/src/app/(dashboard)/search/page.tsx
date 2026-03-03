'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import axiosInstance from '@/lib/axios';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

interface SearchResult {
  type: 'deal' | 'supplier' | 'product' | 'campaign';
  id: string;
  title: string;
  subtitle?: string;
}

const typeHref: Record<string, string> = {
  deal: '/deals',
  supplier: '/suppliers',
  product: '/products',
  campaign: '/campaigns',
};

const typeColors: Record<string, string> = {
  deal: 'bg-blue-100 text-blue-700',
  supplier: 'bg-green-100 text-green-700',
  product: 'bg-orange-100 text-orange-700',
  campaign: 'bg-purple-100 text-purple-700',
};

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const { data, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['search', q],
    queryFn: () => axiosInstance.get('/search', { params: { q } }).then((r) => r.data),
    enabled: q.length > 0,
  });

  const results = data ?? [];

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
        {q && (
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? 'Searching…' : `${results.length} result${results.length !== 1 ? 's' : ''} for `}
            {!isLoading && <strong>&quot;{q}&quot;</strong>}
          </p>
        )}
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && q && results.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No results found for <strong>&quot;{q}&quot;</strong></p>
          <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {results.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <Link
                  href={`${typeHref[r.type] ?? '/dashboard'}/${r.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
                >
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${typeColors[r.type] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {r.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchResults />
    </Suspense>
  );
}
