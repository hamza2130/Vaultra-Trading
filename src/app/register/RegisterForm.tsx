"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { Button, Card, ErrorNote, Field, Select, TextInput } from "@/components/ui";
import { prepareUpload } from "@/lib/prepare-upload";
import { MAX_UPLOAD_LABEL } from "@/lib/upload-limits";
import { registerUser } from "./actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerUser, undefined);
  const [fileError, setFileError] = useState<string | null>(null);

  // Shrink big phone photos before submit so the upload stays under the hosting limit.
  async function onDocumentChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const chosen = input.files?.[0];
    setFileError(null);
    input.setCustomValidity("");
    if (!chosen) return;

    const result = await prepareUpload(chosen);
    if (result.error || !result.file) {
      setFileError(result.error ?? "Could not read that file.");
      input.setCustomValidity(result.error ?? "Invalid file");
      return;
    }
    if (result.file !== chosen) {
      const dt = new DataTransfer();
      dt.items.add(result.file);
      input.files = dt.files;
    }
  }

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
        <Field label="ID document" hint={`Photo or PDF, up to ${MAX_UPLOAD_LABEL}. Large photos are shrunk automatically.`}>
          <input
            name="document"
            type="file"
            required
            accept="image/*,application/pdf"
            onChange={onDocumentChange}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-text file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-accent-ink"
          />
        </Field>
        <ErrorNote>{fileError ?? state?.error}</ErrorNote>
        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "Submitting…" : "Submit for review"}
        </Button>
      </form>
    </Card>
  );
}
