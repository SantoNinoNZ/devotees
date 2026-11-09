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
import type { Area, ProfileWithRoles } from '@/types';

const { Title, Text } = Typography;

interface ProfileFormValues {
  display_name: string;
  phone: string;
  area_id: string | undefined;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, user, isLoading, refreshProfile } = useAuth();
  const [form] = Form.useForm<ProfileFormValues>();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(true);

  const effectiveProfile: ProfileWithRoles | null = profile || (user ? {
    id: user.id,
    email: user.email || '',
    display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Devotee',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    phone: null,
    area_id: null,
    is_active: true,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
    area: null,
    roles: [],
  } : null);

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
    if (effectiveProfile) {
      form.setFieldsValue({
        display_name: effectiveProfile.display_name,
        phone: effectiveProfile.phone || '',
        area_id: effectiveProfile.area_id || undefined,
      });
    }
  }, [effectiveProfile, form]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spin size="large" />
      </div>
    );
  }

  if (!effectiveProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Text type="secondary">Please sign in to edit your profile.</Text>
        <Button type="primary" onClick={() => router.push('/login')}>
          Sign In
        </Button>
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
            src={effectiveProfile.avatar_url || undefined}
            icon={!effectiveProfile.avatar_url && <UserOutlined />}
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
            <Input value={effectiveProfile.email} disabled size="large" />
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
