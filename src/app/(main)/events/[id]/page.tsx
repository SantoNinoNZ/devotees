import EventDetail from './EventDetail';

export async function generateStaticParams() {
  // No paths pre-generated - navigation works via client-side routing
  return [];
}

export default function EventDetailPage() {
  return <EventDetail />;
}
