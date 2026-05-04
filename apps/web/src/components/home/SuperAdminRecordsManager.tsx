"use client";

import { FormEvent, useMemo, useState } from "react";
import { Resident, Society } from "./types";

type SuperAdminRecordsManagerProps = {
  isLoading: boolean;
  societies: Society[];
  residents: Resident[];
  onUpdateSociety: (
    id: string,
    payload: { name: string; location: string },
  ) => Promise<void>;
  onDeleteSociety: (id: string) => Promise<void>;
  onUpdateSocietyOwner: (
    id: string,
    payload: {
      name: string;
      email: string;
      phone: string;
      cnic: string;
      societyId: string;
    },
  ) => Promise<void>;
  onDeleteSocietyOwner: (id: string) => Promise<void>;
};

type OwnerDraft = {
  name: string;
  email: string;
  phone: string;
  cnic: string;
  societyId: string;
};

export function SuperAdminRecordsManager({
  isLoading,
  societies,
  residents,
  onUpdateSociety,
  onDeleteSociety,
  onUpdateSocietyOwner,
  onDeleteSocietyOwner,
}: SuperAdminRecordsManagerProps) {
  const [editingSocietyId, setEditingSocietyId] = useState("");
  const [societyDraft, setSocietyDraft] = useState({ name: "", location: "" });
  const [editingOwnerId, setEditingOwnerId] = useState("");
  const [ownerDraft, setOwnerDraft] = useState<OwnerDraft>({
    name: "",
    email: "",
    phone: "",
    cnic: "",
    societyId: "",
  });
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const societyOwners = useMemo(
    () => residents.filter((resident) => resident.role === "SOCIETY_ADMIN"),
    [residents],
  );
  const societyNameById = useMemo(
    () => new Map(societies.map((society) => [society.id, society.name])),
    [societies],
  );

  function beginSocietyEdit(society: Society) {
    setEditingSocietyId(society.id);
    setSocietyDraft({ name: society.name, location: society.location });
    setError("");
    setSuccess("");
  }

  function beginOwnerEdit(owner: Resident) {
    setEditingOwnerId(owner.id);
    setOwnerDraft({
      name: owner.name,
      email: owner.email ?? "",
      phone: owner.phone,
      cnic: owner.cnic,
      societyId: owner.societyId ?? "",
    });
    setError("");
    setSuccess("");
  }

  async function runAction(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    setError("");
    setSuccess("");
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyKey("");
    }
  }

  async function handleSocietySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingSocietyId) return;

    await runAction(`society-update-${editingSocietyId}`, async () => {
      await onUpdateSociety(editingSocietyId, societyDraft);
      setEditingSocietyId("");
      setSuccess("Society updated successfully.");
    });
  }

  async function handleOwnerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingOwnerId) return;

    await runAction(`owner-update-${editingOwnerId}`, async () => {
      await onUpdateSocietyOwner(editingOwnerId, ownerDraft);
      setEditingOwnerId("");
      setSuccess("Society owner updated successfully.");
    });
  }

  const inputCls =
    "w-full rounded-xl border border-(--line) bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/10 disabled:opacity-50";
  const secondaryBtnCls =
    "rounded-lg border border-(--line) bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background";
  const dangerBtnCls =
    "rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50";

  return (
    <section className="rounded-2xl border border-(--line) bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-(--muted)">
            Records
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-foreground">
            Update & Delete
          </h2>
        </div>
        <span className="rounded-full bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent)">
          Societies and owners
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Societies</h3>
          <div className="mt-3 space-y-3">
            {societies.length === 0 && (
              <div className="rounded-xl border border-dashed border-(--line) bg-background px-4 py-8 text-center text-sm text-(--muted)">
                No societies registered yet.
              </div>
            )}
            {societies.map((society) => {
              const isEditing = editingSocietyId === society.id;

              return (
                <article
                  key={society.id}
                  className="rounded-xl border border-(--line) bg-background p-4"
                >
                  {isEditing ? (
                    <form className="grid gap-3" onSubmit={handleSocietySubmit}>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-(--muted)">
                          Society Name
                        </label>
                        <input
                          className={inputCls}
                          value={societyDraft.name}
                          onChange={(event) =>
                            setSocietyDraft((draft) => ({
                              ...draft,
                              name: event.target.value,
                            }))
                          }
                          required
                          maxLength={120}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-(--muted)">
                          Location
                        </label>
                        <input
                          className={inputCls}
                          value={societyDraft.location}
                          onChange={(event) =>
                            setSocietyDraft((draft) => ({
                              ...draft,
                              location: event.target.value,
                            }))
                          }
                          required
                          maxLength={200}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={secondaryBtnCls}
                          onClick={() => setEditingSocietyId("")}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            isLoading ||
                            busyKey === `society-update-${society.id}`
                          }
                          className="rounded-lg bg-(--accent) px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {busyKey === `society-update-${society.id}`
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {society.name}
                        </p>
                        <p className="mt-0.5 text-sm text-(--muted)">
                          {society.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={secondaryBtnCls}
                          onClick={() => beginSocietyEdit(society)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={dangerBtnCls}
                          disabled={busyKey === `society-delete-${society.id}`}
                          onClick={() =>
                            window.confirm(
                              `Delete ${society.name}? This cannot be undone.`,
                            ) &&
                            void runAction(
                              `society-delete-${society.id}`,
                              async () => {
                                await onDeleteSociety(society.id);
                                setSuccess("Society deleted successfully.");
                              },
                            )
                          }
                        >
                          {busyKey === `society-delete-${society.id}`
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Society Owners
          </h3>
          <div className="mt-3 space-y-3">
            {societyOwners.length === 0 && (
              <div className="rounded-xl border border-dashed border-(--line) bg-background px-4 py-8 text-center text-sm text-(--muted)">
                No society owners assigned yet.
              </div>
            )}
            {societyOwners.map((owner) => {
              const isEditing = editingOwnerId === owner.id;

              return (
                <article
                  key={owner.id}
                  className="rounded-xl border border-(--line) bg-background p-4"
                >
                  {isEditing ? (
                    <form className="grid gap-3" onSubmit={handleOwnerSubmit}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-(--muted)">
                            Full Name
                          </label>
                          <input
                            className={inputCls}
                            value={ownerDraft.name}
                            onChange={(event) =>
                              setOwnerDraft((draft) => ({
                                ...draft,
                                name: event.target.value,
                              }))
                            }
                            required
                            maxLength={120}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-(--muted)">
                            Email
                          </label>
                          <input
                            className={inputCls}
                            type="email"
                            value={ownerDraft.email}
                            onChange={(event) =>
                              setOwnerDraft((draft) => ({
                                ...draft,
                                email: event.target.value,
                              }))
                            }
                            required
                            maxLength={160}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-(--muted)">
                            Phone
                          </label>
                          <input
                            className={inputCls}
                            value={ownerDraft.phone}
                            onChange={(event) =>
                              setOwnerDraft((draft) => ({
                                ...draft,
                                phone: event.target.value,
                              }))
                            }
                            required
                            maxLength={20}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-(--muted)">
                            CNIC
                          </label>
                          <input
                            className={inputCls}
                            value={ownerDraft.cnic}
                            onChange={(event) =>
                              setOwnerDraft((draft) => ({
                                ...draft,
                                cnic: event.target.value,
                              }))
                            }
                            required
                            maxLength={20}
                          />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-2">
                          <label className="text-xs font-medium text-(--muted)">
                            Society
                          </label>
                          <select
                            className={inputCls}
                            value={ownerDraft.societyId}
                            onChange={(event) =>
                              setOwnerDraft((draft) => ({
                                ...draft,
                                societyId: event.target.value,
                              }))
                            }
                            title="Select society"
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
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={secondaryBtnCls}
                          onClick={() => setEditingOwnerId("")}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            isLoading || busyKey === `owner-update-${owner.id}`
                          }
                          className="rounded-lg bg-(--accent) px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {busyKey === `owner-update-${owner.id}`
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {owner.name}
                        </p>
                        <p className="mt-0.5 text-sm text-(--muted)">
                          {owner.phone} - {owner.email ?? "No email"}
                        </p>
                        <p className="mt-0.5 text-xs text-(--muted)">
                          {owner.societyId
                            ? societyNameById.get(owner.societyId) ??
                              owner.societyId
                            : "No society assigned"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={secondaryBtnCls}
                          onClick={() => beginOwnerEdit(owner)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={dangerBtnCls}
                          disabled={busyKey === `owner-delete-${owner.id}`}
                          onClick={() =>
                            window.confirm(
                              `Delete ${owner.name}? This cannot be undone.`,
                            ) &&
                            void runAction(
                              `owner-delete-${owner.id}`,
                              async () => {
                                await onDeleteSocietyOwner(owner.id);
                                setSuccess(
                                  "Society owner deleted successfully.",
                                );
                              },
                            )
                          }
                        >
                          {busyKey === `owner-delete-${owner.id}`
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
