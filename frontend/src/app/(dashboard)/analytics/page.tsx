'use client';

import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GBPAmount, formatGBP } from '@/components/ui/GBPAmount';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  revenueOverTime: { month: string; revenue: number }[];
  profitOverTime: { month: string; profit: number }[];
  adSpendOverTime: { month: string; adSpend: number }[];
  marginBySupplier: { supplier: string; margin: number }[];
  marginByProduct: { product: string; margin: number }[];
  vatLiabilityTotal: number;
  vatLiabilityByMonth: { month: string; vat: number }[];
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: () => axiosInstance.get('/analytics').then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <div className="text-red-600 p-4">Failed to load analytics.</div>;

  const {
    revenueOverTime = [],
    profitOverTime = [],
    adSpendOverTime = [],
    marginBySupplier = [],
    marginByProduct = [],
    vatLiabilityTotal = 0,
    vatLiabilityByMonth = [],
  } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">All amounts in GBP (£)</p>
      </div>

      {/* VAT Liability Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-6 flex items-center gap-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total VAT Liability (All Time)</p>
          <GBPAmount amount={vatLiabilityTotal} className="text-3xl font-bold text-purple-700" />
        </div>
      </div>

      {/* Revenue & Profit over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Over Time">
          {revenueOverTime.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatGBP(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Profit Over Time">
          {profitOverTime.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={profitOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatGBP(v), 'Profit']} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Ad Spend & VAT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Ad Spend Over Time">
          {adSpendOverTime.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adSpendOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatGBP(v), 'Ad Spend']} />
                <Bar dataKey="adSpend" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="VAT Liability by Month">
          {vatLiabilityByMonth.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vatLiabilityByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatGBP(v), 'VAT']} />
                <Bar dataKey="vat" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Margin by Supplier & Product */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Margin by Supplier (%)">
          {marginBySupplier.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, marginBySupplier.length * 40)}>
              <BarChart data={marginBySupplier} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <YAxis type="category" dataKey="supplier" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Margin']} />
                <Bar dataKey="margin" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Margin by Product (%)">
          {marginByProduct.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, marginByProduct.length * 40)}>
              <BarChart data={marginByProduct} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                <YAxis type="category" dataKey="product" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Margin']} />
                <Bar dataKey="margin" fill="#ec4899" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
