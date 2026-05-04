"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useCallback, useState } from "react";
import { SessionCard } from "../../../components/home/SessionCard";
import { SocietiesCard } from "../../../components/home/SocietiesCard";
import { SuperAdminDashboard } from "../../../components/home/SuperAdminDashboard";
import { SuperAdminRecordsManager } from "../../../components/home/SuperAdminRecordsManager";
import { useAuth } from "../../../hooks/useAuth";
import { createApiClient } from "../../../lib/api";

type SuperAdminSection =
  | "overview"
  | "actions"
  | "societies"
  | "manage"
  | "session";

const SUPER_ADMIN_SECTIONS: { key: SuperAdminSection; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "actions", label: "Actions" },
  { key: "societies", label: "Societies" },
  { key: "manage", label: "Update / Delete" },
  { key: "session", label: "Session" },
];

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] =
    useState<SuperAdminSection>("overview");
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
    [],
  );

  const {
    token,
    user,
    societies,
    residents,
    isHydrating,
    isLoading,
    message,
    createSociety,
    createSocietyAdmin,
    refreshDashboardData,
    logout,
  } = useAuth(apiBase);

  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const changeAdminPassword = useCallback(
    async (userId: string, newPassword: string) => {
      await api.changeAdminPassword(token, userId, newPassword);
    },
    [api, token],
  );

  const updateSociety = useCallback(
    async (id: string, payload: { name: string; location: string }) => {
      await api.updateSociety(token, id, payload);
      await refreshDashboardData();
    },
    [api, refreshDashboardData, token],
  );

  const deleteSociety = useCallback(
    async (id: string) => {
      await api.deleteSociety(token, id);
      await refreshDashboardData();
    },
    [api, refreshDashboardData, token],
  );

  const updateSocietyOwner = useCallback(
    async (
      id: string,
      payload: {
        name: string;
        email: string;
        phone: string;
        cnic: string;
        societyId: string;
      },
    ) => {
      await api.updateResident(token, id, {
        ...payload,
        role: "SOCIETY_ADMIN",
      });
      await refreshDashboardData();
    },
    [api, refreshDashboardData, token],
  );

  const deleteSocietyOwner = useCallback(
    async (id: string) => {
      await api.deleteResident(token, id);
      await refreshDashboardData();
    },
    [api, refreshDashboardData, token],
  );

  useEffect(() => {
    if (isHydrating) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    if (user && user.role !== "SUPER_ADMIN") {
      router.replace("/login");
    }
  }, [isHydrating, router, token, user]);

  useEffect(() => {
    if (token && user?.role === "SUPER_ADMIN") {
      void refreshDashboardData();
    }
  }, [refreshDashboardData, token, user?.role]);

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-(--line) bg-white px-6 py-4 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--line) border-t-(--accent)" />
          <p className="text-sm font-medium text-(--muted)">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!token || !user || user.role !== "SUPER_ADMIN") {
    return null;
  }

  const societyAdmins = residents.filter(
    (resident) => resident.role === "SOCIETY_ADMIN",
  ).length;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-(--line) bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-10">
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
            <p className="text-base font-bold leading-none tracking-tight text-foreground">
              SocietyOps
            </p>
            <p className="mt-0.5 text-xs text-(--muted)">
              Super Admin Dashboard
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent) sm:inline-flex">
            {user.name}
          </span>
          <Link
            href="/dashboard/profile"
            className="rounded-xl border border-(--line) bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Profile
          </Link>
          <button
            className="rounded-xl border border-(--line) bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
            onClick={() => void refreshDashboardData()}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            type="button"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="grid-bg flex flex-1 flex-col">
        <div className="mx-auto grid w-full gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            {/* User card */}
            <div className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent)/10">
                <svg
                  className="h-5 w-5 text-(--accent)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <p className="mt-2.5 font-semibold text-foreground">
                {user.name}
              </p>
              <p className="text-sm text-(--muted)">{user.phone}</p>
              <span className="mt-2 inline-flex rounded-full bg-(--accent)/10 px-2.5 py-0.5 text-xs font-semibold text-(--accent)">
                {user.role}
              </span>
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                Overview
              </p>
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5">
                  <span className="text-sm text-(--muted)">Societies</span>
                  <span className="text-lg font-bold text-foreground">
                    {societies.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5">
                  <span className="text-sm text-(--muted)">Society Admins</span>
                  <span className="text-lg font-bold text-foreground">
                    {societyAdmins}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5">
                  <span className="text-sm text-(--muted)">Residents</span>
                  <span className="text-lg font-bold text-foreground">
                    {residents.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Sections */}
            <nav className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                Sections
              </p>
              <div className="grid gap-1.5 text-sm">
                {SUPER_ADMIN_SECTIONS.map((item) => {
                  const isActive = activeSection === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveSection(item.key)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-left font-medium transition-colors ${
                        isActive
                          ? "bg-(--accent) text-white shadow-sm"
                          : "text-foreground hover:bg-background"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      {isActive && (
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
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <section className="flex flex-col gap-6">
            {activeSection === "overview" && (
              <div className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
                  Control Center
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Super Admin Dashboard
                </h1>
                <p className="mt-1.5 text-sm text-(--muted)">
                  Create new societies, assign dedicated admins, and monitor
                  your community operations from one place.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Societies", value: societies.length },
                    { label: "Society Admins", value: societyAdmins },
                    { label: "Residents", value: residents.length },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-(--line) bg-background px-4 py-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-(--muted)">
                        {item.label}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-foreground">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("actions")}
                    className="rounded-xl border border-(--line) bg-white px-4 py-3 text-left transition-colors hover:bg-background"
                  >
                    <p className="font-semibold text-foreground">
                      Manage societies and admins
                    </p>
                    <p className="mt-1 text-sm text-(--muted)">
                      Create societies, assign admins, or reset admin
                      passwords.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("societies")}
                    className="rounded-xl border border-(--line) bg-white px-4 py-3 text-left transition-colors hover:bg-background"
                  >
                    <p className="font-semibold text-foreground">
                      View registered societies
                    </p>
                    <p className="mt-1 text-sm text-(--muted)">
                      Open the societies panel and drill into society details.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("manage")}
                    className="rounded-xl border border-(--line) bg-white px-4 py-3 text-left transition-colors hover:bg-background sm:col-span-2"
                  >
                    <p className="font-semibold text-foreground">
                      Update or delete records
                    </p>
                    <p className="mt-1 text-sm text-(--muted)">
                      Edit society details and manage assigned society owners.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {activeSection === "actions" && (
              <SuperAdminDashboard
                isLoading={isLoading}
                societies={societies}
                residents={residents}
                onCreateSociety={createSociety}
                onCreateSocietyAdmin={createSocietyAdmin}
                onChangeAdminPassword={changeAdminPassword}
              />
            )}

            {activeSection === "societies" && (
              <SocietiesCard societies={societies} />
            )}

            {activeSection === "manage" && (
              <SuperAdminRecordsManager
                isLoading={isLoading}
                societies={societies}
                residents={residents}
                onUpdateSociety={updateSociety}
                onDeleteSociety={deleteSociety}
                onUpdateSocietyOwner={updateSocietyOwner}
                onDeleteSocietyOwner={deleteSocietyOwner}
              />
            )}

            {activeSection === "session" && (
              <SessionCard
                tokenPresent={Boolean(token)}
                message={message}
                user={user}
                onLogout={logout}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
