"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AppointmentDetailsModal from "@/components/AppointmentDetailsModal";
import {
  getAppointmentById,
  getNotificationsForUser,
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/lib/firestore";
import { emitNotificationsUpdated } from "@/lib/notificationEvents";
import type { AppNotification, Appointment, UserProfile } from "@/types";
import toast from "react-hot-toast";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function NotificationDetailsModal({
  notification,
  onClose,
  onMarkRead,
}: {
  notification: AppNotification;
  onClose: () => void;
  onMarkRead: () => void;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary-500">Notification</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{notification.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification details"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm leading-relaxed text-slate-700">{notification.message}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {notification.isRead ? "Read" : "Unread"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Created</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(notification.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!notification.isRead && (
            <button onClick={onMarkRead} className="btn-primary flex-1">
              Mark as read
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPanel({
  profile,
  unreadCount,
  onNotificationsChange,
}: {
  profile: UserProfile | null;
  unreadCount?: number;
  onNotificationsChange?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const sync = () => {
    emitNotificationsUpdated();
    onNotificationsChange?.();
  };

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      setNotifications(await getNotificationsForUser(profile.uid, profile.role));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      sync();
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid, profile?.role]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const latest = notifications.slice(0, 6);
  const localUnreadCount = notifications.filter((item) => !item.isRead).length;
  const displayUnreadCount = unreadCount ?? localUnreadCount;
  const allLink = profile?.role === "admin" ? "/admin/notifications" : "/patient/notifications";

  const handleMarkRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    try {
      await markNotificationAsRead(notification.id);
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
      sync();
    } catch {
      toast.error("Could not mark notification as read.");
    }
  };

  const handleMarkAll = async () => {
    const ids = notifications.filter((item) => !item.isRead).map((item) => item.id);
    if (!ids.length) return;
    try {
      await markNotificationsAsRead(ids);
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      sync();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not mark all as read.");
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    await handleMarkRead(notification);
    if (notification.relatedAppointmentId) {
      const appointment = await getAppointmentById(notification.relatedAppointmentId);
      if (appointment) {
        setSelectedAppointment(appointment);
        setOpen(false);
        return;
      }
    }
    setSelectedNotification({ ...notification, isRead: true });
    setOpen(false);
  };

  if (!profile) return null;

  return (
    <div className="relative ml-auto" ref={wrapperRef}>
      <button
        type="button"
        title="Notifications"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082A2 2 0 0113 18.5h-2a2 2 0 01-1.857-1.418M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        </svg>
        {displayUnreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
            {displayUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-40 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-base font-bold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-400">{displayUnreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleMarkAll} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-50">
                Mark all read
              </button>
              <button onClick={load} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                Refresh
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <svg className="h-6 w-6 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            ) : latest.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {latest.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      notification.isRead
                        ? "border-slate-100 bg-white hover:bg-slate-50"
                        : "border-primary-100 bg-primary-50 hover:bg-primary-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-primary-500"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-bold text-slate-900">{notification.title}</p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            {notification.isRead ? "Read" : "Unread"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-400">{formatDate(notification.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            <Link
              href={allLink}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
      {selectedNotification && (
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkRead={() => handleMarkRead(selectedNotification)}
        />
      )}
    </div>
  );
}
