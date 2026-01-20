'use client';

import { Layout, Menu } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  HeartOutlined,
  TeamOutlined,
  NotificationOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, getActiveRoles } from '@/lib/permissions';

const { Sider } = Layout;

const NAV_ITEMS = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: <Link href="/">Home</Link>,
  },
  {
    key: '/events',
    icon: <CalendarOutlined />,
    label: <Link href="/events">Events</Link>,
  },
  {
    key: '/prayers',
    icon: <HeartOutlined />,
    label: <Link href="/prayers">Prayers</Link>,
  },
  {
    key: '/community',
    icon: <TeamOutlined />,
    label: <Link href="/community">Community</Link>,
  },
  {
    key: '/announcements',
    icon: <NotificationOutlined />,
    label: <Link href="/announcements">Announcements</Link>,
  },
];

const ADMIN_ITEMS = [
  {
    key: '/admin',
    icon: <SettingOutlined />,
    label: <Link href="/admin">Admin</Link>,
    permission: 'admin:access' as const,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const userRoles = profile?.roles ? getActiveRoles(profile.roles) : [];

  // Filter admin items based on permissions
  const visibleAdminItems = ADMIN_ITEMS.filter((item) =>
    hasPermission(userRoles, item.permission)
  );

  const menuItems = [
    ...NAV_ITEMS,
    ...(visibleAdminItems.length > 0
      ? [{ type: 'divider' as const }, ...visibleAdminItems]
      : []),
  ];

  // Find active key
  const activeKey = NAV_ITEMS.find((item) =>
    pathname === '/' ? item.key === '/' : pathname.startsWith(item.key) && item.key !== '/'
  )?.key || '/';

  return (
    <Sider
      width={200}
      className="fixed left-0 top-[64px] h-[calc(100vh-64px)] bg-white border-r border-gray-200"
      theme="light"
    >
      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        items={menuItems}
        className="h-full border-none pt-4"
      />
    </Sider>
  );
}
