"use client";

import { useActionState } from "react";
import { Button, Card, ErrorNote, Field, TextInput } from "@/components/ui";
import { updateProfile } from "./actions";

export function ProfileForm({
  fullName,
  username,
  email,
}: {
  fullName: string;
  username: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  return (
    <Card>
      <h3 className="mb-1 font-display text-[15px] font-extrabold text-text">Profile details</h3>
      <p className="mb-4 text-[12.5px] text-text-dim">Visible to Vaultra admins for account verification.</p>
      <form action={action} className="flex flex-col gap-3.5">
        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Full name">
              <TextInput name="fullName" defaultValue={fullName} required />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Username">
              <TextInput name="username" defaultValue={username} required />
            </Field>
          </div>
        </div>
        <Field label="Email">
          <TextInput value={email} disabled className="opacity-60" />
        </Field>
        {state?.error ? <ErrorNote>{state.error}</ErrorNote> : null}
        {state?.success ? (
          <p className="rounded-lg border border-pos-soft bg-pos-soft px-3 py-2 text-[12.5px] font-medium text-pos">
            Profile updated.
          </p>
        ) : null}
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="self-start">
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Card>
  );
}
