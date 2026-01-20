'use client';

import { Card, Typography, Row, Col, Avatar, Empty, Button, Tag } from 'antd';
import {
  TeamOutlined,
  CrownOutlined,
  EnvironmentOutlined,
  RightOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

const COMMUNITY_SECTIONS = [
  {
    key: 'queens',
    title: 'Sinulog Queens',
    description: 'Our pageant title holders',
    icon: <CrownOutlined className="text-xl" />,
    href: '/community/queens',
    color: '#D97706',
  },
  {
    key: 'coordinators',
    title: 'Area Coordinators',
    description: 'Find your local leader',
    icon: <EnvironmentOutlined className="text-xl" />,
    href: '/community/coordinators',
    color: '#7C3AED',
  },
  {
    key: 'dance',
    title: 'Dance Groups',
    description: 'Sinulog dancers',
    icon: <TeamOutlined className="text-xl" />,
    href: '/dance',
    color: '#059669',
  },
];

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <Title level={4}>Community</Title>

      {/* Quick Links */}
      <Row gutter={[16, 16]}>
        {COMMUNITY_SECTIONS.map((section) => (
          <Col xs={24} sm={8} key={section.key}>
            <Link href={section.href}>
              <Card hoverable className="h-full">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: section.color }}
                  >
                    {section.icon}
                  </div>
                  <div>
                    <Text strong className="block">
                      {section.title}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {section.description}
                    </Text>
                  </div>
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Areas */}
      <Card
        title="Areas in New Zealand"
        extra={
          <Link href="/community/coordinators">
            <Button type="link" icon={<RightOutlined />}>
              View All
            </Button>
          </Link>
        }
      >
        <div className="space-y-2">
          <Text type="secondary">
            Our community is organized by geographic areas:
          </Text>
          <div className="flex flex-wrap gap-2 mt-2">
            <Tag>Auckland Central</Tag>
            <Tag>North Shore</Tag>
            <Tag>South Auckland</Tag>
            <Tag>Pukekohe</Tag>
            <Tag>Wellington</Tag>
            <Tag>Christchurch</Tag>
          </div>
        </div>
      </Card>

      {/* Sinulog Queens Preview */}
      <Card
        title="Sinulog Queens Gallery"
        extra={
          <Link href="/community/queens">
            <Button type="link" icon={<RightOutlined />}>
              View Gallery
            </Button>
          </Link>
        }
      >
        <Empty
          description="Queens gallery coming soon"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>

      {/* Member Directory */}
      <Card
        title="Member Directory"
        extra={
          <Link href="/community/members">
            <Button type="link" icon={<RightOutlined />}>
              Browse Members
            </Button>
          </Link>
        }
      >
        <Text type="secondary">
          Connect with fellow devotees in your area. Browse our member directory
          to find and connect with community members.
        </Text>
      </Card>
    </div>
  );
}
