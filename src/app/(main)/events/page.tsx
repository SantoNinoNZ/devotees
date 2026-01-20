'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Segmented,
  Empty,
  Button,
  Space,
  Tag,
  Spin,
  List,
  Avatar,
  Badge,
} from 'antd';
import {
  CalendarOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, getActiveRoles } from '@/lib/permissions';
import { eventsApi, type EventWithDetails } from '@/lib/supabase-api';
import type { EventType } from '@/types';

const { Title, Text, Paragraph } = Typography;

type ViewMode = 'list' | 'calendar';

const EVENT_CATEGORIES: { key: EventType | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'default' },
  { key: 'sinulog', label: 'Sinulog', color: 'gold' },
  { key: 'novena', label: 'Novena', color: 'purple' },
  { key: 'community', label: 'Community', color: 'blue' },
  { key: 'practice', label: 'Practice', color: 'green' },
  { key: 'mass', label: 'Mass', color: 'cyan' },
  { key: 'procession', label: 'Procession', color: 'orange' },
];

function formatEventDate(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return 'Date TBD';

  const start = new Date(startDate);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  if (endDate && endDate !== startDate) {
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-NZ', options)} - ${end.toLocaleDateString('en-NZ', options)}`;
  }

  return start.toLocaleDateString('en-NZ', { ...options, year: 'numeric' });
}

function formatEventTime(
  startTime?: string | null,
  endTime?: string | null,
  isAllDay?: boolean
): string {
  if (isAllDay) return 'All day';
  if (!startTime) return '';

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (endTime) {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  return formatTime(startTime);
}

function getCategoryColor(category?: string | null): string {
  if (!category) return 'default';
  const cat = EVENT_CATEGORIES.find((c) => c.key === category);
  return cat?.color || 'default';
}

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategory, setSelectedCategory] = useState<EventType | 'all'>('all');
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const userRoles = profile?.roles ? getActiveRoles(profile.roles) : [];
  const canCreateEvent = hasPermission(userRoles, 'events:create');

  useEffect(() => {
    loadEvents();
  }, [selectedCategory]);

  const loadEvents = async () => {
    setLoading(true);
    const data = await eventsApi.getEvents({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      upcoming: true,
    });
    setEvents(data);
    setLoading(false);
  };

  const handleCategoryChange = (category: EventType | 'all') => {
    setSelectedCategory(category);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Title level={4} className="mb-0">
          Events
        </Title>
        <Space>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              { value: 'list', icon: <UnorderedListOutlined /> },
              { value: 'calendar', icon: <CalendarOutlined /> },
            ]}
          />
          {canCreateEvent && (
            <Button type="primary" icon={<PlusOutlined />}>
              Create Event
            </Button>
          )}
        </Space>
      </div>

      {/* Filter Tags */}
      <Space wrap>
        {EVENT_CATEGORIES.map((cat) => (
          <Tag.CheckableTag
            key={cat.key}
            checked={selectedCategory === cat.key}
            onChange={() => handleCategoryChange(cat.key)}
          >
            {cat.label}
          </Tag.CheckableTag>
        ))}
      </Space>

      {/* Events Content */}
      {viewMode === 'list' ? (
        <Spin spinning={loading}>
          {events.length === 0 && !loading ? (
            <Card>
              <Empty
                description="No upcoming events"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {canCreateEvent && (
                  <Button type="primary" icon={<PlusOutlined />}>
                    Create First Event
                  </Button>
                )}
              </Empty>
            </Card>
          ) : (
            <List
              dataSource={events}
              renderItem={(event) => (
                <Link href={`/events/${event.id}`} key={event.id}>
                  <Card
                    hoverable
                    className="mb-3"
                    styles={{ body: { padding: '16px' } }}
                  >
                    <div className="flex gap-4">
                      {/* Date Badge */}
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="bg-primary/10 rounded-lg p-2">
                          <Text className="block text-xs uppercase text-gray-500">
                            {event.event_start_date
                              ? new Date(event.event_start_date).toLocaleDateString(
                                  'en-NZ',
                                  { month: 'short' }
                                )
                              : 'TBD'}
                          </Text>
                          <Text className="block text-2xl font-bold text-primary">
                            {event.event_start_date
                              ? new Date(event.event_start_date).getDate()
                              : '?'}
                          </Text>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Tag color={getCategoryColor(event.category)}>
                              {event.category || 'Event'}
                            </Tag>
                            <Title level={5} className="mb-1 mt-1">
                              {event.title}
                            </Title>
                          </div>
                          {(event.rsvp_going_count ?? 0) > 0 && (
                            <Badge
                              count={`${event.rsvp_going_count} going`}
                              style={{ backgroundColor: '#52c41a' }}
                            />
                          )}
                        </div>

                        {event.description && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 2 }}
                            className="mb-2 text-sm"
                          >
                            {event.description}
                          </Paragraph>
                        )}

                        <Space size="middle" wrap className="text-gray-500 text-sm">
                          <span>
                            <CalendarOutlined className="mr-1" />
                            {formatEventDate(
                              event.event_start_date,
                              event.event_end_date
                            )}
                          </span>
                          {(event.event_start_time || event.is_all_day) && (
                            <span>
                              <ClockCircleOutlined className="mr-1" />
                              {formatEventTime(
                                event.event_start_time,
                                event.event_end_time,
                                event.is_all_day
                              )}
                            </span>
                          )}
                          {event.is_online ? (
                            <span>
                              <VideoCameraOutlined className="mr-1" />
                              Online Event
                            </span>
                          ) : event.location_name ? (
                            <span>
                              <EnvironmentOutlined className="mr-1" />
                              {event.location_name}
                            </span>
                          ) : event.venue ? (
                            <span>
                              <EnvironmentOutlined className="mr-1" />
                              {event.venue}
                            </span>
                          ) : null}
                        </Space>
                      </div>

                      {/* Featured Image */}
                      {event.featured_image && (
                        <div className="flex-shrink-0 hidden sm:block">
                          <Avatar
                            shape="square"
                            size={80}
                            src={event.featured_image}
                            className="rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              )}
            />
          )}
        </Spin>
      ) : (
        <Card>
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded">
            <Text type="secondary">Calendar view coming soon</Text>
          </div>
        </Card>
      )}
    </div>
  );
}
