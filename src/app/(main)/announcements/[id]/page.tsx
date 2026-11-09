import AnnouncementDetail from './AnnouncementDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function AnnouncementDetailPage() {
  return <AnnouncementDetail />;
}
