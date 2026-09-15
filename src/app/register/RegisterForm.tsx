"use client";

import { useActionState } from "react";
import { Button, Card, ErrorNote, Field, Select, TextInput } from "@/components/ui";
import { registerUser } from "./actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerUser, undefined);

  return (
    <Card>
      <h1 className="font-display text-lg font-extrabold text-text">Create your account</h1>
      <p className="mb-5 mt-1 text-[13px] text-text-dim">
        Registration is reviewed by an admin before you can sign in. You&apos;ll see a pending
        screen until it&apos;s approved.
      </p>
      <form action={action} className="flex flex-col gap-4">
        <Field label="Full name">
          <TextInput name="fullName" required autoComplete="name" />
        </Field>
        <Field label="Email">
          <TextInput name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Username">
          <TextInput name="username" required autoComplete="username" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <TextInput name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="ID document type">
          <Select name="docType" required defaultValue="">
            <option value="" disabled>
              Select a document type
            </option>
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="student_card">Student card</option>
          </Select>
        </Field>
        <Field label="ID document" hint="Image or PDF, up to 6MB.">
          <input
            name="document"
            type="file"
            required
            accept="image/*,application/pdf"
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-accent-ink"
          />
        </Field>
        <ErrorNote>{state?.error}</ErrorNote>
        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </Card>
  );
}
