"use client";

import { useActionState } from "react";
import { Button, Card, ErrorNote, Field, TextInput } from "@/components/ui";
import { loginUser } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginUser, undefined);

  return (
    <Card>
      <h1 className="font-display text-lg font-extrabold text-text">Sign in</h1>
      <p className="mb-5 mt-1 text-[13px] text-text-dim">Access your Vaultra account.</p>
      <form action={action} className="flex flex-col gap-4">
        <Field label="Email">
          <TextInput name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <TextInput name="password" type="password" required autoComplete="current-password" />
        </Field>
        <ErrorNote>{state?.error}</ErrorNote>
        <Button type="submit" disabled={pending} className="mt-1">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
