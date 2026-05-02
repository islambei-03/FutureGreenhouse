import type { UserRole } from "@/lib/auth";

export const RoleLabel: Record<UserRole, string> = {
  admin: "Администратор",
  director: "Директор",
  agronomist: "Агроном",
  worker: "Рабочий",
};

export function hasRole(userRole: UserRole, allowed: UserRole[] | "any") {
  if (allowed === "any") return true;
  return allowed.includes(userRole);
}

