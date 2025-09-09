// frontend/app/contacts/[id]/edit/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Nav from "@/components/Nav";

export default function EditContact() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({ name:"", email:"", company:"", phone:"" });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await api.get(`/contacts/${id}`);
      setForm({
        name: r.data.name ?? "",
        email: r.data.email ?? "",
        company: r.data.company ?? "",
        phone: r.data.phone ?? "",
      });
    })();
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.patch(`/contacts/${id}`, form);
      router.push("/contacts");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Update failed");
    }
  };

  return (
    <RequireAuth>
      <Nav />
      <main className="p-6 max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Edit Contact #{id}</h1>
        <form onSubmit={save} className="space-y-3">
          {["name","email","company","phone"].map((k) => (
            <input key={k} className="w-full border p-2 rounded" placeholder={k}
              value={(form as any)[k]} onChange={(e)=>setForm({...form, [k]: e.target.value})} />
          ))}
          <button className="px-3 py-2 bg-black text-white rounded">Save</button>
        </form>
        {err && <p className="text-red-600">{err}</p>}
      </main>
    </RequireAuth>
  );
}
