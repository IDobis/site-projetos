import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight text-ink">
          Projetos
        </Link>
        <Link
          href="/projects/new"
          className="rounded-full bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Novo projeto
        </Link>
      </div>
    </header>
  );
}
