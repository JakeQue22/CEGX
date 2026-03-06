'use client';

import { useState, useEffect } from 'react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
