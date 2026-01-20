'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeOutlined,
  HomeFilled,
  CalendarOutlined,
  CalendarFilled,
  HeartOutlined,
  HeartFilled,
  TeamOutlined,
  AppstoreOutlined,
  AppstoreFilled,
} from '@ant-design/icons';

const NAV_ITEMS = [
  {
    key: '/',
    label: 'Home',
    icon: HomeOutlined,
    activeIcon: HomeFilled,
    href: '/',
  },
  {
    key: '/events',
    label: 'Events',
    icon: CalendarOutlined,
    activeIcon: CalendarFilled,
    href: '/events',
  },
  {
    key: '/prayers',
    label: 'Prayers',
    icon: HeartOutlined,
    activeIcon: HeartFilled,
    href: '/prayers',
  },
  {
    key: '/community',
    label: 'Community',
    icon: TeamOutlined,
    activeIcon: TeamOutlined,
    href: '/community',
  },
  {
    key: '/more',
    label: 'More',
    icon: AppstoreOutlined,
    activeIcon: AppstoreFilled,
    href: '/more',
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (key: string) => {
    if (key === '/') return pathname === '/';
    return pathname.startsWith(key);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.key);
          const Icon = active ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                w-full h-full
                transition-colors
                ${active ? 'text-[#B91C1C]' : 'text-gray-500'}
              `}
            >
              <Icon className="text-xl mb-1" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
