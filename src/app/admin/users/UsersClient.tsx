"use client";

import { useState, useTransition } from "react";
import { Button, Card, ErrorNote, Modal, StatusPill } from "@/components/ui";
import { approveKyc, getKycDocUrl, rejectKyc, restrictUser } from "./actions";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  username: string;
  kyc_status: string;
  created_at: string;
  doc_type: string | null;
};

type BlacklistRow = { email: string; reason: string | null; blacklisted_at: string };

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UsersClient({ users, blacklist }: { users: UserRow[]; blacklist: BlacklistRow[] }) {
  const [tab, setTab] = useState<"all" | "pending" | "blacklist">("all");
  const [reviewing, setReviewing] = useState<UserRow | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = tab === "pending" ? users.filter((u) => u.kyc_status === "pending") : users;

  function openReview(user: UserRow) {
    setReviewing(user);
    setDocUrl(null);
    setDocError(null);
    startTransition(async () => {
      const res = await getKycDocUrl(user.id);
      if (res.error) setDocError(res.error);
      else setDocUrl(res.url ?? null);
    });
  }

  function doApprove() {
    if (!reviewing) return;
    setActionError(null);
    startTransition(async () => {
      const res = await approveKyc(reviewing.id);
      if (res.error) setActionError(res.error);
      else setReviewing(null);
    });
  }

  function doReject() {
    if (!reviewing) return;
    setActionError(null);
    startTransition(async () => {
      const res = await rejectKyc(reviewing.id);
      if (res.error) setActionError(res.error);
      else setReviewing(null);
    });
  }

  function doRestrict(userId: string) {
    startTransition(async () => {
      await restrictUser(userId);
    });
  }

  return (
    <div>
      <div className="mb-5 flex gap-6 border-b border-border">
        {(["all", "pending", "blacklist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative pb-2.5 text-[13.5px] font-bold ${
              tab === t ? "text-text" : "text-text-faint"
            }`}
          >
            {t === "all" ? "All users" : t === "pending" ? "Pending review" : "Blacklisted emails"}
            {tab === t ? <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" /> : null}
          </button>
        ))}
      </div>

      {tab !== "blacklist" ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-2 text-left text-[11px] font-bold uppercase tracking-wide text-text-faint">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-border-soft last:border-none">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 font-display text-[10.5px] font-bold text-text-dim">
                        {initials(u.full_name)}
                      </span>
                      <div>
                        <div className="text-[13px] font-bold text-text">{u.full_name}</div>
                        <div className="text-[11.5px] text-text-faint">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={u.kyc_status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-text-dim">
                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-text-dim">
                    {u.doc_type ? u.doc_type.replace("_", " ") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.kyc_status === "pending" ? (
                      <Button size="sm" variant="secondary" onClick={() => openReview(u)}>
                        Review
                      </Button>
                    ) : u.kyc_status === "approved" ? (
                      <Button size="sm" variant="danger" disabled={pending} onClick={() => doRestrict(u.id)}>
                        Restrict
                      </Button>
                    ) : (
                      <span className="text-[12px] text-text-faint">Restricted</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[12.5px] text-text-faint">
                    No users to show.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <h3 className="mb-1 font-display text-[15px] font-extrabold text-text">Blacklisted emails</h3>
          <p className="mb-4 text-[12.5px] text-text-dim">
            Auto-populated when a registration is rejected. Any new signup with these emails is
            blocked before reaching this queue.
          </p>
          {blacklist.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-text-faint">No blacklisted emails.</p>
          ) : (
            <div className="divide-y divide-border-soft">
              {blacklist.map((b) => (
                <div key={b.email} className="flex justify-between py-2.5 text-[12.5px]">
                  <span className="font-mono text-text">{b.email}</span>
                  <span className="text-text-faint">{b.reason}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {reviewing ? (
        <Modal
          title="KYC review"
          onClose={() => setReviewing(null)}
          footer={
            <>
              <Button size="sm" variant="danger" disabled={pending} onClick={doReject}>
                Reject &amp; blacklist email
              </Button>
              <Button size="sm" disabled={pending} onClick={doApprove}>
                Approve user
              </Button>
            </>
          }
        >
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 font-display text-[11px] font-bold text-text-dim">
              {initials(reviewing.full_name)}
            </span>
            <div>
              <div className="text-[13.5px] font-bold text-text">{reviewing.full_name}</div>
              <div className="text-[12px] text-text-faint">{reviewing.email} · @{reviewing.username}</div>
            </div>
          </div>
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-text-faint">
            {reviewing.doc_type?.replace("_", " ") ?? "Document"}
          </p>
          {docError ? (
            <ErrorNote>{docError}</ErrorNote>
          ) : docUrl ? (
            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-lg border border-border bg-surface-2 py-8 text-[13px] font-bold text-accent-ink hover:border-accent"
            >
              Open ID document ↗
            </a>
          ) : (
            <div className="flex items-center justify-center rounded-lg border border-border bg-surface-2 py-8 text-[12.5px] text-text-faint">
              Loading document…
            </div>
          )}
          <ErrorNote>{actionError}</ErrorNote>
        </Modal>
      ) : null}
    </div>
  );
}
