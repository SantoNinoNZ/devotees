'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, Button, Typography, Space, Divider } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signInWithGoogle, user } = useAuth();

  console.log('LoginPage - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.email);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('LoginPage - Redirecting to home');
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-800/30 border border-amber-300/60 flex items-center justify-center p-2 shadow-sm ring-2 ring-amber-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/devotees/santonino-statue.png"
              alt="Señor Santo Niño"
              className="w-14 h-14 object-contain drop-shadow"
            />
          </div>
          <Title level={2} className="mb-2">
            Santo Niño NZ
          </Title>
          <Text type="secondary">Devotees Community App</Text>
        </div>

        <Space direction="vertical" size="large" className="w-full">
          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleGoogleSignIn}
            block
            className="h-12"
          >
            Continue with Google
          </Button>

          <Divider plain>
            <Text type="secondary" className="text-xs">
              First time? Sign in to create your account
            </Text>
          </Divider>

          <div className="text-center">
            <Text type="secondary" className="text-xs">
              By signing in, you agree to our community guidelines and privacy
              policy.
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
