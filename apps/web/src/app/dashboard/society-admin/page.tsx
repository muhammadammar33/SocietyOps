"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Billing,
  Complaint,
  House,
  Resident,
  Society,
  VisitorLog,
} from "../../../components/home/types";
import { createApiClient } from "../../../lib/api";

const TOKEN_KEY = "societyops.token";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function InputField({
  label,
  id,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        required={required}
        className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground placeholder:text-(--muted) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
        {...props}
      />
    </div>
  );
}

function SelectField({
  label,
  id,
  name,
  children,
  required,
  value,
  onChange,
}: {
  label: string;
  id: string;
  name?: string;
  children: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        name={name}
        title={label}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
      >
        {children}
      </select>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-(--line) bg-background px-4 py-8 text-center">
      <p className="text-sm text-(--muted)">{message}</p>
    </div>
  );
}

function FormCard({
  title,
  onClose,
  onSubmit,
  submitting,
  error,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-(--accent)/30 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          title="Close"
          onClick={onClose}
          className="rounded-lg p-1 text-(--muted) hover:bg-background hover:text-foreground"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {children}
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-(--accent) px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab =
  | "overview"
  | "houses"
  | "residents"
  | "billing"
  | "complaints"
  | "visitors";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "overview",
    label: "Overview",
    icon: (
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
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    key: "houses",
    label: "Houses",
    icon: (
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
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
  },
  {
    key: "residents",
    label: "Residents",
    icon: (
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
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
  },
  {
    key: "billing",
    label: "Billing",
    icon: (
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
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
  },
  {
    key: "complaints",
    label: "Complaints",
    icon: (
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
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
  },
  {
    key: "visitors",
    label: "Visitors",
    icon: (
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
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SocietyAdminDashboardPage() {
  const router = useRouter();
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
    [],
  );
  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  // Auth
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: string;
    societyId: string | null;
  } | null>(null);

  // Data
  const [society, setSociety] = useState<Society | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Form visibility
  const [showAddHouse, setShowAddHouse] = useState(false);
  const [showAddResident, setShowAddResident] = useState(false);
  const [showAddBilling, setShowAddBilling] = useState(false);
  const [showLogVisitor, setShowLogVisitor] = useState(false);
  const [billingTarget, setBillingTarget] = useState<
    "ONE" | "SELECTED" | "ALL"
  >("ONE");
  const [selectedBillingHouseIds, setSelectedBillingHouseIds] = useState<
    string[]
  >([]);

  // Form submission state
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingResidentId, setEditingResidentId] = useState("");
  const [residentDraft, setResidentDraft] = useState({
    name: "",
    email: "",
    phone: "",
    cnic: "",
    role: "RESIDENT_OWNER",
  });
  const [residentActionId, setResidentActionId] = useState("");
  const [residentActionError, setResidentActionError] = useState("");
  const [residentActionMessage, setResidentActionMessage] = useState("");
  const [passwordResidentId, setPasswordResidentId] = useState("");
  const [residentPasswordDraft, setResidentPasswordDraft] = useState("");
  const [editingHouseId, setEditingHouseId] = useState("");
  const [houseDraft, setHouseDraft] = useState({
    type: "HOUSE",
    block: "",
    houseNumber: "",
    ownerId: "",
    status: "OCCUPIED",
  });
  const [houseActionId, setHouseActionId] = useState("");
  const [houseActionError, setHouseActionError] = useState("");
  const [houseActionMessage, setHouseActionMessage] = useState("");

  // ── Load data ───────────────────────────────────────────────────────────────

  const loadData = useCallback(
    async (bearer: string, societyId: string) => {
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
          api.society(bearer, societyId),
          api.houses(bearer),
          api.residents(bearer),
          api.billings(bearer),
          api.complaints(bearer),
          api.visitors(bearer),
        ]);

        setSociety(soc);

        const myHouses = allHouses.filter((h) => h.societyId === societyId);
        const houseIds = new Set(myHouses.map((h) => h.id));

        setHouses(myHouses);
        setResidents(allResidents.filter((r) => r.societyId === societyId));
        setBillings(allBillings.filter((b) => houseIds.has(b.houseId)));
        setComplaints(allComplaints.filter((c) => houseIds.has(c.houseId)));
        setVisitors(allVisitors.filter((v) => houseIds.has(v.houseId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
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
        if (user.role !== "SOCIETY_ADMIN") {
          router.replace("/login");
          return;
        }
        if (!user.societyId) {
          setError(
            "Your account is not assigned to any society. Contact the super admin.",
          );
          setIsLoading(false);
          return;
        }
        setCurrentUser(user as typeof currentUser);
        void loadData(stored, user.societyId);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [api, loadData, router]);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const houseMap = useMemo(
    () =>
      new Map(
        houses.map((h) => [h.id, `Block ${h.block} – #${h.houseNumber}`]),
      ),
    [houses],
  );

  const occupiedCount = houses.filter((h) => h.status === "OCCUPIED").length;
  const pendingBills = billings.filter(
    (b) => b.status === "PENDING" || b.status === "OVERDUE",
  ).length;
  const openComplaints = complaints.filter(
    (c) => c.status === "OPEN" || c.status === "IN_PROGRESS",
  ).length;
  const openIssueCount = complaints.filter(
    (c) =>
      (c.status === "OPEN" || c.status === "IN_PROGRESS") &&
      c.category !== "QUERY",
  ).length;
  const openQueryCount = complaints.filter(
    (c) =>
      (c.status === "OPEN" || c.status === "IN_PROGRESS") &&
      c.category === "QUERY",
  ).length;
  const visitorsInside = visitors.filter((v) => !v.exitTime).length;
  const ownerOptions = useMemo(
    () =>
      [...residents]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ id: r.id, label: `${r.name} — ${r.phone}` })),
    [residents],
  );

  // ── Action helpers ───────────────────────────────────────────────────────────

  function resetForm() {
    setFormError("");
    setFormLoading(false);
  }

  function beginEditHouse(house: House) {
    setEditingHouseId(house.id);
    setHouseDraft({
      type: house.type,
      block: house.block,
      houseNumber: house.houseNumber,
      ownerId: house.ownerId ?? "",
      status: house.status,
    });
    setHouseActionError("");
    setHouseActionMessage("");
  }

  async function handleUpdateHouse(houseId: string) {
    if (!token) return;

    setHouseActionId(`update-${houseId}`);
    setHouseActionError("");
    setHouseActionMessage("");

    try {
      const updated = await api.updateHouse(token, houseId, {
        type: houseDraft.type,
        block: houseDraft.block,
        houseNumber: houseDraft.houseNumber,
        ownerId: houseDraft.ownerId || null,
        status: houseDraft.status,
      });

      setHouses((prev) =>
        prev.map((house) => (house.id === houseId ? updated : house)),
      );
      setEditingHouseId("");
      setHouseActionMessage("House updated successfully.");
    } catch (err) {
      setHouseActionError(
        err instanceof Error ? err.message : "Failed to update house",
      );
    } finally {
      setHouseActionId("");
    }
  }

  async function handleDeleteHouse(house: House) {
    if (!token) return;
    if (
      !window.confirm(
        `Delete Block ${house.block} - #${house.houseNumber}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setHouseActionId(`delete-${house.id}`);
    setHouseActionError("");
    setHouseActionMessage("");

    try {
      await api.deleteHouse(token, house.id);
      setHouses((prev) => prev.filter((item) => item.id !== house.id));
      setHouseActionMessage("House deleted successfully.");
    } catch (err) {
      setHouseActionError(
        err instanceof Error ? err.message : "Failed to delete house",
      );
    } finally {
      setHouseActionId("");
    }
  }

  function beginEditResident(resident: Resident) {
    setEditingResidentId(resident.id);
    setResidentDraft({
      name: resident.name,
      email: resident.email ?? "",
      phone: resident.phone,
      cnic: resident.cnic,
      role: resident.role,
    });
    setResidentActionError("");
    setResidentActionMessage("");
  }

  async function handleUpdateResident(residentId: string) {
    if (!token || !currentUser?.societyId) return;

    setResidentActionId(`update-${residentId}`);
    setResidentActionError("");
    setResidentActionMessage("");

    try {
      const updated = await api.updateResident(token, residentId, {
        ...residentDraft,
        societyId: currentUser.societyId,
      });

      setResidents((prev) =>
        prev.map((resident) =>
          resident.id === residentId
            ? {
                ...resident,
                name: updated.name,
                email: updated.email,
                phone: updated.phone,
                cnic: updated.cnic,
                role: updated.role,
                societyId: updated.societyId,
              }
            : resident,
        ),
      );
      setEditingResidentId("");
      setResidentActionMessage("Resident updated successfully.");
    } catch (err) {
      setResidentActionError(
        err instanceof Error ? err.message : "Failed to update resident",
      );
    } finally {
      setResidentActionId("");
    }
  }

  async function handleDeleteResident(resident: Resident) {
    if (!token) return;
    if (
      !window.confirm(
        `Delete ${resident.name}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setResidentActionId(`delete-${resident.id}`);
    setResidentActionError("");
    setResidentActionMessage("");

    try {
      await api.deleteResident(token, resident.id);
      setResidents((prev) => prev.filter((item) => item.id !== resident.id));
      setResidentActionMessage("Resident deleted successfully.");
    } catch (err) {
      setResidentActionError(
        err instanceof Error ? err.message : "Failed to delete resident",
      );
    } finally {
      setResidentActionId("");
    }
  }

  async function handleChangeResidentPassword(residentId: string) {
    if (!token || !residentPasswordDraft) return;

    setResidentActionId(`password-${residentId}`);
    setResidentActionError("");
    setResidentActionMessage("");

    try {
      await api.changeAdminPassword(token, residentId, residentPasswordDraft);
      setPasswordResidentId("");
      setResidentPasswordDraft("");
      setResidentActionMessage("Resident password updated successfully.");
    } catch (err) {
      setResidentActionError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setResidentActionId("");
    }
  }

  async function updateComplaintStatus(id: string, status: string) {
    if (!token) return;
    try {
      const updated = await api.updateComplaint(token, id, { status });
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: updated.status } : c)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update complaint");
    }
  }

  async function updateBillingStatus(id: string, status: string) {
    if (!token) return;
    try {
      const updated = await api.updateBilling(token, id, { status });
      setBillings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: updated.status } : b)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update billing");
    }
  }

  async function markVisitorExit(id: string) {
    if (!token) return;
    try {
      const updated = await api.updateVisitor(token, id, {
        exitTime: new Date().toISOString(),
      });
      setVisitors((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, exitTime: updated.exitTime } : v,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark exit");
    }
  }

  // ── Form submit handlers ──────────────────────────────────────────────────────

  const addHouseRef = useRef<HTMLFormElement>(null);
  async function handleAddHouse(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !currentUser?.societyId) return;
    const fd = new FormData(e.target as HTMLFormElement);
    setFormLoading(true);
    setFormError("");
    const type = (fd.get("type") as string) || "HOUSE";
    const ownerIdRaw = fd.get("ownerId") as string;
    try {
      const h = await api.createHouse(token, {
        societyId: currentUser.societyId,
        type,
        block: fd.get("block") as string,
        houseNumber: fd.get("houseNumber") as string,
        ownerId: ownerIdRaw?.trim() || undefined,
        status:
          (fd.get("status") as string) ||
          (type === "PLOT" ? "VACANT" : "OCCUPIED"),
      });
      setHouses((prev) => [...prev, h]);
      setShowAddHouse(false);
      addHouseRef.current?.reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add house");
    } finally {
      setFormLoading(false);
    }
  }

  const addResidentRef = useRef<HTMLFormElement>(null);
  async function handleAddResident(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !currentUser?.societyId) return;
    const fd = new FormData(e.target as HTMLFormElement);
    setFormLoading(true);
    setFormError("");
    try {
      const res = await api.createResident(token, {
        name: fd.get("name") as string,
        email: fd.get("email") as string,
        phone: fd.get("phone") as string,
        cnic: fd.get("cnic") as string,
        password: fd.get("password") as string,
        societyId: currentUser.societyId,
      });
      setResidents((prev) => [...prev, res.user as unknown as Resident]);
      setShowAddResident(false);
      addResidentRef.current?.reset();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to register resident",
      );
    } finally {
      setFormLoading(false);
    }
  }

  const addBillingRef = useRef<HTMLFormElement>(null);
  async function handleAddBilling(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const description = String(fd.get("description") ?? "").trim();
    const amount = Number(fd.get("amount"));
    const dueDate = fd.get("dueDate") as string;

    if (!description) {
      setFormError("Billing description is required");
      return;
    }

    let targetHouseIds: string[] = [];
    if (billingTarget === "ALL") {
      targetHouseIds = houses.map((h) => h.id);
    } else if (billingTarget === "SELECTED") {
      targetHouseIds = selectedBillingHouseIds;
    } else {
      const oneHouseId = fd.get("houseId") as string;
      if (oneHouseId) targetHouseIds = [oneHouseId];
    }

    if (targetHouseIds.length === 0) {
      setFormError("Please select at least one house");
      return;
    }

    setFormLoading(true);
    setFormError("");
    try {
      const createdBills = await Promise.all(
        targetHouseIds.map((houseId) =>
          api.createBilling(token, {
            houseId,
            description,
            amount,
            dueDate,
            status: "PENDING",
          }),
        ),
      );
      setBillings((prev) => [...prev, ...createdBills]);
      setShowAddBilling(false);
      setBillingTarget("ONE");
      setSelectedBillingHouseIds([]);
      addBillingRef.current?.reset();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create billing entry",
      );
    } finally {
      setFormLoading(false);
    }
  }

  const logVisitorRef = useRef<HTMLFormElement>(null);
  async function handleLogVisitor(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const fd = new FormData(e.target as HTMLFormElement);
    setFormLoading(true);
    setFormError("");
    try {
      const v = await api.createVisitor(token, {
        houseId: fd.get("houseId") as string,
        visitorName: fd.get("visitorName") as string,
        entryTime: new Date().toISOString(),
      });
      setVisitors((prev) => [...prev, v]);
      setShowLogVisitor(false);
      logVisitorRef.current?.reset();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to log visitor",
      );
    } finally {
      setFormLoading(false);
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-(--line) bg-white px-6 py-4 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--line) border-t-(--accent)" />
          <p className="text-sm font-medium text-(--muted)">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-700">Error</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-(--line) bg-white/80 px-6 py-3 backdrop-blur-sm sm:px-10">
        <Link href="/" className="flex items-center gap-3">
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
            <p className="text-sm font-bold leading-none tracking-tight text-foreground">
              SocietyOps
            </p>
            <p className="mt-0.5 text-xs text-(--muted)">Society Admin</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="rounded-xl border border-(--line) bg-white px-3 py-1.5 text-sm font-medium text-(--muted) transition-colors hover:bg-background hover:text-foreground"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={() =>
              currentUser?.societyId &&
              void loadData(token, currentUser.societyId)
            }
            className="flex items-center gap-1.5 rounded-xl border border-(--line) bg-white px-3 py-1.5 text-sm font-medium text-(--muted) transition-colors hover:bg-background hover:text-foreground"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Refresh
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-(--line) bg-background px-3 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent) text-xs font-bold text-white">
              {currentUser?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <span className="text-sm font-medium text-foreground">
              {currentUser?.name}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              router.replace("/login");
            }}
            className="rounded-xl bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ── Sidebar ── */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-(--line) bg-white p-5 lg:flex">
          {/* Society card */}
          <div className="mb-5 rounded-xl border border-(--line) bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
              Your Society
            </p>
            <p className="mt-1.5 font-bold text-foreground">{society?.name}</p>
            <p className="mt-0.5 text-xs text-(--muted)">{society?.location}</p>
          </div>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            {[
              { label: "Houses", value: houses.length },
              {
                label: "Occupied",
                value: occupiedCount,
                accent: occupiedCount > 0,
              },
              { label: "Residents", value: residents.length },
              {
                label: "Pending Bills",
                value: pendingBills,
                red: pendingBills > 0,
              },
              {
                label: "Open Issues",
                value: openComplaints,
                red: openComplaints > 0,
              },
              {
                label: "Inside Now",
                value: visitorsInside,
                accent: visitorsInside > 0,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-(--line) bg-background px-3 py-2.5 text-center"
              >
                <p
                  className={`text-xl font-bold ${s.red ? "text-red-600" : s.accent ? "text-(--accent)" : "text-foreground"}`}
                >
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-(--muted)">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-(--accent)/10 text-(--accent)"
                    : "text-(--muted) hover:bg-background hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "billing" && pendingBills > 0 && (
                  <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                    {pendingBills}
                  </span>
                )}
                {tab.key === "complaints" && openComplaints > 0 && (
                  <span className="ml-auto rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                    {openComplaints}
                  </span>
                )}
                {tab.key === "visitors" && visitorsInside > 0 && (
                  <span className="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                    {visitorsInside}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="grid-bg flex-1 px-5 py-6 sm:px-8">
          {/* Mobile tab bar */}
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-(--line) bg-white p-1 shadow-sm lg:hidden">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-(--accent) text-white shadow-sm"
                    : "text-(--muted) hover:bg-background"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-(--line) bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
                  Society Overview
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  {
                    label: "Total Houses",
                    value: houses.length,
                    color: "text-foreground",
                  },
                  {
                    label: "Occupied",
                    value: occupiedCount,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Vacant",
                    value: houses.length - occupiedCount,
                    color: "text-amber-600",
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
                    className="rounded-xl border border-(--line) bg-white px-4 py-4 text-center shadow-sm"
                  >
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="mt-1 text-xs text-(--muted)">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Quick Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: "Add House",
                      tab: "houses" as Tab,
                      show: () => setShowAddHouse(true),
                    },
                    {
                      label: "Register Resident",
                      tab: "residents" as Tab,
                      show: () => setShowAddResident(true),
                    },
                    {
                      label: "Create Bill",
                      tab: "billing" as Tab,
                      show: () => setShowAddBilling(true),
                    },
                    {
                      label: "Log Visitor",
                      tab: "visitors" as Tab,
                      show: () => setShowLogVisitor(true),
                    },
                  ].map((a) => (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => {
                        setActiveTab(a.tab);
                        a.show();
                      }}
                      className="rounded-xl border border-(--accent)/30 bg-(--accent)/5 px-4 py-2 text-sm font-medium text-(--accent) transition-colors hover:bg-(--accent)/10"
                    >
                      + {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent complaints and queries */}
              {openComplaints > 0 && (
                <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                  <p className="mb-3 text-sm font-semibold text-red-700">
                    {openComplaints} Open Item{openComplaints > 1 ? "s" : ""}
                  </p>
                  <p className="mb-3 text-xs text-(--muted)">
                    {openIssueCount} Complaint{openIssueCount !== 1 ? "s" : ""}{" "}
                    · {openQueryCount} Query{openQueryCount !== 1 ? "ies" : ""}
                  </p>
                  <div className="space-y-2">
                    {complaints
                      .filter(
                        (c) =>
                          c.status === "OPEN" || c.status === "IN_PROGRESS",
                      )
                      .slice(0, 3)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-(--line) bg-background px-4 py-3"
                        >
                          <div>
                            <p className="mb-1 inline-flex rounded-full border border-(--line) bg-white px-2 py-0.5 text-[11px] font-semibold text-(--muted)">
                              {c.category === "QUERY" ? "Query" : "Complaint"}
                            </p>
                            <p className="text-sm text-foreground line-clamp-1">
                              {c.description}
                            </p>
                            <p className="mt-0.5 text-xs text-(--muted)">
                              {houseMap.get(c.houseId) ?? "–"}
                            </p>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>
                      ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("complaints")}
                    className="mt-3 text-xs font-medium text-(--accent) hover:underline"
                  >
                    View all →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Houses Tab ── */}
          {activeTab === "houses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Houses ({houses.length})
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddHouse((v) => !v);
                    resetForm();
                  }}
                  className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white"
                >
                  + Add House
                </button>
              </div>

              {showAddHouse && (
                <FormCard
                  title="Add New House / Plot"
                  onClose={() => setShowAddHouse(false)}
                  onSubmit={handleAddHouse}
                  submitting={formLoading}
                  error={formError}
                >
                  <SelectField
                    label="Property Type"
                    id="type"
                    name="type"
                    value=""
                    onChange={() => {}}
                  >
                    <option value="HOUSE">House</option>
                    <option value="PLOT">Plot</option>
                  </SelectField>
                  <InputField
                    label="Block"
                    id="block"
                    name="block"
                    placeholder="A"
                    required
                  />
                  <InputField
                    label="Number"
                    id="houseNumber"
                    name="houseNumber"
                    placeholder="101"
                    required
                  />
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="ownerId"
                      className="mb-1 block text-sm font-medium text-foreground"
                    >
                      Owner (Resident)
                    </label>
                    <select
                      id="ownerId"
                      name="ownerId"
                      title="Owner (Resident)"
                      className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                      defaultValue=""
                    >
                      <option value="">Select resident (optional)</option>
                      {ownerOptions.map((resident) => (
                        <option key={resident.id} value={resident.id}>
                          {resident.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-(--muted)">
                      Required for Houses. For Plots, leave blank if no owner
                      yet.
                    </p>
                  </div>
                  <SelectField
                    label="Status"
                    id="status"
                    value=""
                    onChange={() => {}}
                  >
                    <option value="OCCUPIED">Occupied</option>
                    <option value="VACANT">Vacant</option>
                    <option value="FOR_SALE">For Sale</option>
                    <option value="FOR_RENT">For Rent</option>
                  </SelectField>
                </FormCard>
              )}

              {houseActionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {houseActionError}
                </div>
              )}
              {houseActionMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  {houseActionMessage}
                </div>
              )}

              {houses.length === 0 ? (
                <EmptyState message="No houses registered yet. Add your first house above." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {houses.map((h) => {
                    const isEditing = editingHouseId === h.id;

                    return (
                    <div
                      key={h.id}
                      className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-foreground">
                            Block {h.block} – #{h.houseNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-(--muted)">
                            {h.type === "PLOT" ? "Plot" : "House"} · ID:{" "}
                            {h.id.slice(0, 8)}…
                          </p>
                        </div>
                        <StatusBadge status={h.status} />
                      </div>
                      <p className="mt-2 text-xs text-(--muted)">
                        Added {formatDate(h.createdAt)}
                      </p>
                      {isEditing ? (
                        <div className="mt-4 grid gap-3 border-t border-(--line) pt-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">
                                Type
                              </label>
                              <select
                                title="Property type"
                                value={houseDraft.type}
                                onChange={(event) =>
                                  setHouseDraft((draft) => ({
                                    ...draft,
                                    type: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground focus:border-(--accent) focus:outline-none"
                              >
                                <option value="HOUSE">House</option>
                                <option value="PLOT">Plot</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-medium text-foreground">
                                Status
                              </label>
                              <select
                                title="Property status"
                                value={houseDraft.status}
                                onChange={(event) =>
                                  setHouseDraft((draft) => ({
                                    ...draft,
                                    status: event.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground focus:border-(--accent) focus:outline-none"
                              >
                                <option value="OCCUPIED">Occupied</option>
                                <option value="VACANT">Vacant</option>
                                <option value="FOR_SALE">For Sale</option>
                                <option value="FOR_RENT">For Rent</option>
                              </select>
                            </div>
                            <InputField
                              label="Block"
                              id={`edit-house-block-${h.id}`}
                              value={houseDraft.block}
                              onChange={(event) =>
                                setHouseDraft((draft) => ({
                                  ...draft,
                                  block: event.target.value,
                                }))
                              }
                              required
                            />
                            <InputField
                              label="Number"
                              id={`edit-house-number-${h.id}`}
                              value={houseDraft.houseNumber}
                              onChange={(event) =>
                                setHouseDraft((draft) => ({
                                  ...draft,
                                  houseNumber: event.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-foreground">
                              Owner
                            </label>
                            <select
                              title="Owner"
                              value={houseDraft.ownerId}
                              onChange={(event) =>
                                setHouseDraft((draft) => ({
                                  ...draft,
                                  ownerId: event.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground focus:border-(--accent) focus:outline-none"
                            >
                              <option value="">No owner assigned</option>
                              {ownerOptions.map((resident) => (
                                <option key={resident.id} value={resident.id}>
                                  {resident.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void handleUpdateHouse(h.id)}
                              disabled={houseActionId === `update-${h.id}`}
                              className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {houseActionId === `update-${h.id}`
                                ? "Saving..."
                                : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingHouseId("")}
                              className="rounded-xl border border-(--line) bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex gap-2 border-t border-(--line) pt-3">
                          <button
                            type="button"
                            onClick={() => beginEditHouse(h)}
                            className="rounded-lg border border-(--line) bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteHouse(h)}
                            disabled={houseActionId === `delete-${h.id}`}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            {houseActionId === `delete-${h.id}`
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Residents Tab ── */}
          {activeTab === "residents" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Residents ({residents.length})
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddResident((v) => !v);
                    resetForm();
                  }}
                  className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white"
                >
                  + Register Resident
                </button>
              </div>

              {showAddResident && (
                <FormCard
                  title="Register New Resident"
                  onClose={() => setShowAddResident(false)}
                  onSubmit={handleAddResident}
                  submitting={formLoading}
                  error={formError}
                >
                  <InputField
                    label="Full Name"
                    id="res-name"
                    name="name"
                    placeholder="Muhammad Ali"
                    required
                  />
                  <InputField
                    label="Email"
                    id="res-email"
                    name="email"
                    type="email"
                    placeholder="resident@example.com"
                    required
                  />
                  <InputField
                    label="Phone"
                    id="res-phone"
                    name="phone"
                    placeholder="03001234567"
                    required
                  />
                  <InputField
                    label="CNIC"
                    id="res-cnic"
                    name="cnic"
                    placeholder="3520112345671"
                    required
                  />
                  <InputField
                    label="Password"
                    id="res-password"
                    name="password"
                    type="password"
                    required
                  />
                </FormCard>
              )}

              {residentActionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {residentActionError}
                </div>
              )}
              {residentActionMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  {residentActionMessage}
                </div>
              )}

              {residents.length === 0 ? (
                <EmptyState message="No residents yet. Register the first one above." />
              ) : (
                <div className="rounded-2xl border border-(--line) bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-(--line) bg-background text-left text-xs font-semibold uppercase tracking-widest text-(--muted)">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">CNIC</th>
                          <th className="px-4 py-3">Role</th>
                          {/* <th className="px-4 py-3">ID</th> */}
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--line)">
                        {residents.map((r) => {
                          const isEditing = editingResidentId === r.id;
                          const isCurrentUser = currentUser?.id === r.id;

                          return (
                            <Fragment key={r.id}>
                          <tr className="hover:bg-background/50">
                            <td className="px-4 py-3 font-medium text-foreground">
                              {r.name}
                            </td>
                            <td className="px-4 py-3 text-(--muted)">
                              {r.email ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-(--muted)">
                              {r.phone}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-(--muted)">
                              {r.cnic}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={r.role} />
                            </td>
                            {/* <td className="px-4 py-3 font-mono text-xs text-(--muted)">
                              {r.id.slice(0, 8)}…
                            </td> */}
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => beginEditResident(r)}
                                  className="rounded-lg border border-(--line) bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPasswordResidentId(r.id);
                                    setResidentPasswordDraft("");
                                    setResidentActionError("");
                                    setResidentActionMessage("");
                                  }}
                                  disabled={isCurrentUser}
                                  title={
                                    isCurrentUser
                                      ? "Use your profile to change your own password"
                                      : "Change password"
                                  }
                                  className="rounded-lg border border-(--line) bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background disabled:opacity-50"
                                >
                                  Password
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteResident(r)}
                                  disabled={
                                    isCurrentUser ||
                                    residentActionId === `delete-${r.id}`
                                  }
                                  title={
                                    isCurrentUser
                                      ? "You cannot delete your own account here"
                                      : "Delete resident"
                                  }
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                >
                                  {residentActionId === `delete-${r.id}`
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {passwordResidentId === r.id && (
                            <tr className="bg-background/70">
                              <td className="px-4 py-4" colSpan={7}>
                                <div className="rounded-xl border border-(--line) bg-white p-4">
                                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                                    <InputField
                                      label="New Password"
                                      id={`resident-password-${r.id}`}
                                      type="password"
                                      minLength={6}
                                      value={residentPasswordDraft}
                                      onChange={(event) =>
                                        setResidentPasswordDraft(
                                          event.target.value,
                                        )
                                      }
                                      required
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleChangeResidentPassword(r.id)
                                      }
                                      disabled={
                                        residentActionId ===
                                          `password-${r.id}` ||
                                        residentPasswordDraft.length < 6
                                      }
                                      className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                      {residentActionId === `password-${r.id}`
                                        ? "Updating..."
                                        : "Update Password"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPasswordResidentId("");
                                        setResidentPasswordDraft("");
                                      }}
                                      className="rounded-xl border border-(--line) bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          {isEditing && (
                            <tr className="bg-background/70">
                              <td className="px-4 py-4" colSpan={7}>
                                <div className="grid gap-3 rounded-xl border border-(--line) bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
                                  <InputField
                                    label="Full Name"
                                    id={`edit-res-name-${r.id}`}
                                    value={residentDraft.name}
                                    onChange={(event) =>
                                      setResidentDraft((draft) => ({
                                        ...draft,
                                        name: event.target.value,
                                      }))
                                    }
                                    required
                                  />
                                  <InputField
                                    label="Email"
                                    id={`edit-res-email-${r.id}`}
                                    type="email"
                                    value={residentDraft.email}
                                    onChange={(event) =>
                                      setResidentDraft((draft) => ({
                                        ...draft,
                                        email: event.target.value,
                                      }))
                                    }
                                    required
                                  />
                                  <InputField
                                    label="Phone"
                                    id={`edit-res-phone-${r.id}`}
                                    value={residentDraft.phone}
                                    onChange={(event) =>
                                      setResidentDraft((draft) => ({
                                        ...draft,
                                        phone: event.target.value,
                                      }))
                                    }
                                    required
                                  />
                                  <InputField
                                    label="CNIC"
                                    id={`edit-res-cnic-${r.id}`}
                                    value={residentDraft.cnic}
                                    onChange={(event) =>
                                      setResidentDraft((draft) => ({
                                        ...draft,
                                        cnic: event.target.value,
                                      }))
                                    }
                                    required
                                  />
                                  <SelectField
                                    label="Role"
                                    id={`edit-res-role-${r.id}`}
                                    value={residentDraft.role}
                                    onChange={(value) =>
                                      setResidentDraft((draft) => ({
                                        ...draft,
                                        role: value,
                                      }))
                                    }
                                  >
                                    <option value="RESIDENT_OWNER">
                                      Resident Owner
                                    </option>
                                    <option value="RESIDENT_TENANT">
                                      Resident Tenant
                                    </option>
                                    <option value="SECURITY_GUARD">
                                      Security Guard
                                    </option>
                                    {r.role === "SOCIETY_ADMIN" && (
                                      <option value="SOCIETY_ADMIN">
                                        Society Admin
                                      </option>
                                    )}
                                  </SelectField>
                                  <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleUpdateResident(r.id)
                                      }
                                      disabled={
                                        residentActionId === `update-${r.id}`
                                      }
                                      className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                    >
                                      {residentActionId === `update-${r.id}`
                                        ? "Saving..."
                                        : "Save Changes"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingResidentId("")}
                                      className="rounded-xl border border-(--line) bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-background"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Billing Tab ── */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Billing ({billings.length})
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBilling((v) => !v);
                    resetForm();
                  }}
                  className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white"
                >
                  + Create Bill
                </button>
              </div>

              {showAddBilling && (
                <FormCard
                  title="Create Billing Entry"
                  onClose={() => setShowAddBilling(false)}
                  onSubmit={handleAddBilling}
                  submitting={formLoading}
                  error={formError}
                >
                  <SelectField
                    label="Generate For"
                    id="bill-target"
                    value={billingTarget}
                    onChange={(value) => {
                      setBillingTarget(value as "ONE" | "SELECTED" | "ALL");
                      setSelectedBillingHouseIds([]);
                    }}
                  >
                    <option value="ONE">One House</option>
                    <option value="SELECTED">Selected Houses</option>
                    <option value="ALL">Whole Society (All Houses)</option>
                  </SelectField>

                  {billingTarget === "ONE" && (
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="bill-houseId"
                        className="mb-1 block text-sm font-medium text-foreground"
                      >
                        House <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="bill-houseId"
                        name="houseId"
                        title="Select house"
                        required
                        className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                      >
                        <option value="">Select a house</option>
                        {houses.map((h) => (
                          <option key={h.id} value={h.id}>
                            Block {h.block} – #{h.houseNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {billingTarget === "SELECTED" && (
                    <div className="sm:col-span-2">
                      <p className="mb-1 block text-sm font-medium text-foreground">
                        Select Houses <span className="text-red-500">*</span>
                      </p>
                      <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-(--line) bg-background p-3">
                        {houses.map((h) => {
                          const checked = selectedBillingHouseIds.includes(
                            h.id,
                          );
                          return (
                            <label
                              key={h.id}
                              className="flex items-center gap-2 text-sm text-foreground"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedBillingHouseIds((prev) =>
                                    e.target.checked
                                      ? [...prev, h.id]
                                      : prev.filter((id) => id !== h.id),
                                  );
                                }}
                              />
                              <span>
                                Block {h.block} – #{h.houseNumber}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="bill-description"
                      className="mb-1 block text-sm font-medium text-foreground"
                    >
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="bill-description"
                      name="description"
                      rows={3}
                      required
                      placeholder="e.g. Monthly maintenance and security charges"
                      className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm text-foreground placeholder:text-(--muted) focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                    />
                  </div>
                  <InputField
                    label="Amount (PKR)"
                    id="bill-amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="5000"
                    required
                  />
                  <InputField
                    label="Due Date"
                    id="bill-due"
                    name="dueDate"
                    type="date"
                    required
                  />
                </FormCard>
              )}

              {billings.length === 0 ? (
                <EmptyState message="No billing records yet." />
              ) : (
                <div className="rounded-2xl border border-(--line) bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-(--line) bg-background text-left text-xs font-semibold uppercase tracking-widest text-(--muted)">
                          <th className="px-4 py-3">House</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Due Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--line)">
                        {billings.map((b) => (
                          <tr key={b.id} className="hover:bg-background/50">
                            <td className="px-4 py-3 font-medium text-foreground">
                              {houseMap.get(b.houseId) ?? "–"}
                            </td>
                            <td className="px-4 py-3 text-(--muted)">
                              {b.description}
                            </td>
                            <td className="px-4 py-3 font-mono text-(--muted)">
                              PKR {Number(b.amount).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-(--muted)">
                              {formatDate(b.dueDate)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="px-4 py-3">
                              {b.status !== "PAID" && (
                                <select
                                  title="Update billing status"
                                  value={b.status}
                                  onChange={(e) =>
                                    void updateBillingStatus(
                                      b.id,
                                      e.target.value,
                                    )
                                  }
                                  className="rounded-lg border border-(--line) bg-background px-2 py-1 text-xs focus:outline-none"
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="PARTIAL">Partial</option>
                                  <option value="PAID">Paid</option>
                                  <option value="OVERDUE">Overdue</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Complaints Tab ── */}
          {activeTab === "complaints" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Complaints & Queries ({complaints.length})
                </h2>
                {openComplaints > 0 && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    {openComplaints} open
                  </span>
                )}
              </div>

              {complaints.length === 0 ? (
                <EmptyState message="No complaints filed yet." />
              ) : (
                <div className="space-y-3">
                  {complaints.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="mb-1 inline-flex rounded-full border border-(--line) bg-background px-2 py-0.5 text-[11px] font-semibold text-(--muted)">
                            {c.category === "QUERY" ? "Query" : "Complaint"}
                          </p>
                          <p className="text-sm text-foreground">
                            {c.description}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-(--muted)">
                            <span>{houseMap.get(c.houseId) ?? "–"}</span>
                            <span>·</span>
                            <span>Filed {formatDate(c.createdAt)}</span>
                          </div>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.status !== "CLOSED" && c.status !== "RESOLVED" && (
                        <div className="mt-3 flex items-center gap-2 border-t border-(--line) pt-3">
                          <span className="text-xs text-(--muted)">
                            Update status:
                          </span>
                          <div className="flex gap-1">
                            {(
                              ["IN_PROGRESS", "RESOLVED", "CLOSED"] as const
                            ).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  void updateComplaintStatus(c.id, s)
                                }
                                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                                  c.status === s
                                    ? "border-(--accent) bg-(--accent)/10 text-(--accent)"
                                    : "border-(--line) bg-background text-(--muted) hover:border-(--accent)/40 hover:text-foreground"
                                }`}
                              >
                                {s.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Visitors Tab ── */}
          {activeTab === "visitors" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  Visitors ({visitors.length})
                  {visitorsInside > 0 && (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {visitorsInside} inside
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogVisitor((v) => !v);
                    resetForm();
                  }}
                  className="rounded-xl bg-(--accent) px-4 py-2 text-sm font-semibold text-white"
                >
                  + Log Visitor
                </button>
              </div>

              {showLogVisitor && (
                <FormCard
                  title="Log Visitor Entry"
                  onClose={() => setShowLogVisitor(false)}
                  onSubmit={handleLogVisitor}
                  submitting={formLoading}
                  error={formError}
                >
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="vis-houseId"
                      className="mb-1 block text-sm font-medium text-foreground"
                    >
                      Visiting House <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vis-houseId"
                      name="houseId"
                      title="Select house"
                      required
                      className="w-full rounded-xl border border-(--line) bg-background px-3 py-2 text-sm focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--accent)/20"
                    >
                      <option value="">Select a house</option>
                      {houses.map((h) => (
                        <option key={h.id} value={h.id}>
                          Block {h.block} – #{h.houseNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <InputField
                      label="Visitor Name"
                      id="vis-name"
                      name="visitorName"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </FormCard>
              )}

              {visitors.length === 0 ? (
                <EmptyState message="No visitor logs yet." />
              ) : (
                <div className="rounded-2xl border border-(--line) bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-(--line) bg-background text-left text-xs font-semibold uppercase tracking-widest text-(--muted)">
                          <th className="px-4 py-3">Visitor</th>
                          <th className="px-4 py-3">House</th>
                          <th className="px-4 py-3">Entry</th>
                          <th className="px-4 py-3">Exit</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--line)">
                        {visitors
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.entryTime).getTime() -
                              new Date(a.entryTime).getTime(),
                          )
                          .map((v) => (
                            <tr key={v.id} className="hover:bg-background/50">
                              <td className="px-4 py-3 font-medium text-foreground">
                                {v.visitorName}
                              </td>
                              <td className="px-4 py-3 text-(--muted)">
                                {houseMap.get(v.houseId) ?? "–"}
                              </td>
                              <td className="px-4 py-3 text-(--muted)">
                                {formatDateTime(v.entryTime)}
                              </td>
                              <td className="px-4 py-3">
                                {v.exitTime ? (
                                  <span className="text-(--muted)">
                                    {formatDateTime(v.exitTime)}
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                    Inside
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {!v.exitTime && (
                                  <button
                                    type="button"
                                    onClick={() => void markVisitorExit(v.id)}
                                    className="rounded-lg border border-(--line) bg-background px-3 py-1 text-xs font-medium text-(--muted) transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  >
                                    Mark Exit
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
