'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { getProfile, updateProfile } from '@/features/profile/api';
import { Profile } from '@/features/profile/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/services/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const { token, isHydrated, hydrate, logout } = useAuthStore();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.replace('/login');
      return;
    }

    getProfile(token)
      .then((data) => {
        setProfile(data);
        setDisplayName(data.displayName || '');
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load your profile.');
      })
      .finally(() => setIsLoading(false));
  }, [isHydrated, token, router]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!token) return;

    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await updateProfile(token, { displayName });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (!isHydrated || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-slate-600">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
          <button onClick={handleLogout} className="text-sm text-slate-500 underline">
            Log out
          </button>
        </div>

        {profile && (
          <p className="text-sm text-slate-600">
            Role: <span className="font-medium">{profile.role}</span>
          </p>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {saved && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Saved.
          </p>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-slate-700">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSaved(false);
              }}
              maxLength={100}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <Button type="submit" isLoading={isSaving}>
            Save changes
          </Button>
        </form>

        <Link href="/market" className="block text-center text-sm text-slate-600 underline">
          View a market quote
        </Link>
      </div>
    </main>
  );
}
