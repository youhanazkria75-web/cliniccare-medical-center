"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import AppointmentDetailsModal from "@/components/AppointmentDetailsModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAppointmentById,
  getNotificationsForUser,
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/lib/firestore";
import { emitNotificationsUpdated } from "@/lib/notificationEvents";
import type { AppNotification, Appointment } from "@/types";
import toast from "react-hot-toast";

type Filter = "all" | "unread" | "read";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  const load = async () => {
    if (!user || !profile) return;
    setFetching(true);
    const notifications = await getNotificationsForUser(user.uid, profile.role);
    setItems(notifications);
    setFetching(false);
    emitNotificationsUpdated();
  };

  useEffect(() => {
    if (!loading && !user) return router.push("/login");
    if (!loading && profile?.role !== "admin") return router.push("/patient/dashboard");
    if (user && profile) load();
  }, [user, profile, loading, router]);

  const unreadCount = items.filter((item) => !item.isRead).length;

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter(
      (item) =>
        (filter === "all" || (filter === "unread" ? !item.isRead : item.isRead)) &&
        (!term || item.title.toLowerCase().includes(term) || item.message.toLowerCase().includes(term))
    );
  }, [items, filter, search]);

  const handleMarkRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    await markNotificationAsRead(notification.id);
    setItems((current) => current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
    emitNotificationsUpdated();
  };

  const handleMarkAll = async () => {
    const ids = items.filter((item) => !item.isRead).map((item) => item.id);
    if (!ids.length) return;
    await markNotificationsAsRead(ids);
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    emitNotificationsUpdated();
    toast.success("All notifications marked as read.");
  };

  const handleOpen = async (notification: AppNotification) => {
    await handleMarkRead(notification);
    if (notification.relatedAppointmentId) {
      const nextAppointment = await getAppointmentById(notification.relatedAppointmentId);
      if (nextAppointment) {
        setAppointment(nextAppointment);
      }
    }
  };

  if (loading || fetching) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {appointment && <AppointmentDetailsModal appointment={appointment} onClose={() => setAppointment(null)} />}

      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500">Manage read and unread ClinicCare updates.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="btn-secondary">Refresh</button>
            <button onClick={handleMarkAll} className="btn-primary">Mark all as read</button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <input className="input-field" placeholder="Search notifications" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="flex gap-2">
            {(["all", "unread", "read"] as Filter[]).map((value) => (
              <button key={value} onClick={() => setFilter(value)} className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize ${filter === value ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
                {value}
                {value === "unread" ? ` (${unreadCount})` : ""}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="card p-16 text-center text-sm text-slate-500">No notifications yet.</div>
        ) : (
          <div className="grid gap-3">
            {filteredItems.map((notification) => (
              <div key={notification.id} className={`card p-5 ${notification.isRead ? "" : "bg-primary-50/30 ring-1 ring-primary-100"}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-primary-500"}`} />
                      <h3 className="font-bold text-slate-900">{notification.title}</h3>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">{notification.isRead ? "Read" : "Unread"}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{formatDate(notification.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpen(notification)} className="btn-secondary px-3 py-2 text-xs">View details</button>
                    {!notification.isRead && <button onClick={() => handleMarkRead(notification)} className="btn-primary px-3 py-2 text-xs">Mark read</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
