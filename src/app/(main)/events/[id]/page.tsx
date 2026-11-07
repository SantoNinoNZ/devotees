import EventDetail from './EventDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function EventDetailPage() {
  return <EventDetail />;
}
