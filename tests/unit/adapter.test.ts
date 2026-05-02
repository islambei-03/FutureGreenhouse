import { describe, expect, it } from "vitest";
import { createDbAdapter } from "@/lib/db/adapter";

type Executor = { query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }> };

function mockExec() {
  const calls: Array<{ text: string; values?: unknown[] }> = [];
  const executor: Executor = {
    query: async (text: string, values?: unknown[]) => {
      calls.push({ text, values });
      return { rows: [], rowCount: 0 };
    },
  };
  return { executor, calls };
}

describe("db adapter", () => {
  it("converts positional ? params to $1..", async () => {
    const { executor, calls } = mockExec();
    const d = createDbAdapter(executor);
    await d.prepare("SELECT * FROM t WHERE a=? AND b=?").all(1, "x");
    expect(calls[0]?.text).toBe("SELECT * FROM t WHERE a=$1 AND b=$2");
    expect(calls[0]?.values).toEqual([1, "x"]);
  });

  it("converts named @params to $1..", async () => {
    const { executor, calls } = mockExec();
    const d = createDbAdapter(executor);
    await d.prepare("UPDATE t SET a=@a WHERE id=@id").run({ a: 5, id: 9 });
    expect(calls[0]?.text).toBe("UPDATE t SET a=$1 WHERE id=$2");
    expect(calls[0]?.values).toEqual([5, 9]);
  });

  it("does not append RETURNING id when INSERT already has RETURNING", async () => {
    const { executor, calls } = mockExec();
    const d = createDbAdapter(executor);
    await d
      .prepare(
        `INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key`,
      )
      .run("k", "v");
    expect(calls[0]?.text).toContain("RETURNING key");
    expect(calls[0]?.text).not.toContain("RETURNING id");
  });
});

