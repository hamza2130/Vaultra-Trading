"use client";

import { useActionState, useRef } from "react";
import { Button, Card, ErrorNote, TextInput } from "@/components/ui";
import { addWallet, setWalletActive } from "./actions";

type Wallet = { id: string; label: string; address: string; network: string; active: boolean };

export function WalletsClient({ wallets }: { wallets: Wallet[] }) {
  const [state, action, pending] = useActionState(addWallet, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <h3 className="mb-1 font-display text-[15px] font-extrabold text-text">Platform deposit addresses</h3>
      <p className="mb-4 text-[12.5px] text-text-dim">
        Shown to users on the Deposit screen. Users are shown the oldest <em>active</em> address, so to
        rotate, add the new one and deactivate the old one.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {wallets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-4 text-center text-[12.5px] text-text-faint">
            No addresses yet — users can&apos;t deposit until you add one.
          </p>
        ) : (
          wallets.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5">
              <div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-text">
                  {w.label}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${w.active ? "bg-pos-soft text-pos" : "bg-border-soft text-text-faint"}`}>
                    {w.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="break-all font-mono text-[11.5px] text-text-dim">{w.address}</div>
              </div>
              <form action={setWalletActive}>
                <input type="hidden" name="walletId" value={w.id} />
                <input type="hidden" name="active" value={String(!w.active)} />
                <Button type="submit" variant="ghost" size="sm">
                  {w.active ? "Deactivate" : "Activate"}
                </Button>
              </form>
            </div>
          ))
        )}
      </div>

      <form
        ref={formRef}
        action={async (fd) => {
          await action(fd);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <TextInput name="label" placeholder="Label (e.g. TRC20 — Primary)" required className="flex-1" />
        <TextInput name="address" placeholder="TRC20 address (T...)" required className="flex-1 font-mono" />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add address"}
        </Button>
      </form>
      {state?.error ? <div className="mt-2"><ErrorNote>{state.error}</ErrorNote></div> : null}
    </Card>
  );
}
