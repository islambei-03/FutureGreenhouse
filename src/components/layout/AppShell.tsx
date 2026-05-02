"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { AuthProvider, type MeUser } from "@/components/auth/AuthContext";
import { I18nProvider } from "@/components/i18n/I18nContext";
import { LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

type MeResponse =
  | { ok: true; user: { id: string; fullName: string; login: string; role: UserRole; roleLabel: string } }
  | { ok: false };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [initialLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ru";
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw === "kk" || raw === "ru" ? raw : "ru";
  });

  // Уведомления: пока лёгкая загрузка по API (без вебсокетов).
  const [notificationCount, setNotificationCount] = useState(0);

  const role = useMemo<UserRole>(() => {
    if (me && me.ok) return me.user.role;
    // До загрузки /api/auth/me показываем самый "безопасный" read-only профиль
    return "director";
  }, [me]);

  const fullName = useMemo(() => {
    if (me && me.ok) return me.user.fullName;
    return "Пользователь";
  }, [me]);

  const onMe = useCallback((data: MeResponse) => setMe(data), []);

  const onNotifications = useCallback((count: number) => setNotificationCount(count), []);

  const meUser = useMemo<MeUser | null>(() => {
    if (!me || !me.ok) return null;
    return me.user;
  }, [me]);

  return (
    <I18nProvider initialLocale={initialLocale}>
      <AuthProvider me={meUser}>
        <div className="min-h-screen flex">
          <Sidebar role={role} notificationCount={notificationCount} fullName={fullName} />
          <div className="flex-1 min-w-0 flex flex-col">
            <Topbar notificationCount={notificationCount} onMe={onMe} onNotifications={onNotifications} />
            <div key={pathname} className="flex-1 min-w-0 p-4 md:p-6 animate-fadeIn">
              {children}
            </div>
          </div>
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}

