'use client';

import { Card, Typography, List, Avatar, Tag } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, getActiveRoles, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import type { UserRole } from '@/types';

const { Title, Text } = Typography;

export default function MorePage() {
  const { profile, signOut } = useAuth();

  const userRoles = profile?.roles ? getActiveRoles(profile.roles) : [];
  const canAccessAdmin = hasPermission(userRoles, 'admin:access');

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      title: 'My Profile',
      description: 'View and edit your profile',
      href: '/profile',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      title: 'Notifications',
      description: 'Manage notification preferences',
      href: '/notifications',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      title: 'Settings',
      description: 'App settings and preferences',
      href: '/profile/edit',
    },
    ...(canAccessAdmin
      ? [
          {
            key: 'admin',
            icon: <TeamOutlined />,
            title: 'Admin Dashboard',
            description: 'Manage users, events, and more',
            href: '/admin',
          },
        ]
      : []),
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      title: 'Help & Support',
      description: 'Get help using the app',
      href: '/help',
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      title: 'About',
      description: 'About Santo Niño NZ',
      href: '/about',
    },
  ];

  return (
    <div className="space-y-6">
      <Title level={4}>More</Title>

      {/* Profile Card */}
      <Card>
        <div className="flex items-center gap-4">
          <Avatar
            size={64}
            src={profile?.avatar_url}
            icon={!profile?.avatar_url && <UserOutlined />}
            className="bg-[#B91C1C]"
          />
          <div className="flex-1">
            <Text strong className="text-lg block">
              {profile?.display_name || 'Guest'}
            </Text>
            <Text type="secondary" className="text-sm">
              {profile?.email}
            </Text>
            {userRoles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {userRoles.map((role) => (
                  <Tag
                    key={role}
                    color={ROLE_COLORS[role as UserRole]}
                    className="text-xs"
                  >
                    {ROLE_LABELS[role as UserRole]}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      <Card styles={{ body: { padding: 0 } }}>
        <List
          itemLayout="horizontal"
          dataSource={menuItems}
          renderItem={(item) => (
            <Link href={item.href}>
              <List.Item className="px-4 hover:bg-gray-50 cursor-pointer">
                <List.Item.Meta
                  avatar={
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {item.icon}
                    </div>
                  }
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            </Link>
          )}
        />
      </Card>

      {/* Sign Out */}
      <Card
        styles={{ body: { padding: 0 } }}
        className="cursor-pointer hover:bg-gray-50"
        onClick={signOut}
      >
        <List.Item className="px-4">
          <List.Item.Meta
            avatar={
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <LogoutOutlined />
              </div>
            }
            title={<span className="text-red-500">Sign Out</span>}
            description="Sign out of your account"
          />
        </List.Item>
      </Card>
    </div>
  );
}
