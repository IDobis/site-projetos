import { Suspense } from 'react';
import { ProjectList } from '@/components/ProjectList';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-stone-600" role="status">
          Carregando projetos...
        </p>
      }
    >
      <ProjectList />
    </Suspense>
  );
}
