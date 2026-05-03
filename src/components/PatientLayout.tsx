"use client";

import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getUnreadNotificationsCount } from "@/lib/firestore";
import { NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notificationEvents";
import toast from "react-hot-toast";

function HeartLogo() {
  return (
    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function NavBadge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
      {value}
    </span>
  );
}

export default function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = useMemo(
    () => [
      {
        href: "/patient/dashboard",
        label: "Dashboard",
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        href: "/patient/book-appointment",
        label: "Book Appointment",
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        href: "/patient/appointments",
        label: "My Appointments",
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        href: "/patient/notifications",
        label: "Notifications",
        badge: unreadCount,
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082A2 2 0 0113 18.5h-2a2 2 0 01-1.857-1.418M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
          </svg>
        ),
      },
      {
        href: "/patient/profile",
        label: "My Profile",
        icon: (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ],
    [unreadCount]
  );

  const loadUnreadCount = useCallback(async () => {
    if (!profile) return setUnreadCount(0);
    try {
      const count = await getUnreadNotificationsCount(profile.uid, profile.role);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [profile]);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount, pathname]);

  useEffect(() => {
    const handler = () => loadUnreadCount();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler);
  }, [loadUnreadCount]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const avatar = profile?.photoURL ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.photoURL} alt={profile.fullName} className="h-full w-full rounded-full object-cover" />
  ) : (
    <span className="text-sm font-bold text-primary-700">{profile?.fullName?.[0]?.toUpperCase() || "P"}</span>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-100 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-teal-500 shadow-sm">
              <HeartLogo />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-slate-900">ClinicCare Medical Center</p>
              <p className="text-xs text-slate-400">Patient Portal</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={active ? "text-primary-600" : "text-slate-400"}>{item.icon}</span>
                  <span>{item.label}</span>
                  <NavBadge value={item.badge || 0} />
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 px-4 py-4">
            <div className="mb-3 flex items-center gap-3 rounded-2xl px-3 py-2.5">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                {avatar}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">{profile?.fullName || "Patient"}</p>
                <p className="truncate text-sm text-slate-400">{profile?.email || ""}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 lg:hidden"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-900">
                  {navItems.find((item) => item.href === pathname)?.label || "ClinicCare"}
                </h1>
              </div>
              <NotificationsPanel
                profile={profile}
                unreadCount={unreadCount}
                onNotificationsChange={loadUnreadCount}
              />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
