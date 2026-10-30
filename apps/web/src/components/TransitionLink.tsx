'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComponentProps, MouseEvent } from 'react';
import { withViewTransition } from '@/lib/navigate';

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    event.preventDefault();
    withViewTransition(() => router.push(href));
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
