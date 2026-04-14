"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/auth";

export type MeUser = {
  id: string;
  fullName: string;
  login: string;
  role: UserRole;
  roleLabel: string;
};

const AuthCtx = createContext<MeUser | null>(null);

export function AuthProvider({ me, children }: { me: MeUser | null; children: React.ReactNode }) {
  return <AuthCtx.Provider value={me}>{children}</AuthCtx.Provider>;
}

export function useMe() {
  return useContext(AuthCtx);
}

