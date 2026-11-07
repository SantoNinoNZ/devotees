import NovenaDetail from './NovenaDetail';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function NovenaDetailPage() {
  return <NovenaDetail />;
}
