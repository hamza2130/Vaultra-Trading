import { signOut } from "@/lib/auth-actions";
import { Button, Card } from "@/components/ui";

export default function RestrictedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <Card className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neg-soft text-neg">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M7 7l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display text-lg font-extrabold text-text">This account is restricted</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-text-dim">
          An admin has restricted access to this account. Contact the Vaultra operations team if
          you believe this is a mistake.
        </p>
        <form action={signOut} className="mt-5">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}
