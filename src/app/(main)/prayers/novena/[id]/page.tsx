import NovenaDetail from './NovenaDetail';

export async function generateStaticParams() {
  // No paths pre-generated - navigation works via client-side routing
  return [];
}

export default function NovenaDetailPage() {
  return <NovenaDetail />;
}
