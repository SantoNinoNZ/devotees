import RequestDetail from './RequestDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function RequestDetailPage() {
  return <RequestDetail />;
}
