import type { Metadata } from "next";
import ThemeToggle from "@/app/_components/ThemeToggle";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — Scrap Business CRM",
  description: "Sign in to manage inventory, customers, and orders.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1">
      {/* Branding panel — hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 font-bold">
            S
          </div>
          <span className="text-lg font-semibold">Scrap Business CRM</span>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">
            Run your scrap yard from one place.
          </h2>
          <p className="max-w-sm text-slate-400">
            Track customers, purchases, inventory, and payouts without the
            spreadsheets.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Scrap Business CRM
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col items-center justify-center bg-blue-50 px-6 py-12 dark:bg-slate-950 lg:w-1/2">
        <ThemeToggle className="absolute right-6 top-6" />
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-1.5 lg:items-start">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white lg:hidden">
              S
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to your account to continue.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
