'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/http';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
      };

      await fetchJson<{ success: boolean }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/15">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Portfolio CMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your portfolio</p>
        </div>

        <div className="admin-surface rounded-2xl p-8 shadow-2xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                maxLength={64}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin"
                className="admin-control w-full rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/70"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                maxLength={256}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="********"
                className="admin-control w-full rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/70"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="admin-primary-btn w-full rounded-xl py-2.5 font-medium disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
