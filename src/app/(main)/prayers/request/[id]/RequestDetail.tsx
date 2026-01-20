'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Button,
  Spin,
  Result,
  Tag,
  Divider,
  Timeline,
  Avatar,
  Input,
  message,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  SendOutlined,
  ExclamationCircleFilled,
  LockOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { requestsApi, type RequestWithNotes } from '@/lib/supabase-api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'gold',
  assigned: 'blue',
  in_progress: 'cyan',
  completed: 'green',
  cancelled: 'default',
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  prayer: 'Prayer Request',
  house_visit: 'House Visit',
  blessing: 'Blessing Request',
  counseling: 'Spiritual Counseling',
  other: 'Other Request',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NZ', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-NZ', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function RequestDetail() {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.id as string;

  const [request, setRequest] = useState<RequestWithNotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [sendingNote, setSendingNote] = useState(false);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const loadRequest = async () => {
    setLoading(true);
    const data = await requestsApi.getRequest(requestId);
    setRequest(data);
    setLoading(false);
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    setSendingNote(true);
    const success = await requestsApi.addNote(requestId, noteContent);

    if (success) {
      message.success('Note added');
      setNoteContent('');
      await loadRequest();
    } else {
      message.error('Failed to add note');
    }
    setSendingNote(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!request) {
    return (
      <Result
        status="404"
        title="Request not found"
        subTitle="This request may have been removed or you don't have permission to view it."
        extra={
          <Button type="primary" onClick={() => router.push('/prayers')}>
            Back to Prayers
          </Button>
        }
      />
    );
  }

  const isOwner = user?.id === request.requester_id;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/prayers')}
          type="text"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag color={REQUEST_STATUS_COLORS[request.status]}>
              {REQUEST_STATUS_LABELS[request.status]}
            </Tag>
            <Tag>{REQUEST_TYPE_LABELS[request.request_type]}</Tag>
            {request.is_urgent && (
              <Tag color="red" icon={<ExclamationCircleFilled />}>
                Urgent
              </Tag>
            )}
            {request.is_private && (
              <Tag icon={<LockOutlined />}>Private</Tag>
            )}
          </div>
        </div>
      </div>

      {/* Request Details */}
      <Card>
        <Title level={4} className="mb-4">
          {request.title}
        </Title>

        <div className="space-y-4">
          {/* Submitted info */}
          <div className="flex items-center gap-2 text-gray-500">
            <ClockCircleOutlined />
            <Text type="secondary">
              Submitted {formatDate(request.created_at)}
            </Text>
          </div>

          {/* Area */}
          {request.area && (
            <div className="flex items-center gap-2 text-gray-500">
              <EnvironmentOutlined />
              <Text type="secondary">{request.area.name}</Text>
            </div>
          )}

          {/* Preferred date for visits */}
          {request.preferred_date && (
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarOutlined />
              <Text type="secondary">
                Preferred: {formatDate(request.preferred_date)}
                {request.preferred_time_slot && ` (${request.preferred_time_slot})`}
              </Text>
            </div>
          )}

          {/* Assigned to */}
          {request.assigned_user && (
            <div className="flex items-center gap-2">
              <UserOutlined />
              <Text>
                Assigned to:{' '}
                <Text strong>{request.assigned_user.display_name}</Text>
              </Text>
            </div>
          )}

          <Divider />

          {/* Description */}
          <div>
            <Text strong className="block mb-2">
              Details
            </Text>
            <Paragraph className="whitespace-pre-wrap mb-0">
              {request.description}
            </Paragraph>
          </div>

          {/* Visit Address */}
          {request.visit_address && (
            <div>
              <Text strong className="block mb-2">
                Address
              </Text>
              <Paragraph className="whitespace-pre-wrap mb-0">
                {request.visit_address}
              </Paragraph>
            </div>
          )}
        </div>
      </Card>

      {/* Communication/Notes */}
      <Card title="Updates & Notes">
        {request.notes && request.notes.length > 0 ? (
          <Timeline
            items={request.notes.map((note) => ({
              color:
                note.created_by === request.requester_id ? 'blue' : 'green',
              children: (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar size="small" src={note.author?.avatar_url}>
                      {note.author?.display_name?.[0]}
                    </Avatar>
                    <Text strong>{note.author?.display_name || 'Unknown'}</Text>
                    <Text type="secondary" className="text-xs">
                      {formatDateTime(note.created_at)}
                    </Text>
                  </div>
                  <Paragraph className="whitespace-pre-wrap mb-0 ml-8">
                    {note.content}
                  </Paragraph>
                </div>
              ),
            }))}
          />
        ) : (
          <Text type="secondary">No updates yet</Text>
        )}

        {/* Add note form */}
        {isAuthenticated && (
          <>
            <Divider />
            <div className="space-y-2">
              <TextArea
                rows={3}
                placeholder="Add a note or update..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddNote}
                  loading={sendingNote}
                  disabled={!noteContent.trim()}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Status Timeline */}
      <Card title="Status History" size="small">
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <div>
                  <Text strong>Submitted</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    {formatDateTime(request.created_at)}
                  </Text>
                </div>
              ),
            },
            ...(request.assigned_at
              ? [
                  {
                    color: 'blue' as const,
                    children: (
                      <div>
                        <Text strong>Assigned</Text>
                        {request.assigned_user && (
                          <>
                            <br />
                            <Text type="secondary" className="text-xs">
                              to {request.assigned_user.display_name}
                            </Text>
                          </>
                        )}
                        <br />
                        <Text type="secondary" className="text-xs">
                          {formatDateTime(request.assigned_at)}
                        </Text>
                      </div>
                    ),
                  },
                ]
              : []),
            ...(request.completed_at
              ? [
                  {
                    color: 'green' as const,
                    children: (
                      <div>
                        <Text strong>Completed</Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                          {formatDateTime(request.completed_at)}
                        </Text>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </div>
  );
}
