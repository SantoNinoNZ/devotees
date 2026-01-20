import RequestDetail from './RequestDetail';

export async function generateStaticParams() {
  // No paths pre-generated - navigation works via client-side routing
  return [];
}

export default function RequestDetailPage() {
  return <RequestDetail />;
}
