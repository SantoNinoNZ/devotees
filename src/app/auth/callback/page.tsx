'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment from the URL (contains OAuth tokens)
        const hash = window.location.hash;

        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            setStatus('Setting session...');

            // Manually set the session since detectSessionInUrl is disabled
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
              setStatus('Error: ' + error.message);
              setTimeout(() => router.push('/login'), 2000);
              return;
            }

            if (data.session) {
              setStatus('Signed in! Redirecting...');
              window.history.replaceState(null, '', window.location.pathname);
              setTimeout(() => router.push('/'), 500);
              return;
            }
          }
        }

        // No hash or tokens - check existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('Session found! Redirecting...');
          setTimeout(() => router.push('/'), 500);
        } else {
          setStatus('No session. Redirecting to login...');
          setTimeout(() => router.push('/login'), 1000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('Error processing login');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Spin size="large" />
      <p className="mt-4 text-gray-500">{status}</p>
    </div>
  );
}
