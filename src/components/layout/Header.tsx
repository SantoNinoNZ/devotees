'use client';

import { Layout, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const { Header: AntHeader } = Layout;

export default function Header() {
  const { user, profile, signOut, isAuthenticated } = useAuth();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link href="/profile">My Profile</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/profile/settings">Settings</Link>,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: signOut,
    },
  ];

  return (
    <AntHeader
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 bg-white shadow-sm"
      style={{ height: 64 }}
    >
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-8 h-8 rounded-full bg-[#B91C1C] flex items-center justify-center text-white font-bold text-sm">
          SN
        </div>
        <span className="text-lg font-semibold text-gray-800 hidden sm:inline">
          Santo Niño NZ
        </span>
      </Link>

      <Space size="middle">
        {isAuthenticated ? (
          <>
            <Link href="/notifications">
              <Badge count={0} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined className="text-xl" />}
                  className="flex items-center justify-center"
                />
              </Badge>
            </Link>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Avatar
                src={profile?.avatar_url}
                icon={!profile?.avatar_url && <UserOutlined />}
                className="cursor-pointer bg-[#B91C1C]"
              />
            </Dropdown>
          </>
        ) : (
          <Link href="/login">
            <Button type="primary">Sign In</Button>
          </Link>
        )}
      </Space>
    </AntHeader>
  );
}
