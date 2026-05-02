"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Billing,
  Complaint,
  House,
  Resident,
  Society,
  VisitorLog,
} from "../../../../../components/home/types";
import { createApiClient } from "../../../../../lib/api";

const TOKEN_KEY = "societyops.token";

const STATUS_COLORS: Record<string, string> = {
  OCCUPIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  VACANT: "bg-amber-50 text-amber-700 border-amber-200",
  FOR_SALE: "bg-purple-50 text-purple-700 border-purple-200",
  FOR_RENT: "bg-sky-50 text-sky-700 border-sky-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  OPEN: "bg-red-50 text-red-700 border-red-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-50 text-slate-600 border-slate-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status] ?? "bg-background border-(--line) text-(--muted)"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Tab = "houses" | "residents" | "billing" | "complaints" | "visitors";

const TABS: { key: Tab; label: string }[] = [
  { key: "houses", label: "Houses" },
  { key: "residents", label: "Residents" },
  { key: "billing", label: "Billing" },
  { key: "complaints", label: "Complaints" },
  { key: "visitors", label: "Visitors" },
];

export default function SocietyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
    [],
  );
  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const [token, setToken] = useState("");
  const [society, setSociety] = useState<Society | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("houses");

  const loadData = useCallback(
    async (bearer: string) => {
      setIsLoading(true);
      setError("");
      try {
        const [
          soc,
          allHouses,
          allResidents,
          allBillings,
          allComplaints,
          allVisitors,
        ] = await Promise.all([
          api.society(bearer, id),
          api.houses(bearer),
          api.residents(bearer),
          api.billings(bearer),
          api.complaints(bearer),
          api.visitors(bearer),
        ]);

        setSociety(soc);

        const societyHouses = allHouses.filter((h) => h.societyId === id);
        const houseIds = new Set(societyHouses.map((h) => h.id));

        setHouses(societyHouses);
        setResidents(allResidents.filter((r) => r.societyId === id));
        setBillings(allBillings.filter((b) => houseIds.has(b.houseId)));
        setComplaints(allComplaints.filter((c) => houseIds.has(c.houseId)));
        setVisitors(allVisitors.filter((v) => houseIds.has(v.houseId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    },
    [api, id],
  );

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      router.replace("/login");
      return;
    }
    setToken(stored);
    void loadData(stored);
  }, [loadData, router]);

  // Derived stats
  const occupiedHouses = houses.filter((h) => h.status === "OCCUPIED").length;
  const pendingBills = billings.filter(
    (b) => b.status === "PENDING" || b.status === "OVERDUE",
  ).length;
  const openComplaints = complaints.filter(
    (c) => c.status === "OPEN" || c.status === "IN_PROGRESS",
  ).length;

  const houseMap = useMemo(
    () =>
      new Map(
        houses.map((h) => [h.id, `Block ${h.block} - #${h.houseNumber}`]),
      ),
    [houses],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-(--line) bg-white px-6 py-4 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--line) border-t-(--accent)" />
          <p className="text-sm font-medium text-(--muted)">
            Loading society details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">Failed to load</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            className="mt-4 rounded-xl bg-(--accent) px-5 py-2 text-sm font-semibold text-white"
            onClick={() => void loadData(token)}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-(--line) bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/super-admin"
            className="flex items-center gap-1.5 text-sm text-(--muted) transition-colors hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Dashboard
          </Link>
          <span className="text-(--line)">/</span>
          <span className="text-sm font-semibold text-foreground">
            {society?.name ?? "Society"}
          </span>
        </div>
        <button
          className="rounded-xl border border-(--line) bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-background"
          onClick={() => void loadData(token)}
          type="button"
        >
          Refresh
        </button>
      </header>

      <main className="grid-bg flex-1 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-7xl">
          {/* Society hero */}
          <div className="mb-6 rounded-2xl border border-(--line) bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
                  Society Detail
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {society?.name}
                </h1>
                <div className="mt-1.5 flex items-center gap-2 text-sm text-(--muted)">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  {society?.location}
                </div>
                {society?.createdAt && (
                  <p className="mt-1 text-xs text-(--muted)">
                    Registered {formatDate(society.createdAt)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="rounded-full border border-(--line) bg-background px-3 py-1 text-xs font-medium text-(--muted)">
                  ID: {id.slice(0, 8)}…
                </span>
              </div>
            </div>

            {/* Stat chips */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                {
                  label: "Houses",
                  value: houses.length,
                  color: "text-foreground",
                },
                {
                  label: "Occupied",
                  value: occupiedHouses,
                  color: "text-emerald-600",
                },
                {
                  label: "Residents",
                  value: residents.length,
                  color: "text-foreground",
                },
                {
                  label: "Pending Bills",
                  value: pendingBills,
                  color:
                    pendingBills > 0 ? "text-amber-600" : "text-foreground",
                },
                {
                  label: "Open Issues",
                  value: openComplaints,
                  color:
                    openComplaints > 0 ? "text-red-600" : "text-foreground",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-(--line) bg-background px-3 py-3 text-center"
                >
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-xs text-(--muted)">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-(--line) bg-white p-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-(--accent) text-white shadow-sm"
                    : "text-(--muted) hover:bg-background hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
            {/* Houses */}
            {activeTab === "houses" && (
              <div>
                <h2 className="mb-4 text-base font-bold text-foreground">
                  Houses ({houses.length})
                </h2>
                {houses.length === 0 ? (
                  <EmptyState message="No houses registered for this society yet." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {houses.map((house) => (
                      <div
                        key={house.id}
                        className="rounded-xl border border-(--line) bg-background p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              Block {house.block} — #{house.houseNumber}
                            </p>
                            <p className="mt-0.5 text-xs text-(--muted)">
                              ID: {house.id.slice(0, 8)}…
                            </p>
                          </div>
                          <StatusBadge status={house.status} />
                        </div>
                        <p className="mt-2 text-xs text-(--muted)">
                          Added {formatDate(house.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Residents */}
            {activeTab === "residents" && (
              <div>
                <h2 className="mb-4 text-base font-bold text-foreground">
                  Residents ({residents.length})
                </h2>
                {residents.length === 0 ? (
                  <EmptyState message="No residents registered for this society yet." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-(--line) text-left">
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Name
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Email
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Phone
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            CNIC
                          </th>
                          <th className="pb-2 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--line)">
                        {residents.map((r) => (
                          <tr key={r.id} className="hover:bg-background">
                            <td className="py-2.5 pr-4 font-medium text-foreground">
                              {r.name}
                            </td>
                            <td className="py-2.5 pr-4 text-(--muted)">
                              {r.email ?? "-"}
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-xs text-(--muted)">
                              {r.phone}
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-xs text-(--muted)">
                              {r.cnic}
                            </td>
                            <td className="py-2.5">
                              <span className="rounded-full bg-(--accent)/10 px-2 py-0.5 text-xs font-semibold text-(--accent)">
                                {r.role.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Billing */}
            {activeTab === "billing" && (
              <div>
                <h2 className="mb-4 text-base font-bold text-foreground">
                  Billing Records ({billings.length})
                </h2>
                {billings.length === 0 ? (
                  <EmptyState message="No billing records for this society yet." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-(--line) text-left">
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            House
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Description
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Amount
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Due Date
                          </th>
                          <th className="pb-2 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--line)">
                        {billings.map((b) => (
                          <tr key={b.id} className="hover:bg-background">
                            <td className="py-2.5 pr-4 font-medium text-foreground">
                              {houseMap.get(b.houseId) ?? b.houseId.slice(0, 8)}
                            </td>
                            <td className="py-2.5 pr-4 text-(--muted)">
                              {b.description}
                            </td>
                            <td className="py-2.5 pr-4 font-semibold text-foreground">
                              PKR {Number(b.amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 pr-4 text-(--muted)">
                              {formatDate(b.dueDate)}
                            </td>
                            <td className="py-2.5">
                              <StatusBadge status={b.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Complaints */}
            {activeTab === "complaints" && (
              <div>
                <h2 className="mb-4 text-base font-bold text-foreground">
                  Complaints & Queries ({complaints.length})
                </h2>
                {complaints.length === 0 ? (
                  <EmptyState message="No complaints or queries filed for this society." />
                ) : (
                  <div className="grid gap-3">
                    {complaints.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-(--line) bg-background p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="mb-1 inline-flex rounded-full border border-(--line) bg-white px-2 py-0.5 text-[11px] font-semibold text-(--muted)">
                              {c.category === "QUERY" ? "Query" : "Complaint"}
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {c.description}
                            </p>
                            <p className="mt-1 text-xs text-(--muted)">
                              {houseMap.get(c.houseId) ?? c.houseId.slice(0, 8)}{" "}
                              · Filed {formatDate(c.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Visitors */}
            {activeTab === "visitors" && (
              <div>
                <h2 className="mb-4 text-base font-bold text-foreground">
                  Visitor Logs ({visitors.length})
                </h2>
                {visitors.length === 0 ? (
                  <EmptyState message="No visitor logs recorded for this society." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-(--line) text-left">
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Visitor
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            House
                          </th>
                          <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Entry
                          </th>
                          <th className="pb-2 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                            Exit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--line)">
                        {visitors.map((v) => (
                          <tr key={v.id} className="hover:bg-background">
                            <td className="py-2.5 pr-4 font-medium text-foreground">
                              {v.visitorName}
                            </td>
                            <td className="py-2.5 pr-4 text-(--muted)">
                              {houseMap.get(v.houseId) ?? v.houseId.slice(0, 8)}
                            </td>
                            <td className="py-2.5 pr-4 text-(--muted)">
                              {formatDate(v.entryTime)}
                            </td>
                            <td className="py-2.5">
                              {v.exitTime ? (
                                <span className="text-(--muted)">
                                  {formatDate(v.exitTime)}
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                  Inside
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-(--line) bg-background px-4 py-10 text-center">
      <p className="text-sm text-(--muted)">{message}</p>
    </div>
  );
}
