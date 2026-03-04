'use client';

import { useState, useEffect } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/store/settingsStore';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: reuse existing client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function BrandColorInjector() {
  const { settings } = useSettingsStore();
  useEffect(() => {
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    }
  }, [settings?.primaryColor]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandColorInjector />
      {children}
    </QueryClientProvider>
  );
}
