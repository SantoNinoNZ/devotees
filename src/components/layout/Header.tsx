'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dropdown, type MenuProps } from 'antd';
import {
  BellOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';

export interface HeaderProps {
  onOpenComposer?: (mode?: 'prayer' | 'general' | 'video' | 'photo') => void;
  onOpenProfileModal?: () => void;
  onSearch?: (query: string) => void;
  className?: string;
}

export function Header({
  onOpenComposer,
  onOpenProfileModal,
  onSearch,
  className = '',
}: HeaderProps) {
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const displayName =
    profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Devotee';

  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'SN';

  const handleAskForPrayers = () => {
    if (onOpenComposer) {
      onOpenComposer('prayer');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sn-open-post-composer', {
          detail: { mode: 'prayer' },
        })
      );
    }
  };

  const handleOpenHonorRibbons = () => {
    if (onOpenProfileModal) {
      onOpenProfileModal();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sn-open-honor-ribbons'));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sn-global-search', { detail: { query: value } })
      );
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'badges',
      icon: <TrophyOutlined className="text-amber-600" />,
      label: (
        <span className="font-semibold text-stone-800">
          Faith & Festival Badges
        </span>
      ),
      onClick: handleOpenHonorRibbons,
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">My Profile</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/profile/edit">Settings</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined className="text-red-600" />,
      label: <span className="text-red-600 font-medium">Sign Out</span>,
      onClick: signOut,
    },
  ];

  return (
    <header
      className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFEAE2] shadow-sm ${className}`}
      style={{ height: 64 }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-800/30 border border-amber-300/50 flex items-center justify-center shadow-sm ring-1 ring-amber-200 overflow-hidden p-0.5">
              <Image
                src="/santonino-statue.png"
                alt="Señor Santo Niño"
                width={36}
                height={36}
                className="object-contain h-full w-auto drop-shadow"
                priority
              />
            </div>
            <div>
              <div className="font-cinzel font-bold text-base sm:text-lg text-red-900 tracking-wider leading-none">
                Santo Niño NZ
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-600 mt-0.5">
                Devotees Community
              </div>
            </div>
          </Link>
        </div>

        {/* Center Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <SearchOutlined className="absolute left-3.5 top-3 text-stone-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search prayers, novenas, dance practices, devotees..."
              className="w-full bg-[#F5F2EC] hover:bg-[#EFEAE2] focus:bg-white rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-red-700 transition"
            />
          </div>
        </div>

        {/* Right User & Quick Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Ask for Prayers Button */}
          <button
            type="button"
            onClick={handleAskForPrayers}
            className="bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold px-3.5 py-2 rounded-full border border-red-200 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <span className="text-red-700">🙏</span>
            <span className="hidden sm:inline">Ask for Prayers</span>
            <span className="sm:hidden">Prayer</span>
          </button>

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="w-10 h-10 rounded-full bg-[#F5F2EC] hover:bg-stone-200 text-stone-700 flex items-center justify-center relative transition no-underline"
            title="Notifications"
          >
            <BellOutlined className="text-base text-stone-700" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-700 rounded-full ring-2 ring-white" />
          </Link>

          {/* User Avatar with Discord-style status dot */}
          {isAuthenticated ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <button
                type="button"
                className="flex items-center pl-1 cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                aria-label="User profile menu"
              >
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-800 to-red-900 text-white font-bold flex items-center justify-center text-sm ring-2 ring-amber-400 shadow-sm font-cinzel">
                      {userInitials}
                    </div>
                  )}
                  {/* Discord-style active status indicator */}
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"
                    title="Active Community Servant"
                  />
                </div>
              </button>
            </Dropdown>
          ) : (
            <Link
              href="/login"
              className="bg-red-800 hover:bg-red-900 text-white text-xs font-bold px-4 py-2 rounded-full transition shadow-sm no-underline"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
