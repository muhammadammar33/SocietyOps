import Link from "next/link";

const features = [
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    ),
    title: "Society Management",
    description:
      "Onboard new societies in minutes. Configure rules, zones, and admin access from one control panel.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    ),
    title: "Resident & House Tracking",
    description:
      "Maintain complete records of residents, ownership, occupancy status, and contact details.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
      />
    ),
    title: "Billing & Collections",
    description:
      "Automate recurring maintenance bills, track payment status, and reduce manual follow-ups.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    ),
    title: "Complaints & Incidents",
    description:
      "Give residents a clear channel to raise issues. Track status from open to resolved.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    ),
    title: "Visitor Management",
    description:
      "Log visitor entries and exits. Keep a digital record for every gate interaction.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    ),
    title: "Notifications",
    description:
      "Send announcements and alerts to residents instantly. Keep everyone in the loop.",
  },
];

export function LandingSection() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-20 text-center sm:px-10 sm:py-28">
        <span className="mb-5 inline-flex rounded-full border border-(--line) bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent) shadow-sm backdrop-blur-sm">
          End-to-End Society Operations
        </span>
        <h2 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          The operating system for{" "}
          <span className="text-(--accent)">modern communities</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-(--muted) sm:text-lg">
          Move from WhatsApp groups and Excel sheets to a structured digital
          platform. Manage societies, residents, billing, complaints, and
          security — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-(--accent) px-7 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-(--line) bg-white/80 px-7 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-white"
          >
            See Features
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid w-full max-w-2xl grid-cols-3 gap-4 rounded-2xl border border-(--line) bg-white/70 p-5 shadow-sm backdrop-blur-sm">
          {[
            { value: "100%", label: "Digital Records" },
            { value: "5 min", label: "Society Setup" },
            { value: "24/7", label: "Accessible" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-(--accent)">{stat.value}</p>
              <p className="mt-0.5 text-xs text-(--muted)">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section
        id="features"
        className="border-t border-(--line) bg-white/50 px-6 py-16 sm:px-10 sm:py-20"
      >
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-(--accent)">
            Platform Capabilities
          </p>
          <h3 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything your community needs
          </h3>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-(--line) bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent)/10">
                  <svg
                    className="h-5 w-5 text-(--accent)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h4 className="font-semibold text-foreground">
                  {feature.title}
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-(--muted)">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t border-(--line) px-6 py-16 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to digitize your society?
          </h3>
          <p className="text-sm leading-relaxed text-(--muted) sm:text-base">
            Sign in to your dashboard and start managing your community
            operations the modern way.
          </p>
          <Link
            href="/login"
            className="rounded-xl bg-(--accent) px-8 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          >
            Sign In to Dashboard
          </Link>
        </div>
      </section>
    </>
  );
}
