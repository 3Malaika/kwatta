"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role, User } from "@/domain/types";
import { post } from "../lib/api";
import { clearCache, useQuery } from "./useQuery";

export const homeOf = (role: Role) => (role === "client" ? "/client" : role === "collector" ? "/collecteur" : "/admin");

/** Redirige vers /login si non connecté, et vers le bon espace si le rôle ne correspond pas. */
export function useSession(requiredRole?: Role) {
  const router = useRouter();
  const { data, error, loading } = useQuery<{ user: User }>("/api/auth/me");
  const user = data?.user ?? null;

  useEffect(() => {
    if (error?.code === "UNAUTHORIZED") router.replace("/login");
    else if (user && requiredRole && user.role !== requiredRole) router.replace(homeOf(user.role));
  }, [error, user, requiredRole, router]);

  const logout = async () => {
    await post("/api/auth/logout").catch(() => undefined);
    clearCache();
    router.replace("/login");
  };

  const ready = !!user && (!requiredRole || user.role === requiredRole);
  return { user, ready, loading, logout };
}
