import type { UserRole } from "@/lib/auth";

export const RoleLabel: Record<UserRole, string> = {
  admin: "Администратор",
  agronomist: "Агроном",
  operator: "Оператор",
  viewer: "Наблюдатель",
};

export function hasRole(userRole: UserRole, allowed: UserRole[] | "any") {
  if (allowed === "any") return true;
  return allowed.includes(userRole);
}

