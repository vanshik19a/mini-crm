'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

type Health = { ok: boolean } | { error: string };

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  const checkHealth = async () => {
    try {
      const r = await axios.get(`${apiBase}/health`, { timeout: 5000 });
      setHealth(r.data);
    } catch (e: any) {
      setHealth({ error: String(e?.message || e) });
    }
  };

  useEffect(() => { checkHealth(); }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold">Mini-CRM</h1>
      <div className="mt-6 max-w-3xl space-y-3">
        <div className="rounded border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">API health</p>
            <button onClick={checkHealth} className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
              Refresh
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-400">
            Base URL: <code className="text-gray-200">{apiBase}</code>
          </p>
          <pre className="mt-3 rounded bg-gray-100 p-3 text-black">{JSON.stringify(health, null, 2)}</pre>
        </div>
      </div>
    </main>
  );
}
