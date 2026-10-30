type IconProps = { className?: string };

function Stroke({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconSun() {
  return (
    <Stroke>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </Stroke>
  );
}

export function IconMoon() {
  return (
    <Stroke>
      <path d="M16 3.6A7.8 7.8 0 1 0 20.4 14 6.4 6.4 0 0 1 16 3.6z" />
    </Stroke>
  );
}

export function IconIdea() {
  return (
    <Stroke>
      <path d="M12 3.2 13.3 10.7 20.8 12 13.3 13.3 12 20.8 10.7 13.3 3.2 12 10.7 10.7Z" />
    </Stroke>
  );
}

export function IconProgress() {
  return (
    <Stroke>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 5a7 7 0 0 1 7 7" />
    </Stroke>
  );
}

export function IconPaused() {
  return (
    <Stroke>
      <path d="M9 6v12M15 6v12" />
    </Stroke>
  );
}

export function IconDone() {
  return (
    <Stroke>
      <path d="M5 12.5 9.2 17 19 7" />
    </Stroke>
  );
}
