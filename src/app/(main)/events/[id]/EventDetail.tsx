'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Spin,
  Divider,
  Avatar,
  List,
  Segmented,
  message,
  Result,
  Modal,
  Input,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  ShareAltOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { eventsApi, type EventWithDetails, type EventRSVP } from '@/lib/supabase-api';
import type { EventType } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const EVENT_CATEGORIES: { key: EventType; label: string; color: string }[] = [
  { key: 'sinulog', label: 'Sinulog', color: 'gold' },
  { key: 'novena', label: 'Novena', color: 'purple' },
  { key: 'community', label: 'Community', color: 'blue' },
  { key: 'practice', label: 'Practice', color: 'green' },
  { key: 'mass', label: 'Mass', color: 'cyan' },
  { key: 'procession', label: 'Procession', color: 'orange' },
  { key: 'internal', label: 'Internal', color: 'gray' },
  { key: 'pageant', label: 'Pageant', color: 'magenta' },
  { key: 'other', label: 'Event', color: 'default' },
];

function formatEventDate(startDate?: string | null, endDate?: string | null): string {
  if (!startDate) return 'Date TBD';

  const start = new Date(startDate);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  if (endDate && endDate !== startDate) {
    const end = new Date(endDate);
    const shortOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    return `${start.toLocaleDateString('en-NZ', shortOptions)} - ${end.toLocaleDateString('en-NZ', options)}`;
  }

  return start.toLocaleDateString('en-NZ', options);
}

function formatEventTime(
  startTime?: string | null,
  endTime?: string | null,
  isAllDay?: boolean
): string {
  if (isAllDay) return 'All day event';
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
  const cat = EVENT_CATEGORIES.find((c) => c.key === category);
  return cat?.color || 'default';
}

function getCategoryLabel(category?: string | null): string {
  const cat = EVENT_CATEGORIES.find((c) => c.key === category);
  return cat?.label || 'Event';
}

type RSVPStatus = 'going' | 'maybe' | 'not_going';

