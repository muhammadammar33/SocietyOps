"use client";

import { FormEvent, useState } from "react";
import { RegisterPayload } from "./types";

type RegisterCardProps = {
  isLoading: boolean;
  onSubmit: (payload: RegisterPayload) => Promise<void>;
};

export function RegisterCard({ isLoading, onSubmit }: RegisterCardProps) {
  const [name, setName] = useState("New Resident");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cnic, setCnic] = useState("");
  const [password, setPassword] = useState("TestUser@123");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ name, email, phone, cnic, password });
  }

  const inputCls =
    "w-full rounded-xl border border-(--line) bg-background px-4 py-2.5 text-sm outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10";

  return (
    <article className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-foreground">Quick Register</h2>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-(--muted)">
            Full Name
          </label>
          <input
            className={inputCls}
            placeholder="e.g. Ahmad Khan"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-(--muted)">Email</label>
          <input
            className={inputCls}
            type="email"
            placeholder="resident@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-(--muted)">Phone</label>
          <input
            className={inputCls}
            placeholder="03001234567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-(--muted)">CNIC</label>
          <input
            className={inputCls}
            placeholder="3520100000001"
            value={cnic}
            onChange={(event) => setCnic(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-medium text-(--muted)">Password</label>
          <input
            className={inputCls}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button
          className="mt-1 w-full rounded-xl bg-(--accent-2) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Register"}
        </button>
      </form>
    </article>
  );
}
