"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  Billing,
  Complaint,
  House,
  Society,
  VisitorLog,
} from "../../../components/home/types";
import { createApiClient } from "../../../lib/api";

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
      {status.replace(/_/g, " ")}
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Tab = "overview" | "homes" | "billing" | "complaints" | "visitors";

export default function ResidentDashboardPage() {
  const router = useRouter();
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
    [],
  );
  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    phone: string;
    role: string;
    societyId: string | null;
  } | null>(null);

  const [society, setSociety] = useState<Society | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintHouseId, setComplaintHouseId] = useState("");
  const [complaintCategory, setComplaintCategory] = useState<"ISSUE" | "QUERY">(
    "ISSUE",
  );
  const [complaintDescription, setComplaintDescription] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [countSavingId, setCountSavingId] = useState("");
  const [residentCountDrafts, setResidentCountDrafts] = useState<
    Record<string, number>
  >({});

  const loadData = useCallback(
    async (bearer: string, user: { id: string; societyId: string | null }) => {
      if (!user.societyId) {
        setError("Your account is not assigned to a society. Contact admin.");
        setIsLoading(false);
        return;
      }

      setError("");
      setIsLoading(true);
      try {
        const [soc, allHouses, allBillings, allComplaints, allVisitors] =
          await Promise.all([
            api.society(bearer, user.societyId),
            api.houses(bearer),
            api.billings(bearer),
            api.complaints(bearer),
            api.visitors(bearer),
          ]);

        const myHouses = allHouses.filter(
          (h) => h.societyId === user.societyId && h.ownerId === user.id,
        );
        const myHouseIds = new Set(myHouses.map((h) => h.id));

        setSociety(soc);
        setHouses(myHouses);
        setResidentCountDrafts(
          myHouses.reduce<Record<string, number>>((acc, house) => {
            acc[house.id] = house.residentCount ?? 0;
            return acc;
          }, {}),
        );
        setBillings(allBillings.filter((b) => myHouseIds.has(b.houseId)));
        setComplaints(
          allComplaints.filter(
            (c) => c.userId === user.id || myHouseIds.has(c.houseId),
          ),
        );
        setVisitors(allVisitors.filter((v) => myHouseIds.has(v.houseId)));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      router.replace("/login");
      return;
    }

    setToken(stored);

    api
      .me(stored)
      .then((user) => {
        if (user.role !== "RESIDENT_OWNER" && user.role !== "RESIDENT_TENANT") {
          router.replace("/login");
          return;
        }

        const me = {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          societyId: user.societyId,
        };
        setCurrentUser(me);
        void loadData(stored, me);
      })
      .catch(() => router.replace("/login"));
  }, [api, loadData, router]);

  const houseMap = useMemo(
    () =>
      new Map(
        houses.map((h) => [h.id, `Block ${h.block} - #${h.houseNumber}`]),
      ),
    [houses],
  );

  const pendingBills = billings.filter(
    (b) => b.status === "PENDING" || b.status === "OVERDUE",
  ).length;
  const unpaidAmount = billings
    .filter((b) => b.status !== "PAID")
    .reduce((acc, bill) => acc + Number(bill.amount), 0);
  const openComplaints = complaints.filter(
    (c) => c.status === "OPEN" || c.status === "IN_PROGRESS",
  ).length;
  const visitorsInside = visitors.filter((v) => !v.exitTime).length;

  async function handleCreateComplaint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !token ||
      !currentUser ||
      !complaintHouseId ||
      !complaintDescription.trim()
    ) {
      return;
    }

    setActionLoading(true);
    setActionError("");
    try {
      const created = await api.createComplaint(token, {
        userId: currentUser.id,
        houseId: complaintHouseId,
        description: complaintDescription.trim(),
        category: complaintCategory,
      });
      setComplaints((prev) => [created, ...prev]);
      setComplaintCategory("ISSUE");
      setComplaintDescription("");
      setShowComplaintForm(false);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to submit complaint",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateResidentCount(houseId: string) {
    if (!token) return;

    const nextCount = residentCountDrafts[houseId] ?? 0;
    setCountSavingId(houseId);
    setActionError("");
    try {
      const updated = await api.updateHouseResidentCount(
        token,
        houseId,
        nextCount,
      );
      setHouses((prev) => prev.map((h) => (h.id === houseId ? updated : h)));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update resident count",
      );
    } finally {
      setCountSavingId("");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl border border-(--line) bg-white px-6 py-4 text-sm text-(--muted)">
          Loading resident dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">Unable to load dashboard</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-(--line) bg-white/85 px-6 py-3 backdrop-blur-sm sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--accent) text-white">
              S
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-foreground">
                SocietyOps
              </p>
              <p className="text-xs text-(--muted)">Resident Dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              className="rounded-xl border border-(--line) bg-white px-3 py-1.5 text-sm text-(--muted) hover:bg-background"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={() => currentUser && void loadData(token, currentUser)}
              className="rounded-xl border border-(--line) bg-white px-3 py-1.5 text-sm text-(--muted) hover:bg-background"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(TOKEN_KEY);
                router.replace("/login");
              }}
              className="rounded-xl bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="grid-bg px-5 py-6 sm:px-8">
        <div className="mb-4 rounded-2xl border border-(--line) bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
            Welcome
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {currentUser?.name}
          </h1>
          <p className="mt-1 text-sm text-(--muted)">
            {society?.name} • {society?.location}
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-(--line) bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground">
              {houses.length}
            </p>
            <p className="text-xs text-(--muted)">My Residences</p>
          </div>
          <div className="rounded-xl border border-(--line) bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{pendingBills}</p>
            <p className="text-xs text-(--muted)">Pending Bills</p>
          </div>
          <div className="rounded-xl border border-(--line) bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-red-600">
              PKR {unpaidAmount.toLocaleString()}
            </p>
            <p className="text-xs text-(--muted)">Outstanding</p>
          </div>
          <div className="rounded-xl border border-(--line) bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{openComplaints}</p>
            <p className="text-xs text-(--muted)">Open Complaints</p>
          </div>
          <div className="rounded-xl border border-(--line) bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">
              {visitorsInside}
            </p>
            <p className="text-xs text-(--muted)">Visitors Inside</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["overview", "Overview"],
              ["homes", "My Homes"],
              ["billing", "Billing"],
              ["complaints", "Complaints"],
              ["visitors", "Visitors"],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${activeTab === key ? "bg-(--accent) text-white" : "border border-(--line) bg-white text-(--muted) hover:bg-background"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">
                Recent Bills
              </h2>
              <div className="mt-3 space-y-2">
                {billings.slice(0, 5).map((bill) => (
                  <div
                    key={bill.id}
                    className="rounded-xl border border-(--line) bg-background px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {houseMap.get(bill.houseId) ?? bill.houseId}
                      </p>
                      <StatusBadge status={bill.status} />
                    </div>
                    <p className="mt-1 text-xs text-(--muted)">
                      {bill.description}
                    </p>
                    <p className="mt-1 text-xs text-(--muted)">
                      PKR {Number(bill.amount).toLocaleString()} • Due{" "}
                      {formatDate(bill.dueDate)}
                    </p>
                  </div>
                ))}
                {billings.length === 0 && (
                  <p className="text-sm text-(--muted)">No bills yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">
                Recent Complaints
              </h2>
              <div className="mt-3 space-y-2">
                {complaints.slice(0, 5).map((complaint) => (
                  <div
                    key={complaint.id}
                    className="rounded-xl border border-(--line) bg-background px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {complaint.description}
                      </p>
                      <StatusBadge status={complaint.status} />
                    </div>
                    <p className="mt-1 text-xs text-(--muted)">
                      {houseMap.get(complaint.houseId) ?? complaint.houseId} •{" "}
                      {formatDate(complaint.createdAt)}
                    </p>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-sm text-(--muted)">
                    No complaints submitted.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "homes" && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {houses.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground">
                      Block {h.block} - #{h.houseNumber}
                    </p>
                    <p className="text-xs text-(--muted)">
                      {h.type === "PLOT" ? "Plot" : "House"}
                    </p>
                  </div>
                  <StatusBadge status={h.status} />
                </div>
                <p className="mt-2 text-xs text-(--muted)">
                  Total Residents:{" "}
                  <span className="font-semibold text-foreground">
                    {h.residentCount}
                  </span>
                </p>
                {currentUser?.role === "RESIDENT_OWNER" && (
                  <div className="mt-2 rounded-xl border border-(--line) bg-background p-3">
                    <label
                      htmlFor={`residentCount-${h.id}`}
                      className="mb-1 block text-xs font-medium text-foreground"
                    >
                      Update Total Residents
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`residentCount-${h.id}`}
                        type="number"
                        min={0}
                        value={residentCountDrafts[h.id] ?? 0}
                        onChange={(e) =>
                          setResidentCountDrafts((prev) => ({
                            ...prev,
                            [h.id]: Math.max(0, Number(e.target.value || 0)),
                          }))
                        }
                        className="w-24 rounded-lg border border-(--line) bg-white px-2 py-1.5 text-sm text-foreground focus:border-(--accent) focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void handleUpdateResidentCount(h.id)}
                        disabled={countSavingId === h.id}
                        className="rounded-lg bg-(--accent) px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {countSavingId === h.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-2 text-xs text-(--muted)">
                  Added {formatDate(h.createdAt)}
                </p>
              </div>
            ))}
            {houses.length === 0 && (
              <div className="rounded-xl border border-dashed border-(--line) bg-white px-4 py-8 text-center text-sm text-(--muted)">
                No residence is assigned to your account yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "billing" && (
          <div className="overflow-hidden rounded-2xl border border-(--line) bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-background text-xs uppercase tracking-wide text-(--muted)">
                <tr>
                  <th className="px-4 py-3 text-left">Residence</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {billings.map((b) => (
                  <tr key={b.id} className="border-t border-(--line)">
                    <td className="px-4 py-3 text-foreground">
                      {houseMap.get(b.houseId) ?? b.houseId}
                    </td>
                    <td className="px-4 py-3 text-(--muted)">
                      {b.description}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      PKR {Number(b.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-(--muted)">
                      {formatDate(b.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
                {billings.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-(--muted)"
                      colSpan={5}
                    >
                      No billing records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                My Complaints & Queries
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowComplaintForm((v) => !v);
                  setActionError("");
                  if (!complaintHouseId && houses[0]) {
                    setComplaintHouseId(houses[0].id);
                  }
                }}
                className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white"
              >
                + New Complaint / Query
              </button>
            </div>

            {showComplaintForm && (
              <form
                onSubmit={handleCreateComplaint}
                className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-1 block text-sm font-medium text-foreground"
                    >
                      Type
                    </label>
                    <select
                      id="category"
                      value={complaintCategory}
                      onChange={(e) =>
                        setComplaintCategory(
                          e.target.value as "ISSUE" | "QUERY",
                        )
                      }
                      className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                    >
                      <option value="ISSUE">Complaint</option>
                      <option value="QUERY">Query</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="houseId"
                      className="mb-1 block text-sm font-medium text-foreground"
                    >
                      Residence
                    </label>
                    <select
                      id="houseId"
                      value={complaintHouseId}
                      onChange={(e) => setComplaintHouseId(e.target.value)}
                      required
                      className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                    >
                      <option value="">Select residence</option>
                      {houses.map((h) => (
                        <option key={h.id} value={h.id}>
                          Block {h.block} - #{h.houseNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="description"
                      className="mb-1 block text-sm font-medium text-foreground"
                    >
                      {complaintCategory === "QUERY"
                        ? "Query"
                        : "Issue Description"}
                    </label>
                    <textarea
                      id="description"
                      value={complaintDescription}
                      onChange={(e) => setComplaintDescription(e.target.value)}
                      required
                      rows={4}
                      className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground placeholder:text-(--muted) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                      placeholder={
                        complaintCategory === "QUERY"
                          ? "Ask your question here"
                          : "Describe the issue in detail"
                      }
                    />
                  </div>
                </div>

                {actionError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {actionError}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={actionLoading || houses.length === 0}
                    className="rounded-xl bg-(--accent) px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {actionLoading
                      ? "Submitting..."
                      : complaintCategory === "QUERY"
                        ? "Submit Query"
                        : "Submit Complaint"}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="mb-1 inline-flex rounded-full border border-(--line) bg-background px-2 py-0.5 text-[11px] font-semibold text-(--muted)">
                        {c.category === "QUERY" ? "Query" : "Complaint"}
                      </p>
                      <p className="font-medium text-foreground">
                        {c.description}
                      </p>
                      <p className="mt-1 text-xs text-(--muted)">
                        {houseMap.get(c.houseId) ?? c.houseId} •{" "}
                        {formatDate(c.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
              {complaints.length === 0 && (
                <div className="rounded-xl border border-dashed border-(--line) bg-white px-4 py-8 text-center text-sm text-(--muted)">
                  No complaints yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "visitors" && (
          <div className="space-y-3">
            {visitors.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {v.visitorName}
                    </p>
                    <p className="mt-1 text-xs text-(--muted)">
                      {houseMap.get(v.houseId) ?? v.houseId}
                    </p>
                    <p className="mt-1 text-xs text-(--muted)">
                      In: {formatDateTime(v.entryTime)}
                      {v.exitTime
                        ? ` • Out: ${formatDateTime(v.exitTime)}`
                        : " • Still inside"}
                    </p>
                  </div>
                  <StatusBadge status={v.exitTime ? "CLOSED" : "IN_PROGRESS"} />
                </div>
              </div>
            ))}
            {visitors.length === 0 && (
              <div className="rounded-xl border border-dashed border-(--line) bg-white px-4 py-8 text-center text-sm text-(--muted)">
                No visitor logs for your residence yet.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
