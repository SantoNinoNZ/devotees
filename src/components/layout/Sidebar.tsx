'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeFilled,
  CalendarFilled,
  HeartFilled,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, getActiveRoles } from '@/lib/permissions';

export interface SidebarProps {
  className?: string;
  onOpenNovena?: (day?: number) => void;
  onOpenProfile?: () => void;
  onBadgeClick?: (badgeName: string) => void;
}

export function Sidebar({
  className = '',
  onOpenNovena,
  onOpenProfile,
  onBadgeClick,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const userRoles = profile?.roles ? getActiveRoles(profile.roles) : [];
  const isAdmin = hasPermission(userRoles, 'admin:access');

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Elijah Mondero';

  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'EM';

  const userChapter = profile?.area?.name || (profile as any)?.chapter || 'North Shore Chapter';

  const handleOpenNovena = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenNovena) {
      onOpenNovena(3);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sn-open-novena', { detail: { day: 3 } })
      );
    }
  };

  const handleOpenProfileModal = () => {
    if (onOpenProfile) {
      onOpenProfile();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sn-open-honor-ribbons'));
    }
  };

  const handleBadgeClickInternal = (badgeName: string) => {
    if (onBadgeClick) {
      onBadgeClick(badgeName);
    }
    handleOpenProfileModal();
  };

  return (
    <aside className={`space-y-4 ${className}`}>
      {/* Devotee Quick Identity Card with Discord-Style Badge Flairs */}
      <div className="bg-white rounded-2xl p-4 border border-[#EFEAE2] shadow-sm hover:shadow-md transition">
        <div className="flex items-start space-x-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 flex-shrink-0 shadow"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-800 text-white font-bold flex items-center justify-center text-base ring-2 ring-amber-400 flex-shrink-0 shadow font-cinzel">
              {userInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-stone-900 truncate">
              {displayName}
            </div>
            <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
              <span>📍 {userChapter}</span>
            </div>
          </div>
        </div>

        {/* User's Badges Strip (Discord-Style Badges) */}
        <div className="mt-3.5 pt-3 border-t border-stone-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 flex justify-between items-center font-cinzel">
            <span>Faith & Festival Badges</span>
            <button
              type="button"
              onClick={handleOpenProfileModal}
              className="text-red-800 hover:underline cursor-pointer bg-transparent border-0 p-0 text-[11px] font-bold"
            >
              View All (4)
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleBadgeClickInternal('Sinulog Dancer 2024-2026')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:shadow-sm hover:-translate-y-0.5 transition cursor-pointer"
            >
              <span>💃</span>
              <span>Dancer &apos;24-&apos;26</span>
            </button>
            <button
              type="button"
              onClick={() => handleBadgeClickInternal('Official Media Guild')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 hover:shadow-sm hover:-translate-y-0.5 transition cursor-pointer"
            >
              <span>📸</span>
              <span>Photographer &apos;25</span>
            </button>
            <button
              type="button"
              onClick={() => handleBadgeClickInternal('9-Day Novena Completer')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:shadow-sm hover:-translate-y-0.5 transition cursor-pointer"
            >
              <span>📿</span>
              <span>Novena &apos;26</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Navigation Links */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#EFEAE2] shadow-sm space-y-1 text-sm font-semibold text-stone-700">
        <Link
          href="/"
          className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center space-x-3 transition no-underline ${
            pathname === '/'
              ? 'bg-red-50 text-red-900 font-bold'
              : 'hover:bg-stone-50 text-stone-700'
          }`}
        >
          <HomeFilled className={`w-5 text-base ${pathname === '/' ? 'text-red-700' : 'text-stone-400'}`} />
          <span>Community Feed</span>
        </Link>

        <Link
          href="/events"
          className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center space-x-3 transition no-underline ${
            pathname.startsWith('/events')
              ? 'bg-red-50 text-red-900 font-bold'
              : 'hover:bg-stone-50 text-stone-700'
          }`}
        >
          <CalendarFilled className={`w-5 text-base ${pathname.startsWith('/events') ? 'text-red-700' : 'text-amber-600'}`} />
          <span>Masses & Events</span>
        </Link>

        <button
          type="button"
          onClick={handleOpenNovena}
          className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-stone-50 flex items-center space-x-3 text-stone-700 transition cursor-pointer border-0 bg-transparent"
        >
          <HeartFilled className="w-5 text-base text-red-600" />
          <span>Daily 9-Day Novena</span>
        </button>

        <Link
          href="/prayers/request"
          className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center space-x-3 transition no-underline ${
            pathname.startsWith('/prayers') && pathname !== '/prayers/novena'
              ? 'bg-red-50 text-red-900 font-bold'
              : 'hover:bg-stone-50 text-stone-700'
          }`}
        >
          <TeamOutlined className="w-5 text-base text-emerald-600" />
          <span>Pilgrim House Visits</span>
        </Link>

        {isAdmin && (
          <Link
            href="/admin"
            className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center space-x-3 transition no-underline ${
              pathname.startsWith('/admin')
                ? 'bg-red-50 text-red-900 font-bold'
                : 'hover:bg-stone-50 text-stone-700'
            }`}
          >
            <SettingOutlined className="w-5 text-base text-stone-600" />
            <span>Admin Dashboard</span>
          </Link>
        )}
      </div>

      {/* NZ Area Chapters */}
      <div className="bg-white rounded-2xl p-4 border border-[#EFEAE2] shadow-sm space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-cinzel">
          NZ Area Chapters
        </div>
        <div className="space-y-1 text-xs font-semibold text-stone-600">
          <div className="px-2.5 py-2 rounded-lg hover:bg-stone-50 flex justify-between items-center cursor-pointer">
            <span>📍 Auckland Central</span>
            <span className="text-stone-400">142 members</span>
          </div>
          <div className="px-2.5 py-2 rounded-lg bg-red-50/70 text-red-900 flex justify-between items-center cursor-pointer font-bold border-l-4 border-red-700">
            <span>📍 North Shore Devotees</span>
            <span className="text-red-800">89 members</span>
          </div>
          <div className="px-2.5 py-2 rounded-lg hover:bg-stone-50 flex justify-between items-center cursor-pointer">
            <span>📍 West Auckland</span>
            <span className="text-stone-400">110 members</span>
          </div>
          <div className="px-2.5 py-2 rounded-lg hover:bg-stone-50 flex justify-between items-center cursor-pointer">
            <span>📍 South Auckland / Pukekohe</span>
            <span className="text-stone-400">95 members</span>
          </div>
        </div>
      </div>

      {/* Festival Ministries & Groups */}
      <div className="bg-white rounded-2xl p-4 border border-[#EFEAE2] shadow-sm space-y-2.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-cinzel">
          Ministries & Groups
        </div>
        <div className="space-y-1.5 text-xs font-semibold text-stone-700">
          <div className="px-2 py-1.5 rounded-lg hover:bg-stone-50 flex items-center space-x-2.5 cursor-pointer">
            <span className="text-base">💃</span>
            <span>Sinulog Dance Troupe</span>
          </div>
          <div className="px-2 py-1.5 rounded-lg hover:bg-stone-50 flex items-center space-x-2.5 cursor-pointer">
            <span className="text-base">🥁</span>
            <span>Sinulog Drummers & Brass</span>
          </div>
          <div className="px-2 py-1.5 rounded-lg hover:bg-stone-50 flex items-center space-x-2.5 cursor-pointer">
            <span className="text-base">👑</span>
            <span>Hermano & Hermana Council</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
