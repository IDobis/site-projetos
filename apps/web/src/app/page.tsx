import { Suspense } from 'react';
import { ListHeading } from '@/components/ListHeading';
import { Metrics } from '@/components/Metrics';
import { ProjectList } from '@/components/ProjectList';
import { ListSkeleton } from '@/components/States';

export default function HomePage() {
  return (
    <section>
      <Suspense fallback={<ListSkeleton />}>
        <ListHeading />
        <Metrics />
        <ProjectList />
      </Suspense>
    </section>
  );
}
