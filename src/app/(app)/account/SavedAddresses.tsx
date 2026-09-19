"use client";

import { useActionState, useRef } from "react";
import { Button, Card, ErrorNote, TextInput } from "@/components/ui";
import { addSavedAddress, removeSavedAddress } from "./actions";

type Address = { id: string; label: string; address: string };

export function SavedAddresses({ addresses }: { addresses: Address[] }) {
  const [state, action, pending] = useActionState(addSavedAddress, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <h3 className="mb-1 font-display text-[15px] font-extrabold text-text">Saved withdrawal addresses</h3>
      <p className="mb-4 text-[12.5px] text-text-dim">
        TRC20 addresses you control — pick one at withdrawal time. Separate from Vaultra&apos;s own
        deposit address.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {addresses.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-4 text-center text-[12.5px] text-text-faint">
            No saved addresses yet.
          </p>
        ) : (
          addresses.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5"
            >
              <div>
                <div className="text-[13px] font-bold text-text">{a.label}</div>
                <div className="font-mono text-[11.5px] text-text-dim">{a.address}</div>
              </div>
              <form action={removeSavedAddress}>
                <input type="hidden" name="addressId" value={a.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Remove
                </Button>
              </form>
            </div>
          ))
        )}
      </div>

      <form
        ref={formRef}
        action={async (formData) => {
          await action(formData);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <TextInput name="label" placeholder="Label (e.g. Personal Wallet)" required className="flex-1" />
        <TextInput name="address" placeholder="TRC20 address (T...)" required className="flex-1 font-mono" />
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </form>
      {state?.error ? <ErrorNote>{state.error}</ErrorNote> : null}
    </Card>
  );
}
