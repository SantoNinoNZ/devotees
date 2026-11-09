'use client';

import { Card, Typography, Avatar, Button, Descriptions, Tag, Space, Spin } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getActiveRoles, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import type { UserRole, ProfileWithRoles } from '@/types';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { profile, user, isLoading } = useAuth();

  const effectiveProfile: ProfileWithRoles | null = profile || (user ? {
    id: user.id,
    email: user.email || '',
    display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Devotee',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    phone: null,
    area_id: null,
    is_active: true,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
    area: null,
    roles: [],
  } : null);

  const userRoles = effectiveProfile?.roles ? getActiveRoles(effectiveProfile.roles) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!effectiveProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Text type="secondary">Please sign in to view your profile.</Text>
        <Link href="/login">
          <Button type="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title level={4} className="mb-0">
          My Profile
        </Title>
        <Link href="/profile/edit">
          <Button icon={<EditOutlined />}>Edit Profile</Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
          <Avatar
            size={96}
            src={effectiveProfile.avatar_url}
            icon={!effectiveProfile.avatar_url && <UserOutlined />}
            className="bg-[#B91C1C]"
          />
          <div className="flex-1">
            <Title level={3} className="mb-1">
              {effectiveProfile.display_name}
            </Title>
            <Text type="secondary">{effectiveProfile.email}</Text>

            {userRoles.length > 0 && (
              <div className="mt-3">
                <Space wrap>
                  {userRoles.map((role) => (
                    <Tag
                      key={role}
                      color={ROLE_COLORS[role as UserRole]}
                    >
                      {ROLE_LABELS[role as UserRole]}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Profile Details */}
      <Card title="Details">
        <Descriptions column={1}>
          <Descriptions.Item label="Display Name">
            {effectiveProfile.display_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {effectiveProfile.email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {effectiveProfile.phone || <Text type="secondary">Not provided</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Area">
            {effectiveProfile.area?.name || <Text type="secondary">Not selected</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Member Since">
            {new Date(effectiveProfile.created_at).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Roles */}
      {userRoles.length > 0 && (
        <Card title="Roles & Responsibilities">
          <Space direction="vertical" className="w-full">
            {userRoles.map((role) => (
              <div
                key={role}
                className="p-3 rounded bg-gray-50 flex items-center justify-between"
              >
                <div>
                  <Tag color={ROLE_COLORS[role as UserRole]}>
                    {ROLE_LABELS[role as UserRole]}
                  </Tag>
                </div>
              </div>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
}
