"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CreateSocietyAdminPayload,
  CreateSocietyPayload,
  Resident,
  Society,
} from "./types";

type SuperAdminDashboardProps = {
  isLoading: boolean;
  societies: Society[];
  residents: Resident[];
  onCreateSociety: (payload: CreateSocietyPayload) => Promise<void>;
  onCreateSocietyAdmin: (payload: CreateSocietyAdminPayload) => Promise<void>;
  onChangeAdminPassword: (userId: string, newPassword: string) => Promise<void>;
};

export function SuperAdminDashboard({
  isLoading,
  societies,
  residents,
  onCreateSociety,
  onCreateSocietyAdmin,
  onChangeAdminPassword,
}: SuperAdminDashboardProps) {
  const [societyName, setSocietyName] = useState("");
  const [societyLocation, setSocietyLocation] = useState("");

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminCnic, setAdminCnic] = useState("");
  const [adminPassword, setAdminPassword] = useState("SocietyAdmin@123");
  const [selectedSocietyId, setSelectedSocietyId] = useState("");

  const hasSocieties = useMemo(() => societies.length > 0, [societies.length]);
  const societyAdmins = useMemo(
    () => residents.filter((r) => r.role === "SOCIETY_ADMIN"),
    [residents],
  );

  // Change password state
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAdminId || !newPassword) return;
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await onChangeAdminPassword(selectedAdminId, newPassword);
      setPwSuccess(true);
      setNewPassword("");
      setSelectedAdminId("");
    } catch (err) {
      setPwError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setPwLoading(false);
    }
  }

  async function handleSocietySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreateSociety({ name: societyName, location: societyLocation });
    setSocietyName("");
    setSocietyLocation("");
  }

  async function handleAdminSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSocietyId) return;

    await onCreateSocietyAdmin({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      cnic: adminCnic,
      password: adminPassword,
      societyId: selectedSocietyId,
    });

    setAdminName("");
    setAdminEmail("");
    setAdminPhone("");
    setAdminCnic("");
  }

  const inputCls =
    "w-full rounded-xl border border-(--line) bg-white px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10 disabled:opacity-50";

  return (
    <section className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-(--muted)">
          Management Actions
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-foreground sm:text-xl">
          Society & Admin Setup
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Create Society */}
        <article className="rounded-2xl border border-(--line) bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent)/10">
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Add New Society</h3>
          </div>
          <form className="grid gap-3" onSubmit={handleSocietySubmit}>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Society Name
              </label>
              <input
                className={inputCls}
                placeholder="e.g. Green Valley Cooperative"
                value={societyName}
                onChange={(event) => setSocietyName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Location
              </label>
              <input
                className={inputCls}
                placeholder="e.g. Islamabad"
                value={societyLocation}
                onChange={(event) => setSocietyLocation(event.target.value)}
                required
              />
            </div>
            <button
              className="mt-1 w-full rounded-xl bg-(--accent) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Create Society"}
            </button>
          </form>
        </article>

        {/* Assign Society Admin */}
        <article className="rounded-2xl border border-(--line) bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-2)/10">
              <svg
                className="h-4 w-4 text-(--accent-2)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">
              Assign Society Admin
            </h3>
          </div>
          <form className="grid gap-3" onSubmit={handleAdminSubmit}>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Society
              </label>
              <select
                className={inputCls}
                value={selectedSocietyId}
                onChange={(event) => setSelectedSocietyId(event.target.value)}
                title="Select a society"
                required
              >
                <option value="">Select a society</option>
                {societies.map((society) => (
                  <option key={society.id} value={society.id}>
                    {society.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Full Name
              </label>
              <input
                className={inputCls}
                placeholder="Admin full name"
                value={adminName}
                onChange={(event) => setAdminName(event.target.value)}
                required
                disabled={!hasSocieties}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Email
              </label>
              <input
                className={inputCls}
                type="email"
                placeholder="admin@example.com"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                required
                disabled={!hasSocieties}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Phone
              </label>
              <input
                className={inputCls}
                placeholder="03001234567"
                value={adminPhone}
                onChange={(event) => setAdminPhone(event.target.value)}
                required
                disabled={!hasSocieties}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">CNIC</label>
              <input
                className={inputCls}
                placeholder="3520100000001"
                value={adminCnic}
                onChange={(event) => setAdminCnic(event.target.value)}
                required
                disabled={!hasSocieties}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Password
              </label>
              <input
                className={inputCls}
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                required
                disabled={!hasSocieties}
              />
            </div>
            <button
              className="mt-1 w-full rounded-xl bg-(--accent-2) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              type="submit"
              disabled={isLoading || !hasSocieties}
            >
              {isLoading ? "Assigning..." : "Create & Assign Admin"}
            </button>
          </form>
        </article>

        {/* Change Admin Password */}
        <article className="rounded-2xl border border-(--line) bg-background p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <svg
                className="h-4 w-4 text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">
              Reset Admin Password
            </h3>
          </div>

          {pwSuccess && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              Password updated successfully.
            </div>
          )}
          {pwError && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {pwError}
            </div>
          )}

          <form className="grid gap-3" onSubmit={handlePasswordChange}>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                Society Admin
              </label>
              <select
                className={inputCls}
                value={selectedAdminId}
                onChange={(e) => {
                  setSelectedAdminId(e.target.value);
                  setPwSuccess(false);
                  setPwError("");
                }}
                title="Select society admin"
                required
              >
                <option value="">Select an admin</option>
                {societyAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} — {admin.phone}
                  </option>
                ))}
              </select>
              {societyAdmins.length === 0 && (
                <p className="text-xs text-(--muted)">
                  No society admins assigned yet.
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-(--muted)">
                New Password
              </label>
              <input
                className={inputCls}
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                disabled={societyAdmins.length === 0}
              />
            </div>
            <button
              className="mt-1 w-full rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              type="submit"
              disabled={pwLoading || societyAdmins.length === 0}
            >
              {pwLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
