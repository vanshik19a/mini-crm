// frontend/app/analytics/page.tsx
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Nav from "@/components/Nav";

type StageAgg = { stage: string; count: number; amount: number };
type MonthAgg = { month: string; count: number; amount: number };

export default function Analytics() {
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [byStage, setByStage] = useState<StageAgg[]>([]);
  const [byMonth, setByMonth] = useState<MonthAgg[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await api.get("/analytics");
    setUpdatedAt(r.data.updatedAt);
    setByStage(r.data.dealsByStage || []);
    setByMonth(r.data.dealsByMonth || []);
    setLoading(false);
  };

  const recalc = async () => {
    await api.post("/analytics:recalc");
    setTimeout(load, 800);
  };

  useEffect(() => { load(); }, []);

  return (
    <RequireAuth>
      <Nav />
      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2 items-center">
          <div className="text-sm text-gray-500">Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</div>
          <button className="px-3 py-2 bg-black text-white rounded" onClick={recalc}>Recalculate</button>
        </div>

        {loading ? <p>Loading…</p> : (
          <>
            <section className="space-y-2">
              <h2 className="font-semibold">Deals by stage</h2>
              <ul className="divide-y border rounded">
                {byStage.map(s => (
                  <li key={s.stage} className="p-3 flex justify-between">
                    <span>{s.stage}</span>
                    <span>{s.count} deals · ₹{s.amount}</span>
                  </li>
                ))}
                {byStage.length === 0 && <li className="p-3 text-gray-500">No data</li>}
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-semibold">Deals by month</h2>
              <ul className="divide-y border rounded">
                {byMonth.map(m => (
                  <li key={m.month} className="p-3 flex justify-between">
                    <span>{m.month}</span>
                    <span>{m.count} deals · ₹{m.amount}</span>
                  </li>
                ))}
                {byMonth.length === 0 && <li className="p-3 text-gray-500">No data</li>}
              </ul>
            </section>
          </>
        )}
      </main>
    </RequireAuth>
  );
}
