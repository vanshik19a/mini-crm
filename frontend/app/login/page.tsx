'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@crm.test');
  const [password, setPassword] = useState('pass1234');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      // if user not created yet, try signup once (ignore failure if exists)
      try { await api.post('/auth/signup', { email, password }); } catch {}
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setMsg('Logged in! Redirecting…');
      router.push('/contacts');
    } catch (err: any) {
      setMsg(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded border border-gray-700 p-6">
        <h1 className="text-xl font-bold">Log in</h1>
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded bg-white/10 p-2 outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            className="mt-1 w-full rounded bg-white/10 p-2 outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>
        <button
          disabled={loading}
          className="w-full rounded bg-white/10 py-2 hover:bg-white/20 disabled:opacity-50"
        >
          {loading ? 'Please wait…' : 'Log in'}
        </button>
        {msg && <p className="text-sm text-gray-300">{msg}</p>}
      </form>
    </main>
  );
}
