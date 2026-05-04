"use client";

import { FormEvent, useState } from "react";
import { LoginPayload } from "./types";

type LoginCardProps = {
  isLoading: boolean;
  onSubmit: (payload: LoginPayload) => Promise<void>;
};

export function LoginCard({ isLoading, onSubmit }: LoginCardProps) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ phone, password });
  }

  return (
    <article className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-foreground">Sign In</h2>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-(--muted)">Phone</label>
          <input
            className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
            placeholder="03001234567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-(--muted)">Password</label>
          <input
            className="w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button
          className="mt-1 w-full rounded-xl bg-(--accent) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </article>
  );
}
