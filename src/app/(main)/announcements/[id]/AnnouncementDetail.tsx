'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Tag,
  Button,
  Spin,
  Space,
  Divider,
  Modal,
  Form,
  Input,
  message,
  Alert,
  Result,
} from 'antd';
import {
  ArrowLeftOutlined,
  PushpinOutlined,
  CalendarOutlined,
  StarOutlined,
  SendOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { announcementsApi } from '@/lib/supabase-api';
import type { Announcement } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ApplicationFormValues {
  message: string;
  portfolio_url?: string;
  phone?: string;
}

export default function AnnouncementDetail() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [form] = Form.useForm<ApplicationFormValues>();

  const announcementId = params.id as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [announcementData, applications] = await Promise.all([
          announcementsApi.getAnnouncement(announcementId),
          announcementsApi.getMyApplications(),
        ]);
        setAnnouncement(announcementData);
        setHasApplied(applications.some((app) => app.announcement_id === announcementId));
      } catch (error) {
        console.error('Error loading announcement:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [announcementId]);

  const handleApply = async (values: ApplicationFormValues) => {
    setSubmitting(true);
    try {
      const success = await announcementsApi.applyToCastingCall(announcementId, {
        message: values.message,
        portfolio_url: values.portfolio_url,
        phone: values.phone,
      });

      if (success) {
        message.success('Application submitted successfully!');
        setHasApplied(true);
        setApplyModalOpen(false);
        form.resetFields();
      } else {
        message.error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      message.error('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <Result
        status="404"
        title="Announcement Not Found"
        subTitle="This announcement may have been removed or expired."
        extra={
          <Button type="primary" onClick={() => router.push('/announcements')}>
            Back to Announcements
          </Button>
        }
      />
    );
  }

  const isCastingCall = announcement.announcement_type === 'casting_call';
  const hasDeadline = announcement.application_deadline;
  const deadlinePassed = hasDeadline && new Date(announcement.application_deadline!) < new Date();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {announcement.is_pinned && (
              <PushpinOutlined className="text-[#B91C1C]" />
            )}
            <Tag color={isCastingCall ? 'gold' : 'blue'}>
              {isCastingCall ? 'Casting Call' : 'General'}
            </Tag>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <Title level={3} className="mb-2">
          {announcement.title}
        </Title>

        <Space className="mb-4 text-gray-500">
          <CalendarOutlined />
          <Text type="secondary">
            Posted {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}
          </Text>
        </Space>

        <Divider className="my-4" />

        <div className="prose max-w-none">
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {announcement.content}
          </Paragraph>
        </div>

        {/* Casting Call Specific */}
        {isCastingCall && (
          <>
            <Divider className="my-4" />

            {hasDeadline && (
              <Alert
                type={deadlinePassed ? 'error' : 'info'}
                message={
                  deadlinePassed
                    ? 'Application deadline has passed'
                    : `Application Deadline: ${new Date(announcement.application_deadline!).toLocaleDateString()}`
                }
                icon={<CalendarOutlined />}
                showIcon
                className="mb-4"
              />
            )}

            {hasApplied ? (
              <Alert
                type="success"
                message="Application Submitted"
                description="You have already applied to this casting call. We'll be in touch!"
                icon={<CheckCircleOutlined />}
                showIcon
              />
            ) : !deadlinePassed ? (
              <div className="text-center">
                <Button
                  type="primary"
                  size="large"
                  icon={<StarOutlined />}
                  onClick={() => setApplyModalOpen(true)}
                >
                  Apply Now
                </Button>
              </div>
            ) : null}
          </>
        )}
      </Card>

      {/* Apply Modal */}
      <Modal
        title="Apply to Casting Call"
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApply}
          requiredMark={false}
        >
          <Form.Item
            name="message"
            label="Tell us about yourself"
            rules={[{ required: true, message: 'Please write a message' }]}
          >
            <TextArea
              rows={4}
              placeholder="Why are you interested in this opportunity? What experience do you have?"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Contact Number"
            extra="Optional - in case we need to reach you quickly"
          >
            <Input placeholder="e.g., 021 123 4567" />
          </Form.Item>

          <Form.Item
            name="portfolio_url"
            label="Portfolio / Social Media Link"
            extra="Optional - share your work or social media"
          >
            <Input placeholder="e.g., https://instagram.com/yourprofile" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setApplyModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<SendOutlined />}
              >
                Submit Application
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
