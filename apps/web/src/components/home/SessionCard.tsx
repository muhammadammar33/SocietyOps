import { User } from "./types";

type SessionCardProps = {
  tokenPresent: boolean;
  message: string;
  user: User | null;
  onLogout: () => void;
};

export function SessionCard({
  tokenPresent,
  message,
  user,
  onLogout,
}: SessionCardProps) {
  return (
    <section className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-(--muted)">
            Current Session
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-foreground">
            Session Info
          </h2>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-(--line) bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:opacity-50"
          disabled={!tokenPresent}
        >
          Sign Out
        </button>
      </div>
      {message ? (
        <p className="mt-3 rounded-xl bg-background px-4 py-2.5 text-sm text-(--muted)">
          {message}
        </p>
      ) : null}
      {user ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { label: "Name", value: user.name },
            { label: "Phone", value: user.phone },
            { label: "Role", value: user.role },
            { label: "Society ID", value: user.societyId ?? "N/A" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-(--line) bg-background px-4 py-3"
            >
              <p className="text-xs font-medium text-(--muted)">{item.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
