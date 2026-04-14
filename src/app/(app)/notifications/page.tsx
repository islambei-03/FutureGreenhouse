"use client";

import { useEffect, useMemo, useState } from "react";
import RippleButton from "@/components/ui/RippleButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useI18n } from "@/components/i18n/I18nContext";

type NotificationType = "тревога" | "предупреждение" | "информация" | "успех";

type NotificationRow = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  is_read: number;
  created_at: string;
};

function typeColor(type: NotificationType) {
  if (type === "тревога") return "bg-red-500";
  if (type === "предупреждение") return "bg-yellow-400";
  if (type === "успех") return "bg-emerald-400";
  return "bg-blue-400";
}

function toneByType(type: NotificationType) {
  if (type === "тревога") return "danger" as const;
  if (type === "предупреждение") return "warning" as const;
  if (type === "успех") return "success" as const;
  return "info" as const;
}

function typeKey(type: NotificationType) {
  if (type === "тревога") return "enum.notificationType.alarm" as const;
  if (type === "предупреждение") return "enum.notificationType.warning" as const;
  if (type === "успех") return "enum.notificationType.success" as const;
  return "enum.notificationType.info" as const;
}

export default function NotificationsPage() {
  const { t: tr } = useI18n();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const unread = useMemo(() => items.filter((i) => !i.is_read).length, [items]);

  async function load() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as null | { ok: boolean; notifications: NotificationRow[] };
    if (data?.ok) setItems(data.notifications);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => null);
    await load();
  }

  async function markOne(id: number) {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  }

  return (
    <main className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{tr("notifications.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("notifications.unread")}:{" "}
              <span className="text-[var(--text)] font-medium">{unread}</span>
            </div>
          </div>
          <RippleButton onClick={markAll} variant="outline" className="px-4 py-2.5">
            {tr("notifications.markAllRead")}
          </RippleButton>
        </div>
      </Card>

      <div className="space-y-3">
        {!items.length ? (
          <Card className="p-6">
            <div className="h-4 w-44 rounded-lg fg-skeleton" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl fg-skeleton" />
              ))}
            </div>
          </Card>
        ) : null}
        {items.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => (!n.is_read ? markOne(n.id) : null)}
            className={[
              "w-full text-left rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden transition",
              "hover:bg-white/5",
              n.is_read ? "opacity-85" : "",
            ].join(" ")}
          >
            <div className="flex">
              <div className={`w-1.5 ${typeColor(n.type)}`} />
              <div className="p-5 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="font-semibold truncate">{n.title}</div>
                      <Badge tone={toneByType(n.type)}>{tr(typeKey(n.type))}</Badge>
                    {!n.is_read ? (
                      <span className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span className="inline-block size-2 rounded-full bg-[color:var(--accent)]" />
                        {tr("notifications.new")}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-[var(--muted)]">{n.created_at}</div>
                </div>
                <div className="mt-2 text-sm text-[var(--muted)]">{n.message}</div>
                {!n.is_read ? (
                  <div className="mt-3 text-xs text-[var(--muted)]">{tr("notifications.clickToMarkRead")}</div>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

