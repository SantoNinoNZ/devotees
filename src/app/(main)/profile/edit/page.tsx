'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Button,
  Avatar,
  Space,
  message,
  Spin,
} from 'antd';
import { UserOutlined, ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { profileApi, areasApi } from '@/lib/supabase-api';
import type { Area } from '@/types';

const { Title, Text } = Typography;

interface ProfileFormValues {
  display_name: string;
  phone: string;
  area_id: string | undefined;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [form] = Form.useForm<ProfileFormValues>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(true);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const data = await areasApi.getAreas();
        setAreas(data);
      } catch (error) {
        console.error('Error loading areas:', error);
      } finally {
        setLoadingAreas(false);
      }
    };
    loadAreas();
  }, []);

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        display_name: profile.display_name,
        phone: profile.phone || '',
        area_id: profile.area_id || undefined,
      });
    }
  }, [profile, form]);

  const handleSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const success = await profileApi.updateProfile({
        display_name: values.display_name,
        phone: values.phone || undefined,
        area_id: values.area_id || undefined,
      });

      if (success) {
        message.success('Profile updated successfully');
        await refreshProfile();
        router.push('/profile');
      } else {
        message.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        />
        <Title level={4} className="mb-0">
          Edit Profile
        </Title>
      </div>

      <Card>
        <div className="flex flex-col items-center mb-6">
          <Avatar
            size={96}
            src={profile.avatar_url}
            icon={!profile.avatar_url && <UserOutlined />}
            className="bg-[#B91C1C]"
          />
          <Text type="secondary" className="mt-2">
            Profile photo is managed through your Google account
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="display_name"
            label="Display Name"
            rules={[{ required: true, message: 'Please enter your display name' }]}
          >
            <Input placeholder="Your name" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
          >
            <Input value={profile.email} disabled size="large" />
            <Text type="secondary" className="text-xs mt-1 block">
              Email cannot be changed
            </Text>
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
          >
            <Input placeholder="e.g., 021 123 4567" size="large" />
          </Form.Item>

          <Form.Item
            name="area_id"
            label="Area"
            extra="Select your area to connect with local community members"
          >
            <Select
              placeholder="Select your area"
              size="large"
              loading={loadingAreas}
              allowClear
              options={areas.map((area) => ({
                value: area.id,
                label: area.name,
              }))}
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-6">
            <Space className="w-full justify-end">
              <Button onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
