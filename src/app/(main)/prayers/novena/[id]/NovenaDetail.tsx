'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Typography,
  Button,
  Spin,
  Result,
  Steps,
  Divider,
  Modal,
  message,
  Space,
  Progress,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  PlayCircleOutlined,
  ArrowRightOutlined,
  TrophyFilled,
} from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import { novenasApi, type NovenaWithProgress } from '@/lib/supabase-api';

const { Title, Text, Paragraph } = Typography;

interface NovenaDay {
  day: number;
  title: string;
  theme: string;
  opening_prayer?: string;
  scripture?: string;
  reflection?: string;
  prayer?: string;
  closing_prayer?: string;
}

export default function NovenaDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const novenaId = params?.id as string;
  const progressId = searchParams.get('progress');

  const [novena, setNovena] = useState<NovenaWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [startLoading, setStartLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [userProgressId, setUserProgressId] = useState<string | null>(progressId);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (novenaId) {
      loadNovena();
    }
  }, [novenaId]);

  useEffect(() => {
    // Set selected day based on user progress
    if (novena?.user_progress) {
      setSelectedDay(novena.user_progress.current_day);
      setUserProgressId(novena.user_progress.id);
    }
  }, [novena]);

  const loadNovena = async () => {
    setLoading(true);
    const data = await novenasApi.getNovena(novenaId);
    setNovena(data);
    setLoading(false);
  };

  const handleStartNovena = async () => {
    if (!isAuthenticated) {
      message.info('Please sign in to start tracking your novena');
      return;
    }

    setStartLoading(true);
    const newProgressId = await novenasApi.startNovena(novenaId);

    if (newProgressId) {
      setUserProgressId(newProgressId);
      message.success('Novena started! Begin with Day 1.');
      await loadNovena();
      setSelectedDay(1);
    } else {
      message.error('Failed to start novena');
    }
    setStartLoading(false);
  };

  const handleCompleteDay = async () => {
    if (!userProgressId) {
      message.info('Please start the novena first');
      return;
    }

    setCompleteLoading(true);
    const success = await novenasApi.completeDay(userProgressId, selectedDay);

    if (success) {
      const totalDays = novena?.total_days || 9;

      if (selectedDay >= totalDays) {
        Modal.success({
          title: 'Congratulations!',
          icon: <TrophyFilled style={{ color: '#D97706' }} />,
          content: (
            <div className="text-center">
              <Paragraph>
                You have completed the {novena?.title}! May your prayers be heard and
                answered.
              </Paragraph>
              <Text type="secondary">
                Pit Señor!
              </Text>
            </div>
          ),
          okText: 'Amen',
          onOk: () => router.push('/prayers'),
        });
      } else {
        message.success(`Day ${selectedDay} completed!`);
        setSelectedDay(selectedDay + 1);
        await loadNovena();
      }
    } else {
      message.error('Failed to mark day as complete');
    }
    setCompleteLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (!novena) {
    return (
      <Result
        status="404"
        title="Novena not found"
        subTitle="This novena may have been removed."
        extra={
          <Button type="primary" onClick={() => router.push('/prayers/novena')}>
            Browse Novenas
          </Button>
        }
      />
    );
  }

  // Parse prayers JSON
  const prayers: NovenaDay[] =
    typeof novena.prayers === 'string'
      ? JSON.parse(novena.prayers)
      : Array.isArray(novena.prayers)
        ? novena.prayers
        : [];

  const currentDayPrayer = prayers.find((p) => p.day === selectedDay);
  const progress = novena.user_progress;
  const currentDay = progress?.current_day || 1;
  const totalDays = novena.total_days || 9;
  const isStarted = !!userProgressId;
  const canCompleteDay = isStarted && selectedDay === currentDay;
  const isCompleted = progress?.completed_at !== null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/prayers/novena')}
          type="text"
        />
        <Title level={4} className="mb-0">
          {novena.title}
        </Title>
      </div>

      {/* Progress Card */}
      {isStarted && !isCompleted && (
        <Card size="small" className="bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <Text strong>Your Progress</Text>
              <br />
              <Text type="secondary">
                Day {currentDay} of {totalDays}
              </Text>
            </div>
            <Progress
              type="circle"
              size={60}
              percent={Math.round(((currentDay - 1) / totalDays) * 100)}
              format={() => `${currentDay - 1}/${totalDays}`}
            />
          </div>
        </Card>
      )}

      {isCompleted && (
        <Card size="small" className="bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircleFilled className="text-green-500 text-xl" />
            <div>
              <Text strong className="text-green-700">
                Novena Completed!
              </Text>
              <br />
              <Text type="secondary" className="text-xs">
                Completed on{' '}
                {new Date(progress?.completed_at || '').toLocaleDateString('en-NZ')}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Day Steps */}
      <Card title="Select a Day" size="small">
        <Steps
          current={selectedDay - 1}
          onChange={(step) => setSelectedDay(step + 1)}
          items={Array.from({ length: totalDays }, (_, i) => {
            const dayNum = i + 1;
            const dayPrayer = prayers.find((p) => p.day === dayNum);
            const isCompleted = isStarted && dayNum < currentDay;

            return {
              title: `Day ${dayNum}`,
              description: dayPrayer?.theme,
              status: isCompleted ? 'finish' : dayNum === selectedDay ? 'process' : 'wait',
              icon: isCompleted ? <CheckCircleFilled /> : undefined,
            };
          })}
          direction="vertical"
          size="small"
          className="max-h-64 overflow-y-auto"
        />
      </Card>

      {/* Prayer Content */}
      {currentDayPrayer ? (
        <Card
          title={
            <div>
              <Text type="secondary" className="text-xs">
                Day {selectedDay} • {currentDayPrayer.theme}
              </Text>
              <br />
              <span>{currentDayPrayer.title}</span>
            </div>
          }
        >
          <div className="space-y-6">
            {currentDayPrayer.opening_prayer && (
              <div>
                <Title level={5}>Opening Prayer</Title>
                <Paragraph className="whitespace-pre-wrap">
                  {currentDayPrayer.opening_prayer}
                </Paragraph>
              </div>
            )}

            {currentDayPrayer.scripture && (
              <div>
                <Title level={5}>Scripture Reading</Title>
                <Card size="small" className="bg-gray-50 border-l-4 border-l-amber-500">
                  <Paragraph className="italic whitespace-pre-wrap mb-0">
                    {currentDayPrayer.scripture}
                  </Paragraph>
                </Card>
              </div>
            )}

            {currentDayPrayer.reflection && (
              <div>
                <Title level={5}>Reflection</Title>
                <Paragraph className="whitespace-pre-wrap">
                  {currentDayPrayer.reflection}
                </Paragraph>
              </div>
            )}

            {currentDayPrayer.prayer && (
              <div>
                <Title level={5}>Prayer</Title>
                <Paragraph className="whitespace-pre-wrap">
                  {currentDayPrayer.prayer}
                </Paragraph>
              </div>
            )}

            {currentDayPrayer.closing_prayer && (
              <div>
                <Title level={5}>Closing Prayer</Title>
                <Paragraph className="whitespace-pre-wrap">
                  {currentDayPrayer.closing_prayer}
                </Paragraph>
              </div>
            )}

            <Divider />

            {/* Action Buttons */}
            <Space className="w-full justify-center">
              {!isStarted ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartNovena}
                  loading={startLoading}
                >
                  Start Novena
                </Button>
              ) : canCompleteDay ? (
                <Button
                  type="primary"
                  size="large"
                  icon={
                    selectedDay === totalDays ? (
                      <TrophyFilled />
                    ) : (
                      <CheckCircleFilled />
                    )
                  }
                  onClick={handleCompleteDay}
                  loading={completeLoading}
                >
                  {selectedDay === totalDays
                    ? 'Complete Novena'
                    : `Complete Day ${selectedDay}`}
                </Button>
              ) : selectedDay < currentDay ? (
                <Button
                  type="default"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={() => setSelectedDay(currentDay)}
                >
                  Go to Day {currentDay}
                </Button>
              ) : (
                <Text type="secondary">
                  Complete Day {currentDay} first to unlock this day
                </Text>
              )}
            </Space>
          </div>
        </Card>
      ) : (
        <Card>
          <Empty description="Prayer content not available for this day" />
        </Card>
      )}
    </div>
  );
}
