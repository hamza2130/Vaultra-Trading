import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 font-display text-xl font-extrabold text-text">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-ink text-sm font-extrabold text-[#04140F]">
            V
          </span>
          Vaultra
        </div>
        <LoginForm />
        <p className="mt-5 text-center text-[13px] text-text-dim">
          New here?{" "}
          <Link href="/register" className="font-semibold text-accent-ink hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
