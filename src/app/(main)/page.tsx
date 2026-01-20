'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Row, Col, Button, Space, Tag, Empty } from 'antd';
import {
  CalendarOutlined,
  HeartOutlined,
  NotificationOutlined,
  TeamOutlined,
  RightOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getActiveRoles, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions';
import type { UserRole } from '@/types';

const { Title, Text, Paragraph } = Typography;

const QUICK_ACTIONS = [
  {
    key: 'events',
    title: 'Events',
    description: 'View upcoming events',
    icon: <CalendarOutlined className="text-2xl" />,
    href: '/events',
    color: '#B91C1C',
  },
  {
    key: 'prayers',
    title: 'Prayers',
    description: 'Prayer requests & novena',
    icon: <HeartOutlined className="text-2xl" />,
    href: '/prayers',
    color: '#D97706',
  },
  {
    key: 'community',
    title: 'Community',
    description: 'Members & groups',
    icon: <TeamOutlined className="text-2xl" />,
    href: '/community',
    color: '#7C3AED',
  },
  {
    key: 'announcements',
    title: 'Announcements',
    description: 'News & casting calls',
    icon: <NotificationOutlined className="text-2xl" />,
    href: '/announcements',
    color: '#059669',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, profile, user } = useAuth();

  console.log('HomePage - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user?.email);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('HomePage - Redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userRoles = profile?.roles ? getActiveRoles(profile.roles) : [];
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <Title level={4} className="mb-1">
              Welcome{displayName ? `, ${displayName}` : ''}!
            </Title>
            <Paragraph type="secondary" className="mb-3">
              Santo Niño NZ Devotees Community
            </Paragraph>
            {userRoles.length > 0 && (
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
            )}
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <Title level={5} className="mb-3">
          Quick Actions
        </Title>
        <Row gutter={[16, 16]}>
          {QUICK_ACTIONS.map((action) => (
            <Col xs={12} sm={6} key={action.key}>
              <Link href={action.href}>
                <Card
                  hoverable
                  className="text-center h-full"
                  styles={{ body: { padding: 16 } }}
                >
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: action.color }}
                  >
                    {action.icon}
                  </div>
                  <Text strong className="block">
                    {action.title}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {action.description}
                  </Text>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      {/* Upcoming Events Preview */}
      <Card
        title="Upcoming Events"
        extra={
          <Link href="/events">
            <Button type="link" icon={<RightOutlined />}>
              View All
            </Button>
          </Link>
        }
      >
        <Empty
          description="No upcoming events"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>

      {/* Recent Announcements Preview */}
      <Card
        title="Recent Announcements"
        extra={
          <Link href="/announcements">
            <Button type="link" icon={<RightOutlined />}>
              View All
            </Button>
          </Link>
        }
      >
        <Empty
          description="No announcements"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
}
