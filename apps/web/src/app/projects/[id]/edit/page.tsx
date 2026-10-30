import type { Metadata } from 'next';
import { EditProject } from '@/components/EditProject';

export const metadata: Metadata = {
  title: 'Editar projeto',
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditProject id={id} />;
}
