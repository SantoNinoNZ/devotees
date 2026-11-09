'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Empty, Tag, Space, Spin, Badge } from 'antd';
import { PushpinOutlined, CalendarOutlined, StarOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { announcementsApi } from '@/lib/supabase-api';
import type { Announcement } from '@/types';

const { Title, Text, Paragraph } = Typography;

type FilterType = 'all' | 'general' | 'casting' | 'pinned';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await announcementsApi.getAnnouncements();
        setAnnouncements(data);
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter((ann) => {
    if (filter === 'all') return true;
    if (filter === 'general') return ann.announcement_type === 'general';
    if (filter === 'casting') return ann.announcement_type === 'casting_call';
    if (filter === 'pinned') return ann.is_pinned;
    return true;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.is_pinned);
  const regularAnnouncements = filteredAnnouncements.filter((a) => !a.is_pinned);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Title level={4} className="mb-0">
        Announcements
      </Title>

      {/* Filter Tags */}
      <Space wrap>
        <Tag.CheckableTag
          checked={filter === 'all'}
          onChange={() => setFilter('all')}
        >
          All
        </Tag.CheckableTag>
        <Tag.CheckableTag
          checked={filter === 'general'}
          onChange={() => setFilter('general')}
        >
          General
        </Tag.CheckableTag>
        <Tag.CheckableTag
          checked={filter === 'casting'}
          onChange={() => setFilter('casting')}
        >
          Casting Calls
        </Tag.CheckableTag>
        <Tag.CheckableTag
          checked={filter === 'pinned'}
          onChange={() => setFilter('pinned')}
        >
          Pinned
        </Tag.CheckableTag>
      </Space>

      {filteredAnnouncements.length === 0 ? (
        <Card>
          <Empty
            description="No announcements yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <>
          {/* Pinned Announcements */}
          {pinnedAnnouncements.length > 0 && (
            <div>
              <Text type="secondary" className="text-sm flex items-center gap-1 mb-2">
                <PushpinOutlined /> Pinned
              </Text>
              <div className="space-y-3">
                {pinnedAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Announcements */}
          {regularAnnouncements.length > 0 && (
            <div>
              {pinnedAnnouncements.length > 0 && (
                <Text type="secondary" className="text-sm mb-2 block">
                  Recent
                </Text>
              )}
              <div className="space-y-3">
                {regularAnnouncements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const isCastingCall = announcement.announcement_type === 'casting_call';
  const hasDeadline = announcement.application_deadline;
  const isExpiringSoon =
    hasDeadline &&
    new Date(announcement.application_deadline!) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  return (
    <Link href={`/announcements/${announcement.id}`}>
      <Card
        hoverable
        className={`${announcement.is_pinned ? 'border-l-4 border-l-[#B91C1C]' : ''}`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {announcement.is_pinned && (
                  <PushpinOutlined className="text-[#B91C1C]" />
                )}
                <Text strong className="text-base">
                  {announcement.title}
                </Text>
              </div>
              <Paragraph
                type="secondary"
                className="mb-0 mt-1"
                ellipsis={{ rows: 2 }}
              >
                {announcement.content}
              </Paragraph>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isCastingCall ? (
                <Badge
                  count={<StarOutlined />}
                  style={{ backgroundColor: '#faad14' }}
                />
              ) : null}
              <Tag color={isCastingCall ? 'gold' : 'blue'}>
                {isCastingCall ? 'Casting Call' : 'General'}
              </Tag>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <Space>
              <CalendarOutlined />
              <span>
                {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}
              </span>
            </Space>
            {hasDeadline && (
              <Tag color={isExpiringSoon ? 'red' : 'default'} className="m-0">
                Deadline: {new Date(announcement.application_deadline!).toLocaleDateString()}
              </Tag>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
