// frontend/components/RequireAuth.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) router.replace("/login");
    else setOk(true);
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
