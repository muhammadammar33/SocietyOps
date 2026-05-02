"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { User } from "../../../components/home/types";
import { createApiClient } from "../../../lib/api";

const TOKEN_KEY = "societyops.token";

function getDashboardPath(user: User | null): string {
  if (!user) return "/login";
  if (user.role === "SUPER_ADMIN") return "/dashboard/super-admin";
  if (user.role === "SOCIETY_ADMIN") return "/dashboard/society-admin";
  if (user.role === "RESIDENT_OWNER" || user.role === "RESIDENT_TENANT") {
    return "/dashboard/resident";
  }
  return "/login";
}

export default function ProfilePage() {
  const router = useRouter();
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
    [],
  );
  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      router.replace("/login");
      return;
    }

    setToken(stored);

    api
      .me(stored)
      .then((me) => {
        setUser(me);
        setName(me.name);
        setEmail(me.email ?? "");
        setPhone(me.phone);
        setCnic(me.cnic);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [api, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !user) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await api.updateProfile(token, {
        name,
        email,
        phone,
        cnic,
      });
      setUser(updated);
      setSuccess(
        updated.emailVerified
          ? "Profile updated successfully."
          : "Profile updated. Please check your email and verify before your next sign in.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl border border-(--line) bg-white px-6 py-4 text-sm text-(--muted)">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const backPath = getDashboardPath(user);

  return (
    <main className="grid-bg min-h-screen px-6 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-(--line) bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
              Account
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              My Profile
            </h1>
          </div>
          <Link
            href={backPath}
            className="rounded-xl border border-(--line) bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-white"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-4 rounded-xl border border-(--line) bg-background px-4 py-3 text-sm text-(--muted)">
          Email verification: {user.emailVerified ? "Verified" : "Not verified"}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-(--muted)"
              htmlFor="profile-name"
            >
              Full Name
            </label>
            <input
              id="profile-name"
              title="Full Name"
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-(--muted)"
              htmlFor="profile-email"
            >
              Email
            </label>
            <input
              id="profile-email"
              title="Email"
              placeholder="Enter your email"
              className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-(--muted)"
              htmlFor="profile-phone"
            >
              Phone
            </label>
            <input
              id="profile-phone"
              title="Phone"
              placeholder="Enter your phone"
              className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <label
              className="text-xs font-medium text-(--muted)"
              htmlFor="profile-cnic"
            >
              CNIC
            </label>
            <input
              id="profile-cnic"
              title="CNIC"
              placeholder="Enter your CNIC"
              className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
              value={cnic}
              onChange={(event) => setCnic(event.target.value)}
              required
            />
          </div>
          <button
            className="mt-2 w-full rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}
