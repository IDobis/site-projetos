import type { Metadata } from 'next';
import { ProjectForm } from '@/components/ProjectForm';

export const metadata: Metadata = {
  title: 'Novo projeto',
};

export default function NewProjectPage() {
  return <ProjectForm mode="create" />;
}
