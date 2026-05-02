import { describe, expect, it } from "vitest";
import type { UserRole } from "@/lib/auth";

function isAllowed(allowed: UserRole[] | "any", role: UserRole) {
  if (allowed === "any") return true;
  return allowed.includes(role);
}

describe("rbac", () => {
  it("any allows all roles", () => {
    const roles: UserRole[] = ["admin", "director", "agronomist", "worker"];
    for (const r of roles) expect(isAllowed("any", r)).toBe(true);
  });

  it("list restricts roles", () => {
    expect(isAllowed(["admin"], "admin")).toBe(true);
    expect(isAllowed(["admin"], "director")).toBe(false);
  });
});

