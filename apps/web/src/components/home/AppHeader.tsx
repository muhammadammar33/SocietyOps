import Link from "next/link";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
};

export function AppHeader({
  title = "SocietyOps",
  subtitle = "Digital operations platform for housing communities in Pakistan",
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-(--line) bg-white/70 px-6 py-4 backdrop-blur-sm sm:px-10 sm:py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--accent) shadow-sm">
          <svg
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="hidden text-xs text-(--muted) sm:block">{subtitle}</p>
        </div>
      </div>
      <nav className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Sign In
        </Link>
      </nav>
    </header>
  );
}
