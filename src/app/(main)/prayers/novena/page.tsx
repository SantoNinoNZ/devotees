'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Button, Empty, List, Spin, Tag, Avatar } from 'antd';
import { BookOutlined, ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { novenasApi, type NovenaWithProgress } from '@/lib/supabase-api';
import type { Novena } from '@/types';

const { Title, Text, Paragraph } = Typography;

export default function NovenaListPage() {
  const router = useRouter();
  const [novenas, setNovenas] = useState<Novena[]>([]);
  const [activeNovenas, setActiveNovenas] = useState<NovenaWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadNovenas();
  }, [isAuthenticated]);

  const loadNovenas = async () => {
    setLoading(true);
    const [allNovenas, active] = await Promise.all([
      novenasApi.getNovenas(),
      isAuthenticated ? novenasApi.getActiveNovenas() : Promise.resolve([]),
    ]);
    setNovenas(allNovenas);
    setActiveNovenas(active);
    setLoading(false);
  };

  const getActiveProgress = (novenaId: string): NovenaWithProgress | undefined => {
    return activeNovenas.find((n) => n.id === novenaId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/prayers')}
          type="text"
        />
        <Title level={4} className="mb-0">
          Novena Prayers
        </Title>
      </div>

      <Paragraph type="secondary">
        A novena is a form of worship consisting of special prayers or services on nine
        successive days. Choose a novena to begin your spiritual journey.
      </Paragraph>

      <Spin spinning={loading}>
        {novenas.length === 0 && !loading ? (
          <Card>
            <Empty
              description="No novenas available"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <List
            dataSource={novenas}
            renderItem={(novena) => {
              const activeProgress = getActiveProgress(novena.id);
              const isActive = !!activeProgress;

              return (
                <Link
                  href={
                    isActive && activeProgress?.user_progress
                      ? `/prayers/novena/${novena.id}?progress=${activeProgress.user_progress.id}`
                      : `/prayers/novena/${novena.id}`
                  }
                  key={novena.id}
                >
                  <Card hoverable className="mb-3">
                    <div className="flex gap-4">
                      <Avatar
                        size={64}
                        className="bg-gradient-to-br from-amber-400 to-orange-500 flex-shrink-0"
                        icon={<BookOutlined />}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Title level={5} className="mb-1">
                              {novena.title}
                            </Title>
                            {isActive && (
                              <Tag color="green" icon={<CheckCircleFilled />}>
                                Day {activeProgress?.user_progress?.current_day || 1} of{' '}
                                {novena.total_days}
                              </Tag>
                            )}
                          </div>
                          <Tag>{novena.total_days} Days</Tag>
                        </div>

                        {novena.description && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 2 }}
                            className="mb-0 mt-2 text-sm"
                          >
                            {novena.description}
                          </Paragraph>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            }}
          />
        )}
      </Spin>
    </div>
  );
}
