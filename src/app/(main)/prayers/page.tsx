'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Empty,
  List,
  Tag,
  Progress,
  Spin,
} from 'antd';
import {
  HeartOutlined,
  BookOutlined,
  PlusOutlined,
  RightOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  novenasApi,
  requestsApi,
  type NovenaWithProgress,
  type RequestWithNotes,
} from '@/lib/supabase-api';

const { Title, Text, Paragraph } = Typography;

const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: 'gold',
  assigned: 'blue',
  in_progress: 'processing',
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NZ', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PrayersPage() {
  const [activeNovenas, setActiveNovenas] = useState<NovenaWithProgress[]>([]);
  const [requests, setRequests] = useState<RequestWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    const [novenas, reqs] = await Promise.all([
      novenasApi.getActiveNovenas(),
      requestsApi.getMyRequests(),
    ]);
    setActiveNovenas(novenas);
    setRequests(reqs.slice(0, 5)); // Show only last 5
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Title level={4}>Prayers</Title>

      {/* Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={12}>
          <Link href="/prayers/request">
            <Card hoverable className="text-center h-full">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#B91C1C] flex items-center justify-center text-white">
                <HeartOutlined className="text-xl" />
              </div>
              <Text strong className="block">
                Prayer Request
              </Text>
              <Text type="secondary" className="text-xs">
                Submit your intention
              </Text>
            </Card>
          </Link>
        </Col>
        <Col xs={12}>
          <Link href="/prayers/novena">
            <Card hoverable className="text-center h-full">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-[#D97706] flex items-center justify-center text-white">
                <BookOutlined className="text-xl" />
              </div>
              <Text strong className="block">
                Novena Prayers
              </Text>
              <Text type="secondary" className="text-xs">
                9-day devotions
              </Text>
            </Card>
          </Link>
        </Col>
      </Row>

      {/* My Active Novenas */}
      <Card
        title="My Active Novenas"
        extra={
          <Link href="/prayers/novena">
            <Button type="link" icon={<RightOutlined />}>
              Browse Novenas
            </Button>
          </Link>
        }
      >
        <Spin spinning={loading}>
          {!isAuthenticated ? (
            <Empty
              description="Sign in to track your novena progress"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : activeNovenas.length === 0 ? (
            <Empty
              description="You're not following any novenas"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Link href="/prayers/novena">
                <Button type="primary">Start a Novena</Button>
              </Link>
            </Empty>
          ) : (
            <List
              dataSource={activeNovenas}
              renderItem={(novena) => {
                const progress = novena.user_progress;
                const currentDay = progress?.current_day || 1;
                const totalDays = novena.total_days || 9;
                const percent = Math.round(((currentDay - 1) / totalDays) * 100);

                return (
                  <Link
                    href={`/prayers/novena/${novena.id}?progress=${progress?.id}`}
                    key={novena.id}
                  >
                    <List.Item className="cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2">
                      <List.Item.Meta
                        title={novena.title}
                        description={
                          <div className="space-y-1">
                            <Text type="secondary" className="text-xs">
                              Day {currentDay} of {totalDays}
                            </Text>
                            <Progress
                              percent={percent}
                              size="small"
                              showInfo={false}
                            />
                          </div>
                        }
                      />
                      <Button type="primary" size="small">
                        Pray Day {currentDay}
                      </Button>
                    </List.Item>
                  </Link>
                );
              }}
            />
          )}
        </Spin>
      </Card>

      {/* My Prayer Requests */}
      <Card
        title="My Prayer Requests"
        extra={
          <Link href="/prayers/request">
            <Button type="primary" size="small" icon={<PlusOutlined />}>
              New Request
            </Button>
          </Link>
        }
      >
        <Spin spinning={loading}>
          {!isAuthenticated ? (
            <Empty
              description="Sign in to submit prayer requests"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : requests.length === 0 ? (
            <Empty
              description="You haven't submitted any prayer requests"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Link href="/prayers/request">
                <Button type="primary" icon={<PlusOutlined />}>
                  Submit Prayer Request
                </Button>
              </Link>
            </Empty>
          ) : (
            <>
              <List
                dataSource={requests}
                renderItem={(request) => (
                  <Link href={`/prayers/request/${request.id}`} key={request.id}>
                    <List.Item className="cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2">
                      <List.Item.Meta
                        title={
                          <div className="flex items-center gap-2">
                            <span>{request.title}</span>
                            {request.is_urgent && (
                              <Tag color="red" className="text-xs">
                                Urgent
                              </Tag>
                            )}
                          </div>
                        }
                        description={
                          <div className="flex items-center gap-2 text-xs">
                            <ClockCircleOutlined />
                            <span>{formatDate(request.created_at)}</span>
                          </div>
                        }
                      />
                      <Tag color={REQUEST_STATUS_COLORS[request.status]}>
                        {REQUEST_STATUS_LABELS[request.status]}
                      </Tag>
                    </List.Item>
                  </Link>
                )}
              />
              {requests.length >= 5 && (
                <div className="text-center mt-4">
                  <Link href="/prayers/requests">
                    <Button type="link">View All Requests</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </Spin>
      </Card>

      {/* House Visit Request */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Title level={5} className="mb-1">
              Request a House Visit
            </Title>
            <Paragraph type="secondary" className="mb-0">
              Schedule a home blessing or visit from our Hermanos
            </Paragraph>
          </div>
          <Link href="/prayers/request?type=house_visit">
            <Button type="default">Request Visit</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
