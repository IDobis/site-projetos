import { Suspense } from 'react';
import { ProjectList } from '@/components/ProjectList';
import { ListSkeleton } from '@/components/States';

export default function HomePage() {
  return (
    <section>
      <header className="intro">
        <h1 className="title">Seus projetos</h1>
        <p className="lede">Ideias, links e o andamento do que você faz.</p>
      </header>
      <Suspense fallback={<ListSkeleton />}>
        <ProjectList />
      </Suspense>
    </section>
  );
}
