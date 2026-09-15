import { signOut } from "@/lib/auth-actions";
import { Button, Card } from "@/components/ui";

export default function PendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <Card className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warn-soft text-warn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 8v5M12 16v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display text-lg font-extrabold text-text">Your account is pending review</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-text-dim">
          An admin is reviewing your registration and ID document. You&apos;ll be able to sign in
          normally once it&apos;s approved — there&apos;s nothing else to do in the meantime.
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
