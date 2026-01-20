'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Typography,
  Button,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  message,
  Space,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  HeartOutlined,
  HomeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useAuth } from '@/hooks/useAuth';
import { requestsApi, areasApi } from '@/lib/supabase-api';
import type { RequestType, Area } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const REQUEST_TYPES: { value: RequestType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'prayer',
    label: 'Prayer Request',
    icon: <HeartOutlined />,
    description: 'Submit a prayer intention for our community to pray for',
  },
  {
    value: 'house_visit',
    label: 'House Visit',
    icon: <HomeOutlined />,
    description: 'Request a home blessing or visit from our Hermanos',
  },
  {
    value: 'blessing',
    label: 'Blessing Request',
    icon: <HeartOutlined />,
    description: 'Request a blessing for a special occasion or item',
  },
  {
    value: 'counseling',
    label: 'Spiritual Counseling',
    icon: <HeartOutlined />,
    description: 'Request spiritual guidance or counseling',
  },
  {
    value: 'other',
    label: 'Other Request',
    icon: <HeartOutlined />,
    description: 'Any other type of request',
  },
];

const TIME_SLOTS = [
  'Morning (9AM - 12PM)',
  'Afternoon (12PM - 5PM)',
  'Evening (5PM - 8PM)',
  'Weekend Only',
  'Flexible',
];

interface FormValues {
  request_type: RequestType;
  title: string;
  description: string;
  is_urgent: boolean;
  is_private: boolean;
  visit_address?: string;
  preferred_date?: Dayjs;
  preferred_time_slot?: string;
  area_id?: string;
}

export default function RequestFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') as RequestType | null;

  const [form] = Form.useForm<FormValues>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>(initialType || 'prayer');

  const { isAuthenticated, profile } = useAuth();

  useEffect(() => {
    loadAreas();
    if (profile?.area_id) {
      form.setFieldValue('area_id', profile.area_id);
    }
  }, [profile]);

  useEffect(() => {
    if (initialType) {
      form.setFieldValue('request_type', initialType);
      setRequestType(initialType);
    }
  }, [initialType]);

  const loadAreas = async () => {
    const data = await areasApi.getAreas();
    setAreas(data);
  };

  const handleTypeChange = (value: RequestType) => {
    setRequestType(value);
  };

  const handleSubmit = async (values: FormValues) => {
    if (!isAuthenticated) {
      message.error('Please sign in to submit a request');
      return;
    }

    setLoading(true);

    const requestId = await requestsApi.submitRequest({
      request_type: values.request_type,
      title: values.title,
      description: values.description,
      is_urgent: values.is_urgent || false,
      is_private: values.is_private || false,
      visit_address: values.visit_address,
      preferred_date: values.preferred_date?.format('YYYY-MM-DD'),
      preferred_time_slot: values.preferred_time_slot,
      area_id: values.area_id,
    });

    if (requestId) {
      message.success('Request submitted successfully');
      router.push(`/prayers/request/${requestId}`);
    } else {
      message.error('Failed to submit request');
    }

    setLoading(false);
  };

  const showAddressField = ['house_visit', 'blessing'].includes(requestType);
  const showDateFields = ['house_visit', 'blessing', 'counseling'].includes(requestType);

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/prayers')}
            type="text"
          />
          <Title level={4} className="mb-0">
            Submit a Request
          </Title>
        </div>

        <Alert
          message="Sign in Required"
          description="Please sign in to submit a prayer or visit request. Your request will be handled confidentially by our community leaders."
          type="info"
          showIcon
        />

        <Button type="primary" onClick={() => router.push('/login')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/prayers')}
          type="text"
        />
        <Title level={4} className="mb-0">
          Submit a Request
        </Title>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            request_type: initialType || 'prayer',
            is_urgent: false,
            is_private: true,
          }}
        >
          {/* Request Type */}
          <Form.Item
            name="request_type"
            label="Type of Request"
            rules={[{ required: true, message: 'Please select a request type' }]}
          >
            <Select onChange={handleTypeChange}>
              {REQUEST_TYPES.map((type) => (
                <Select.Option key={type.value} value={type.value}>
                  <Space>
                    {type.icon}
                    <span>{type.label}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Paragraph type="secondary" className="text-sm -mt-4 mb-4">
            {REQUEST_TYPES.find((t) => t.value === requestType)?.description}
          </Paragraph>

          {/* Title */}
          <Form.Item
            name="title"
            label="Subject"
            rules={[
              { required: true, message: 'Please enter a subject' },
              { max: 100, message: 'Subject must be less than 100 characters' },
            ]}
          >
            <Input placeholder="Brief subject of your request" maxLength={100} />
          </Form.Item>

          {/* Description */}
          <Form.Item
            name="description"
            label="Details"
            rules={[
              { required: true, message: 'Please provide details about your request' },
              { min: 20, message: 'Please provide more details (at least 20 characters)' },
            ]}
          >
            <TextArea
              rows={5}
              placeholder={
                requestType === 'prayer'
                  ? 'Share your prayer intention...'
                  : requestType === 'house_visit'
                    ? 'Please describe the purpose of the visit and any special requirements...'
                    : 'Please provide details about your request...'
              }
              showCount
              maxLength={2000}
            />
          </Form.Item>

          {/* Address for house visits */}
          {showAddressField && (
            <Form.Item
              name="visit_address"
              label="Address"
              rules={[
                {
                  required: showAddressField,
                  message: 'Please provide your address',
                },
              ]}
            >
              <TextArea
                rows={2}
                placeholder="Full address including suburb and city"
              />
            </Form.Item>
          )}

          {/* Preferred Date & Time for visits */}
          {showDateFields && (
            <>
              <Form.Item name="preferred_date" label="Preferred Date">
                <DatePicker
                  className="w-full"
                  placeholder="Select preferred date"
                  disabledDate={(current) =>
                    current && current.isBefore(dayjs().startOf('day'))
                  }
                />
              </Form.Item>

              <Form.Item name="preferred_time_slot" label="Preferred Time">
                <Select placeholder="Select preferred time slot">
                  {TIME_SLOTS.map((slot) => (
                    <Select.Option key={slot} value={slot}>
                      {slot}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          {/* Area */}
          <Form.Item name="area_id" label="Area">
            <Select placeholder="Select your area (helps us assign the right coordinator)">
              {areas.map((area) => (
                <Select.Option key={area.id} value={area.id}>
                  {area.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Urgent Flag */}
          <Form.Item name="is_urgent" valuePropName="checked">
            <div className="flex items-center gap-2">
              <Switch />
              <div>
                <Text strong>Mark as Urgent</Text>
                <br />
                <Text type="secondary" className="text-xs">
                  Check this if this request requires immediate attention
                </Text>
              </div>
            </div>
          </Form.Item>

          {/* Private Flag */}
          <Form.Item name="is_private" valuePropName="checked">
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              <div>
                <Text strong>Keep Private</Text>
                <br />
                <Text type="secondary" className="text-xs">
                  Only coordinators and Hermanos can see the details
                </Text>
              </div>
            </div>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              block
              size="large"
            >
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
