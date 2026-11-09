'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Spin size="large" />
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Spin size="large" />
      </div>
    );
  }

  const isFeedHome = pathname === '/';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans">
      <Header />

      {isFeedHome ? (
        <div className="flex-1 w-full">
          {children}
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-6 py-5 flex gap-6">
          <aside className="hidden md:block w-64 lg:w-72 shrink-0">
            <Sidebar />
          </aside>
          <main className="flex-1 min-w-0 pb-24 md:pb-8">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default MainLayout;
