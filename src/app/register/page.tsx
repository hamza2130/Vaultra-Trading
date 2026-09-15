import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 font-display text-xl font-extrabold text-text">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-ink text-sm font-extrabold text-[#04140F]">
            V
          </span>
          Vaultra
        </div>
        <RegisterForm />
        <p className="mt-5 text-center text-[13px] text-text-dim">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-accent-ink hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
