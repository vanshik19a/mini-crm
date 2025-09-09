// frontend/app/contacts/new/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import Nav from "@/components/Nav";

export default function NewContact() {
  const [form, setForm] = useState({ name:"", email:"", company:"", phone:"" });
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.post("/contacts", form);
      router.push("/contacts");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to create contact");
    }
  };

  return (
    <RequireAuth>
      <Nav />
      <main className="p-6 max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold">New Contact</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          {["name","email","company","phone"].map((k) => (
            <input key={k} className="w-full border p-2 rounded" placeholder={k}
              value={(form as any)[k]} onChange={(e)=>setForm({...form, [k]: e.target.value})} />
          ))}
          <button className="px-3 py-2 bg-black text-white rounded">Create</button>
        </form>
        {err && <p className="text-red-600">{err}</p>}
      </main>
    </RequireAuth>
  );
}
