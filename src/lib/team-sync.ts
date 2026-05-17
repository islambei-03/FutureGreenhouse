import bcrypt from "bcryptjs";
import type { Pool } from "pg";
import { createDbAdapter, type DbAdapter } from "@/lib/db/adapter";

const SALT_ROUNDS = 10;

const TEAM_USERS = [
  { full_name: "Айгуль Жумабаева", login: "aigul", password: "aigul123", role: "agronomist" as const },
  { full_name: "Руслан Карабаев", login: "ruslan", password: "ruslan123", role: "worker" as const },
  { full_name: "София Нурбекова", login: "sofia", password: "sofia123", role: "worker" as const },
  { full_name: "Мадина Ораз", login: "madina", password: "madina123", role: "director" as const },
];

const TEAM_WORKERS = [
  { full_name: "Руслан Карабаев", greenhouseIndex: 0, phone: "+7 701 100 01 01" },
  { full_name: "София Нурбекова", greenhouseIndex: 1, phone: "+7 701 100 01 02" },
] as const;

export type TeamSyncResult = {
  usersCreated: string[];
  usersUpdated: string[];
  employeesCreated: string[];
  links: string[];
};

export async function syncTeamWorkers(a: DbAdapter): Promise<string[]> {
  const created: string[] = [];
  const ghRows = (await a.prepare("SELECT id FROM greenhouses ORDER BY id ASC LIMIT 2").all()) as Array<{ id: number }>;
  const insert = a.prepare(`
    INSERT INTO employees (full_name, position, greenhouse_id, phone, status, notes)
    VALUES (@full_name, 'Рабочий', @greenhouse_id, @phone, 'на смене', '')
  `);
  for (let i = 0; i < TEAM_WORKERS.length; i++) {
    const w = TEAM_WORKERS[i]!;
    const ghId = ghRows[i]?.id;
    if (!ghId) continue;
    const exists = (await a.prepare("SELECT id FROM employees WHERE full_name = ?").get(w.full_name)) as
      | { id: number }
      | undefined;
    if (!exists) {
      await insert.run({ full_name: w.full_name, greenhouse_id: ghId, phone: w.phone });
      created.push(w.full_name);
    }
  }
  return created;
}

export async function syncTeamUsers(a: DbAdapter): Promise<{ created: string[]; updated: string[]; links: string[] }> {
  const created: string[] = [];
  const updated: string[] = [];
  const links: string[] = [];

  const insert = a.prepare(`
    INSERT INTO users (full_name, login, password_hash, role, is_active)
    VALUES (@full_name, @login, @password_hash, @role, 1)
  `);

  for (const u of TEAM_USERS) {
    const exists = (await a.prepare("SELECT id FROM users WHERE login = ?").get(u.login)) as { id: number } | undefined;
    if (!exists) {
      const password_hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
      await insert.run({ full_name: u.full_name, login: u.login, password_hash, role: u.role });
      created.push(`${u.login} (${u.role})`);
    } else {
      await a.prepare("UPDATE users SET full_name = ?, role = ?, is_active = 1 WHERE login = ?").run(
        u.full_name,
        u.role,
        u.login,
      );
      updated.push(u.login);
    }
  }

  const workers = (await a
    .prepare(
      "SELECT id, full_name FROM employees WHERE position = 'Рабочий' AND full_name IN ('Руслан Карабаев', 'София Нурбекова') ORDER BY greenhouse_id ASC, id ASC",
    )
    .all()) as Array<{ id: number; full_name: string }>;

  const ruslan = workers.find((w) => w.full_name.includes("Руслан"));
  const sofia = workers.find((w) => w.full_name.includes("София"));
  if (ruslan) {
    await a.prepare("UPDATE users SET employee_id = ? WHERE login = 'ruslan'").run(ruslan.id);
    links.push(`ruslan → ${ruslan.full_name}`);
  }
  if (sofia) {
    await a.prepare("UPDATE users SET employee_id = ? WHERE login = 'sofia'").run(sofia.id);
    links.push(`sofia → ${sofia.full_name}`);
  }

  return { created, updated, links };
}

export async function syncTeamAll(pool: Pool): Promise<TeamSyncResult> {
  const a = createDbAdapter(pool);
  const employeesCreated = await syncTeamWorkers(a);
  const { created, updated, links } = await syncTeamUsers(a);
  return {
    usersCreated: created,
    usersUpdated: updated,
    employeesCreated,
    links,
  };
}

export { TEAM_USERS, TEAM_WORKERS };
