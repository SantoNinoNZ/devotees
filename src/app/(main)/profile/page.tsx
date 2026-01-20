'use client';

import { Card, Typography, Avatar, Button, Descriptions, Tag, Space } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getActiveRoles, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import type { UserRole } from '@/types';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { profile } = useAuth();

  const userRoles = profile?.roles ? getActiveRoles(profile.roles) : [];

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Text type="secondary">Loading profile...</Text>
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
            src={profile.avatar_url}
            icon={!profile.avatar_url && <UserOutlined />}
            className="bg-[#B91C1C]"
          />
          <div className="flex-1">
            <Title level={3} className="mb-1">
              {profile.display_name}
            </Title>
            <Text type="secondary">{profile.email}</Text>

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
            {profile.display_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {profile.email}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {profile.phone || <Text type="secondary">Not provided</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Area">
            {profile.area?.name || <Text type="secondary">Not selected</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Member Since">
            {new Date(profile.created_at).toLocaleDateString()}
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
