"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { createApiClient } from "../../lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const apiBase = useMemo(
    () =>
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1",
    [],
  );
  const api = useMemo(() => createApiClient(apiBase), [apiBase]);

  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [message, setMessage] = useState("");
  const [error, setError] = useState(
    token ? "" : "Verification token is missing.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    api
      .verifyEmail(token)
      .then((response) => {
        setMessage(response.message || "Email verified successfully.");
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to verify email",
        );
      })
      .finally(() => setIsLoading(false));
  }, [api, token]);

  return (
    <main className="grid-bg flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
      <section className="w-full max-w-lg rounded-2xl border border-(--line) bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
          Account Verification
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          Verify Email
        </h1>

        {isLoading && (
          <p className="mt-4 text-sm text-(--muted)">Verifying your email...</p>
        )}

        {!isLoading && error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-(--accent) px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-(--line) bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-white"
          >
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="grid-bg flex min-h-screen items-center justify-center px-6 py-16 sm:px-10">
          <section className="w-full max-w-lg rounded-2xl border border-(--line) bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-(--accent)">
              Account Verification
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              Verify Email
            </h1>
            <p className="mt-4 text-sm text-(--muted)">
              Preparing verification...
            </p>
          </section>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
