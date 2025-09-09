// frontend/app/deals/page.tsx
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Nav from "@/components/Nav";

type Deal = { id:number; title:string; amount:number; stage:string; contactId:number; createdAt:string };

export default function Deals() {
  const [items, setItems] = useState<Deal[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [stage, setStage] = useState("Prospect");
  const [contactId, setContactId] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const load = async (opts?: { resetPage?: boolean }) => {
    const nextPage = opts?.resetPage ? 1 : page;
    const r = await api.get("/deals", { params: { page: nextPage, pageSize } });
    setItems(r.data.items || []);
    setTotal(r.data.total || 0);
    setPage(nextPage);
  };

  const create = async () => {
    if (!title || !contactId) return;
    await api.post("/deals", { title, amount: Number(amount || 0), stage, contactId: Number(contactId) });
    setTitle(""); setAmount(""); setStage("Prospect"); setContactId("");
    await load({ resetPage: true });
  };

  const markQualified = async (id:number) => {
    await api.patch(`/deals/${id}`, { stage: "Qualified" });
    await load();
  };

  const remove = async (id:number) => {
    if (!confirm("Delete this deal?")) return;
    await api.delete(`/deals/${id}`);
    const newTotal = total - 1;
    const maxPage = Math.max(1, Math.ceil(newTotal / pageSize));
    setPage(p => Math.min(p, maxPage));
    await load();
  };

  useEffect(() => { load(); /* initial */ }, []); // eslint-disable-line

  return (
    <RequireAuth>
      <Nav />
      <main className="p-6 max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Deals</h1>

        <div className="grid grid-cols-4 gap-2">
          <input className="border p-2 rounded" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Amount" type="number"
            value={amount} onChange={e=>setAmount(e.target.value === "" ? "" : Number(e.target.value))} />
          <select className="border p-2 rounded" value={stage} onChange={e=>setStage(e.target.value)}>
            <option>Prospect</option><option>Qualified</option><option>Negotiation</option><option>Won</option><option>Lost</option>
          </select>
          <input className="border p-2 rounded" placeholder="Contact ID" type="number"
            value={contactId} onChange={e=>setContactId(e.target.value === "" ? "" : Number(e.target.value))} />
          <button className="col-span-4 px-3 py-2 bg-black text-white rounded" onClick={create}>Create Deal</button>
        </div>

        <ul className="divide-y border rounded">
          {items.map(d => (
            <li key={d.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.title} — ₹{d.amount}</div>
                  <div className="text-sm text-gray-500">Stage: {d.stage} · Contact #{d.contactId} · {new Date(d.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 border rounded" onClick={()=>markQualified(d.id)}>Mark Qualified</button>
                  <button className="px-2 py-1 border rounded" onClick={()=>remove(d.id)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
          {items.length === 0 && <li className="p-3 text-gray-500">No deals</li>}
        </ul>

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-600">
            Page {page} · Showing {items.length} of {total}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={!canPrev}
              onClick={async () => { setPage(p => p - 1); await load(); }}
            >
              ← Prev
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={!canNext}
              onClick={async () => { setPage(p => p + 1); await load(); }}
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
