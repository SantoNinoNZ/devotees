'use client';

import { Card, Typography, Empty, Button, Tag, Space } from 'antd';
import { PlusOutlined, PushpinOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, getActiveRoles } from '@/lib/permissions';

const { Title, Text } = Typography;

export default function AnnouncementsPage() {
  const { profile } = useAuth();

  const userRoles = profile?.roles ? getActiveRoles(profile.roles) : [];
  const canCreateAnnouncement = hasPermission(userRoles, 'announcements:create');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Title level={4} className="mb-0">
          Announcements
        </Title>
        {canCreateAnnouncement && (
          <Button type="primary" icon={<PlusOutlined />}>
            Post Announcement
          </Button>
        )}
      </div>

      {/* Filter Tags */}
      <Space wrap>
        <Tag.CheckableTag checked>All</Tag.CheckableTag>
        <Tag.CheckableTag checked={false}>General</Tag.CheckableTag>
        <Tag.CheckableTag checked={false}>Casting Calls</Tag.CheckableTag>
        <Tag.CheckableTag checked={false}>Urgent</Tag.CheckableTag>
      </Space>

      {/* Pinned Announcements */}
      <div>
        <Text type="secondary" className="text-sm flex items-center gap-1 mb-2">
          <PushpinOutlined /> Pinned
        </Text>
        <Card>
          <Empty
            description="No pinned announcements"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </div>

      {/* Recent Announcements */}
      <div>
        <Text type="secondary" className="text-sm mb-2 block">
          Recent
        </Text>
        <Card>
          <Empty
            description="No announcements yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {canCreateAnnouncement && (
              <Button type="primary" icon={<PlusOutlined />}>
                Post First Announcement
              </Button>
            )}
          </Empty>
        </Card>
      </div>
    </div>
  );
}
