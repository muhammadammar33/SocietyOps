"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createApiClient } from "../../lib/api";

const TOKEN_KEY = "societyops.token";

export default function LoginPage() {
  const router = useRouter();
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
    [],
  );
  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const auth = await api.login(phone, password);
      localStorage.setItem(TOKEN_KEY, auth.accessToken);
      if (auth.user.role === "SUPER_ADMIN") {
        router.push("/dashboard/super-admin");
      } else if (auth.user.role === "SOCIETY_ADMIN") {
        router.push("/dashboard/society-admin");
      } else if (
        auth.user.role === "RESIDENT_OWNER" ||
        auth.user.role === "RESIDENT_TENANT"
      ) {
        router.push("/dashboard/resident");
      } else {
        router.push("/login");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Login failed",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between border-b border-(--line) bg-white/70 px-6 py-4 backdrop-blur-sm sm:px-10">
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
          <span className="text-lg font-bold tracking-tight text-foreground">
            SocietyOps
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm text-(--muted) hover:text-foreground transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* Main */}
      <main className="grid-bg flex flex-1 items-center justify-center px-6 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <span className="inline-flex rounded-full bg-(--accent)/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-(--accent)">
              Secure Access
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Sign in to SocietyOps
            </h1>
            <p className="mt-2 text-sm text-(--muted)">
              Use the credentials assigned by your society admin to access your
              dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-(--line) bg-white p-6 shadow-sm sm:p-8">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-1.5">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="phone"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
                  placeholder="e.g. 03001234567"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <button
                className="mt-1 w-full rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between border-t border-(--line) pt-4 text-sm">
              <Link
                href="/"
                className="text-(--muted) hover:text-foreground transition-colors"
              >
                Back to home
              </Link>
              <Link
                href="/dashboard/super-admin"
                className="text-(--accent) hover:opacity-80 transition-opacity"
              >
                Already signed in?
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
