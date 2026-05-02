"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useCallback } from "react";
import { SessionCard } from "../../../components/home/SessionCard";
import { SocietiesCard } from "../../../components/home/SocietiesCard";
import { SuperAdminDashboard } from "../../../components/home/SuperAdminDashboard";
import { useAuth } from "../../../hooks/useAuth";
import { createApiClient } from "../../../lib/api";

export default function SuperAdminDashboardPage() {
  const router = useRouter();
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
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[240px_1fr]">
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

            {/* Nav */}
            <nav className="rounded-2xl border border-(--line) bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--muted)">
                Navigation
              </p>
              <div className="grid gap-1.5 text-sm">
                {[
                  { href: "#actions", label: "Actions" },
                  { href: "#societies", label: "Societies" },
                  { href: "#session", label: "Session" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 font-medium text-foreground transition-colors hover:bg-background"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <section className="flex flex-col gap-6">
            {/* Page title */}
            <div
              id="overview"
              className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
                Control Center
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Super Admin Dashboard
              </h1>
              <p className="mt-1.5 text-sm text-(--muted)">
                Create new societies, assign dedicated admins, and monitor your
                community operations from one place.
              </p>
            </div>

            <div id="actions">
              <SuperAdminDashboard
                isLoading={isLoading}
                societies={societies}
                residents={residents}
                onCreateSociety={createSociety}
                onCreateSocietyAdmin={createSocietyAdmin}
                onChangeAdminPassword={changeAdminPassword}
              />
            </div>

            <div id="societies">
              <SocietiesCard societies={societies} />
            </div>

            <div id="session">
              <SessionCard
                tokenPresent={Boolean(token)}
                message={message}
                user={user}
                onLogout={logout}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
