"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { homeOf, useSession } from "@/front/hooks/useSession";

export default function Home() {
  const router = useRouter();
  const { user } = useSession();
  useEffect(() => {
    if (user) router.replace(homeOf(user.role));
  }, [user, router]);
  return <div className="center muted">Chargement…</div>;
}