export default function EventDetail() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [selectedRsvp, setSelectedRsvp] = useState<RSVPStatus>('going');
  const [activeTab, setActiveTab] = useState<'details' | 'going' | 'maybe'>('details');

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    const eventData = await eventsApi.getEvent(eventId);
    setEvent(eventData);

    if (eventData) {
      const rsvpData = await eventsApi.getEventRSVPs(eventId);
      setRsvps(rsvpData);
    }

    setLoading(false);
  };

  const handleRsvp = async (status: RSVPStatus) => {
    if (!isAuthenticated) {
      message.info('Please sign in to RSVP');
      return;
    }

    setSelectedRsvp(status);
    setRsvpNotes(event?.user_rsvp?.notes || '');
    setRsvpModalOpen(true);
  };

  const submitRsvp = async () => {
    setRsvpLoading(true);
    const success = await eventsApi.rsvp(eventId, selectedRsvp, rsvpNotes);

    if (success) {
      message.success(
        selectedRsvp === 'going'
          ? "You're going!"
          : selectedRsvp === 'maybe'
            ? 'Marked as maybe'
            : "You're not going"
      );
      await loadEvent();
      setRsvpModalOpen(false);
    } else {
      message.error('Failed to update RSVP');
    }
    setRsvpLoading(false);
  };

  const handleCancelRsvp = async () => {
    setRsvpLoading(true);
    const success = await eventsApi.cancelRsvp(eventId);

    if (success) {
      message.success('RSVP cancelled');
      await loadEvent();
    } else {
      message.error('Failed to cancel RSVP');
    }
    setRsvpLoading(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description || undefined,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      message.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <Result
        status="404"
        title="Event not found"
        subTitle="This event may have been removed or you don't have permission to view it."
        extra={
          <Button type="primary" onClick={() => router.push('/events')}>
            Back to Events
          </Button>
        }
      />
    );
  }

  const goingRsvps = rsvps.filter((r) => r.status === 'going');
  const maybeRsvps = rsvps.filter((r) => r.status === 'maybe');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/events')}
          type="text"
        />
        <Tag color={getCategoryColor(event.category)}>
          {getCategoryLabel(event.category)}
        </Tag>
      </div>

      {/* Featured Image */}
      {event.featured_image && (
        <div className="rounded-xl overflow-hidden">
          <img
            src={event.featured_image}
            alt={event.title}
            className="w-full h-48 sm:h-64 object-cover"
          />
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex items-start justify-between gap-4">
        <Title level={3} className="mb-0">
          {event.title}
        </Title>
        <Button icon={<ShareAltOutlined />} onClick={handleShare} />
      </div>

      {/* RSVP Section */}
      {isAuthenticated && (
        <Card size="small">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Text strong>Are you going?</Text>
              {event.user_rsvp && (
                <Text type="secondary" className="ml-2">
                  (You marked:{' '}
                  {event.user_rsvp.status === 'going'
                    ? 'Going'
                    : event.user_rsvp.status === 'maybe'
                      ? 'Maybe'
                      : 'Not Going'}
                  )
                </Text>
              )}
            </div>
            <Space>
              <Button
                type={event.user_rsvp?.status === 'going' ? 'primary' : 'default'}
                icon={<CheckCircleOutlined />}
                onClick={() => handleRsvp('going')}
              >
                Going
              </Button>
              <Button
                type={event.user_rsvp?.status === 'maybe' ? 'primary' : 'default'}
                icon={<QuestionCircleOutlined />}
                onClick={() => handleRsvp('maybe')}
              >
                Maybe
              </Button>
              <Button
                type={event.user_rsvp?.status === 'not_going' ? 'primary' : 'default'}
                danger={event.user_rsvp?.status === 'not_going'}
                icon={<CloseCircleOutlined />}
                onClick={() => handleRsvp('not_going')}
              >
                Can't Go
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* Event Info */}
      <Card>
        <Space direction="vertical" size="middle" className="w-full">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <CalendarOutlined className="text-lg text-primary mt-1" />
            <div>
              <Text strong className="block">
                {formatEventDate(event.event_start_date, event.event_end_date)}
              </Text>
              {(event.event_start_time || event.is_all_day) && (
                <Text type="secondary">
                  <ClockCircleOutlined className="mr-1" />
                  {formatEventTime(
                    event.event_start_time,
                    event.event_end_time,
                    event.is_all_day
                  )}
                </Text>
              )}
            </div>
          </div>

          {/* Location */}
          {event.is_online ? (
            <div className="flex items-start gap-3">
              <VideoCameraOutlined className="text-lg text-primary mt-1" />
              <div>
                <Text strong className="block">
                  Online Event
                </Text>
                {event.online_link && (
                  <a
                    href={event.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    <LinkOutlined className="mr-1" />
                    Join online
                  </a>
                )}
              </div>
            </div>
          ) : (
            (event.venue || event.address) && (
              <div className="flex items-start gap-3">
                <EnvironmentOutlined className="text-lg text-primary mt-1" />
                <div>
                  <Text strong className="block">
                    {event.venue || 'Location'}
                  </Text>
                  {event.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-primary"
                    >
                      {event.address}
                    </a>
                  )}
                </div>
              </div>
            )
          )}

          {/* Attendees Count */}
          <div className="flex items-center gap-3">
            <TeamOutlined className="text-lg text-primary" />
            <Text>
              <Text strong>{event.rsvp_going_count || 0}</Text> going
              {(event.rsvp_maybe_count ?? 0) > 0 && (
                <>
                  {' · '}
                  <Text type="secondary">{event.rsvp_maybe_count} maybe</Text>
                </>
              )}
            </Text>
          </div>
        </Space>
      </Card>

      {/* Tabs for Details/Attendees */}
      <Segmented
        block
        value={activeTab}
        onChange={(value) => setActiveTab(value as typeof activeTab)}
        options={[
          { label: 'Details', value: 'details' },
          { label: `Going (${goingRsvps.length})`, value: 'going' },
          { label: `Maybe (${maybeRsvps.length})`, value: 'maybe' },
        ]}
      />

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <Card>
          {event.description && (
            <>
              <Title level={5}>About this event</Title>
              <Paragraph>{event.description}</Paragraph>
            </>
          )}

          {event.content && (
            <>
              <Divider />
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: event.content }}
              />
            </>
          )}

          {!event.description && !event.content && (
            <Text type="secondary">No additional details provided.</Text>
          )}
        </Card>
      ) : (
        <Card>
          <List
            dataSource={activeTab === 'going' ? goingRsvps : maybeRsvps}
            locale={{
              emptyText:
                activeTab === 'going' ? 'No one has RSVPed yet' : 'No maybes yet',
            }}
            renderItem={(rsvp) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar src={rsvp.user?.avatar_url}>
                      {rsvp.user?.display_name?.[0]}
                    </Avatar>
                  }
                  title={rsvp.user?.display_name || 'Unknown'}
                  description={rsvp.notes}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* RSVP Modal */}
      <Modal
        title="RSVP"
        open={rsvpModalOpen}
        onOk={submitRsvp}
        onCancel={() => setRsvpModalOpen(false)}
        confirmLoading={rsvpLoading}
        okText={
          selectedRsvp === 'going'
            ? "I'm Going"
            : selectedRsvp === 'maybe'
              ? 'Mark as Maybe'
              : "Can't Make It"
        }
        footer={[
          event?.user_rsvp && (
            <Button
              key="cancel-rsvp"
              danger
              onClick={handleCancelRsvp}
              loading={rsvpLoading}
            >
              Cancel RSVP
            </Button>
          ),
          <Button key="back" onClick={() => setRsvpModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={submitRsvp}
            loading={rsvpLoading}
          >
            {selectedRsvp === 'going'
              ? "I'm Going"
              : selectedRsvp === 'maybe'
                ? 'Mark as Maybe'
                : "Can't Make It"}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <Text strong className="block mb-2">
              Add a note (optional)
            </Text>
            <TextArea
              rows={3}
              placeholder="e.g., Bringing a dish to share..."
              value={rsvpNotes}
              onChange={(e) => setRsvpNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
