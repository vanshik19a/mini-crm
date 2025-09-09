// frontend/components/Nav.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Nav() {
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <nav className="px-4 py-2 border-b flex items-center gap-3">
      <a href="/" className="font-semibold">Mini-CRM</a>
      <Link href="/contacts" className="underline">Contacts</Link>
      <Link href="/deals" className="underline">Deals</Link>
      <Link href="/analytics" className="underline">Analytics</Link>
      <button onClick={logout} className="ml-auto px-2 py-1 border rounded">Logout</button>
    </nav>
  );
}
