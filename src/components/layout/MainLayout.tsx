'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Spin } from 'antd';
import { useMobile } from '@/hooks/useMobile';
import { useAuth } from '@/hooks/useAuth';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const { Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useMobile();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Header />
      <Layout>
        {!isMobile && <Sidebar />}
        <Content
          className={`
            p-4
            ${isMobile ? 'pb-20' : 'ml-[200px]'}
            mt-[64px]
            min-h-[calc(100vh-64px)]
            bg-gray-50
          `}
        >
          <div className="max-w-5xl mx-auto">{children}</div>
        </Content>
      </Layout>
      {isMobile && <BottomNav />}
    </Layout>
  );
}
