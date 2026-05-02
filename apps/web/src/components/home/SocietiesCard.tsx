import Link from "next/link";
import { Society } from "./types";

type SocietiesCardProps = {
  societies: Society[];
  linkBase?: string;
};

export function SocietiesCard({
  societies,
  linkBase = "/dashboard/super-admin/societies",
}: SocietiesCardProps) {
  return (
    <section className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-(--muted)">
            Registered
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-foreground">
            Societies
          </h2>
        </div>
        <span className="rounded-full bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent)">
          {societies.length} total
        </span>
      </div>
      {societies.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-(--line) bg-background px-4 py-8 text-center">
          <p className="text-sm text-(--muted)">
            No societies registered yet. Create one above.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {societies.map((society) => (
            <Link
              key={society.id}
              href={`${linkBase}/${society.id}`}
              className="group rounded-xl border border-(--line) bg-background px-4 py-3 transition-all hover:border-(--accent)/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent)/10 transition-colors group-hover:bg-(--accent)/20">
                  <svg
                    className="h-4 w-4 text-(--accent)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                    />
                  </svg>
                </div>
                <svg
                  className="h-4 w-4 text-(--muted) opacity-0 transition-opacity group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
              <p className="mt-2 font-semibold text-foreground">
                {society.name}
              </p>
              <p className="mt-0.5 text-sm text-(--muted)">
                {society.location}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
