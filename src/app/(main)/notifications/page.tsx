'use client';

import { Card, Typography, Empty, List, Avatar, Button, Space, Tag } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="mb-0">
          Notifications
        </Title>
        <Space>
          <Button icon={<CheckOutlined />}>Mark All Read</Button>
          <Link href="/profile/settings">
            <Button icon={<SettingOutlined />}>Settings</Button>
          </Link>
        </Space>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Empty
          className="py-12"
          description="No notifications yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Text type="secondary">
            You'll receive notifications for events, prayer requests, and announcements
          </Text>
        </Empty>
      </Card>
    </div>
  );
}
