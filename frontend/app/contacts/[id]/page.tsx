// frontend/app/contacts/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Nav from "@/components/Nav";

type Note = { id:number; body:string; createdAt:string };

export default function ContactNotes() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await api.get(`/contacts/${id}/notes`);
    setNotes(r.data.items || []);
    setLoading(false);
  };

  const add = async () => {
    if (!body.trim()) return;
    await api.post(`/contacts/${id}/notes`, { body });
    setBody("");
    await load();
  };

  useEffect(() => { load(); }, [id]);

  return (
    <RequireAuth>
      <Nav />
      <main className="p-6 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Contact #{id} — Notes</h1>
        <div className="flex gap-2">
          <input className="flex-1 border p-2 rounded" placeholder="Write a note…" value={body} onChange={e=>setBody(e.target.value)} />
          <button className="px-3 py-2 bg-black text-white rounded" onClick={add}>Add</button>
        </div>
        {loading ? <p>Loading…</p> : (
          <ul className="divide-y border rounded">
            {notes.map(n => (
              <li key={n.id} className="p-3">
                <div className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                <div>{n.body}</div>
              </li>
            ))}
            {notes.length === 0 && <li className="p-3 text-gray-500">No notes yet</li>}
          </ul>
        )}
      </main>
    </RequireAuth>
  );
}
