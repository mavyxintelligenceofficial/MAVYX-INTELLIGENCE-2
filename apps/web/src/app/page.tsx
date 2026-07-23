'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store';

/**
 * Landing page. If a token already exists (from a previous session),
 * skip straight to the profile page instead of showing login/signup
 * links again.
 */
export default function HomePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && token) {
      router.replace('/profile');
    }
  }, [isHydrated, token, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Mavyx Intelligence</h1>
        <p className="mt-2 text-slate-600">AI-assisted Forex market intelligence.</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-700"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="w-full rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          Create an account
        </Link>
      </div>
    </main>
  );
}
