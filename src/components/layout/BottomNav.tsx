'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeOutlined,
  HomeFilled,
  CalendarOutlined,
  CalendarFilled,
  HeartOutlined,
  HeartFilled,
  UserOutlined,
} from '@ant-design/icons';

export interface BottomNavProps {
  className?: string;
  onOpenNovena?: () => void;
  onOpenProfile?: () => void;
}

export function BottomNav({
  className = '',
  onOpenNovena,
  onOpenProfile,
}: BottomNavProps) {
  const pathname = usePathname();

  const handleNovenaClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      if (onOpenNovena) {
        onOpenNovena();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('sn-open-novena', { detail: { day: 3 } })
        );
      }
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      if (onOpenProfile) {
        onOpenProfile();
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sn-open-honor-ribbons'));
      }
    }
  };

  const isFeedActive = pathname === '/';
  const isEventsActive = pathname.startsWith('/events');
  const isNovenaActive = pathname.startsWith('/prayers/novena');
  const isProfileActive = pathname.startsWith('/profile');

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EFEAE2] px-4 py-2 flex justify-around items-center text-xs font-semibold shadow-lg pb-safe ${className}`}
      aria-label="Mobile Bottom Navigation"
    >
      {/* 1. Feed */}
      <Link
        href="/"
        className={`flex flex-col items-center no-underline transition-colors ${
          isFeedActive ? 'text-red-800 font-bold' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        {isFeedActive ? (
          <HomeFilled className="text-xl" />
        ) : (
          <HomeOutlined className="text-xl" />
        )}
        <span className="text-[10px] mt-0.5 font-cinzel tracking-wider">Feed</span>
      </Link>

      {/* 2. Events */}
      <Link
        href="/events"
        className={`flex flex-col items-center no-underline transition-colors ${
          isEventsActive ? 'text-red-800 font-bold' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        {isEventsActive ? (
          <CalendarFilled className="text-xl" />
        ) : (
          <CalendarOutlined className="text-xl" />
        )}
        <span className="text-[10px] mt-0.5 font-cinzel tracking-wider">Events</span>
      </Link>

      {/* 3. Novena */}
      <Link
        href="/prayers/novena"
        onClick={handleNovenaClick}
        className={`flex flex-col items-center no-underline transition-colors ${
          isNovenaActive ? 'text-red-800 font-bold' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        {isNovenaActive ? (
          <HeartFilled className="text-xl text-red-700" />
        ) : (
          <HeartOutlined className="text-xl" />
        )}
        <span className="text-[10px] mt-0.5 font-cinzel tracking-wider">Novena</span>
      </Link>

      {/* 4. Profile */}
      <Link
        href="/profile"
        onClick={handleProfileClick}
        className={`flex flex-col items-center no-underline transition-colors ${
          isProfileActive ? 'text-red-800 font-bold' : 'text-stone-500 hover:text-stone-900'
        }`}
      >
        <UserOutlined className="text-xl" />
        <span className="text-[10px] mt-0.5 font-cinzel tracking-wider">Profile</span>
      </Link>
    </nav>
  );
}

export default BottomNav;
