'use client';

import { Calendar, Badge, Card, Typography, Space, Tag } from 'antd';
import type { CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import Link from 'next/link';
import type { EventWithDetails } from '@/lib/supabase-api';

const { Text } = Typography;

interface EventCalendarProps {
  events: EventWithDetails[];
}

const CATEGORY_COLORS: Record<string, string> = {
  sinulog: '#faad14',
  novena: '#722ed1',
  community: '#1890ff',
  practice: '#52c41a',
  mass: '#13c2c2',
  procession: '#fa8c16',
};

export default function EventCalendar({ events }: EventCalendarProps) {
  const getEventsForDate = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return events.filter((event) => {
      const startDate = event.event_start_date
        ? dayjs(event.event_start_date).format('YYYY-MM-DD')
        : null;
      const endDate = event.event_end_date
        ? dayjs(event.event_end_date).format('YYYY-MM-DD')
        : startDate;

      if (!startDate) return false;

      // Check if the date falls within the event range
      return dateStr >= startDate && dateStr <= (endDate || startDate);
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const dayEvents = getEventsForDate(value);
    if (dayEvents.length === 0) return null;

    return (
      <ul className="m-0 p-0 list-none">
        {dayEvents.slice(0, 3).map((event) => (
          <li key={event.id} className="mb-1">
            <Link href={`/events/${event.id}`}>
              <Badge
                color={CATEGORY_COLORS[event.category || ''] || '#1890ff'}
                text={
                  <Text
                    ellipsis
                    className="text-xs hover:text-[#B91C1C]"
                    style={{ maxWidth: '100%' }}
                  >
                    {event.title}
                  </Text>
                }
              />
            </Link>
          </li>
        ))}
        {dayEvents.length > 3 && (
          <li>
            <Text type="secondary" className="text-xs">
              +{dayEvents.length - 3} more
            </Text>
          </li>
        )}
      </ul>
    );
  };

  const monthCellRender = (value: Dayjs) => {
    const monthEvents = events.filter((event) => {
      if (!event.event_start_date) return false;
      const eventDate = dayjs(event.event_start_date);
      return eventDate.month() === value.month() && eventDate.year() === value.year();
    });

    if (monthEvents.length === 0) return null;

    return (
      <div className="text-center">
        <Badge count={monthEvents.length} style={{ backgroundColor: '#B91C1C' }} />
      </div>
    );
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    if (info.type === 'month') return monthCellRender(current);
    return info.originNode;
  };

  return (
    <Card className="event-calendar">
      <div className="mb-4">
        <Space wrap>
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <Tag key={category} color={color}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Tag>
          ))}
        </Space>
      </div>
      <Calendar cellRender={cellRender} />
      <style jsx global>{`
        .event-calendar .ant-picker-calendar-date-content {
          height: 60px;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .event-calendar .ant-picker-calendar-date-content {
            height: 40px;
          }
          .event-calendar .ant-picker-calendar-date-value {
            font-size: 12px;
          }
        }
      `}</style>
    </Card>
  );
}
