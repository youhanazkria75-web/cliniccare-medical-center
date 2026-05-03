"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllAppointments,
  getAllDoctors,
  getAllPatients,
  getNotificationsForUser,
} from "@/lib/firestore";
import type { AppNotification, Appointment } from "@/types";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && profile?.role !== "admin") {
      router.push("/patient/dashboard");
      return;
    }
    if (user && profile?.role === "admin") {
      Promise.all([
        getAllAppointments(),
        getAllPatients(),
        getAllDoctors(),
        getNotificationsForUser(profile.uid, profile.role),
      ]).then(([appts, patients, doctors, notificationData]) => {
        setAppointments(appts);
        setPatientCount(patients.length);
        setDoctorCount(doctors.length);
        setNotifications(notificationData);
        setFetching(false);
      });
    }
  }, [user, profile, loading, router]);

  if (loading || fetching) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </AdminLayout>
    );
  }

  const total = appointments.length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const rejected = appointments.filter((a) => a.status === "rejected").length;

  const stats = [
    {
      label: "Total Appointments",
      value: total,
      color: "bg-primary-100",
      icon: <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      label: "Pending",
      value: pending,
      color: "bg-yellow-100",
      icon: <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Confirmed",
      value: confirmed,
      color: "bg-green-100",
      icon: <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Cancelled",
      value: cancelled,
      color: "bg-red-100",
      icon: <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Rejected",
      value: rejected,
      color: "bg-slate-100",
      icon: <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M6.343 5.657l12.02 12.02" /></svg>,
    },
    {
      label: "Total Patients",
      value: patientCount,
      color: "bg-teal-100",
      icon: <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      label: "Total Doctors",
      value: doctorCount,
      color: "bg-indigo-100",
      icon: <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6m12 0a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>,
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Overview of ClinicCare Medical Center appointments, patients, doctors, and notifications.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-7">
        {stats.map((s) => (
          <div key={s.label} className="stat-card flex flex-col gap-3">
            <div className={`h-11 w-11 rounded-xl ${s.color} flex items-center justify-center`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-700">Recent Appointments</h3>
            <Link href="/admin/appointments" className="text-sm font-semibold text-teal-600 hover:underline">
              Manage
            </Link>
          </div>
          {appointments.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No appointments yet.
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{appt.patientName}</p>
                    <p className="text-xs text-slate-500">
                      {appt.doctorName} - {appt.date} at {appt.time}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-700">Latest Notifications</h3>
            <span className="text-xs font-semibold text-slate-400">
              {notifications.filter((item) => !item.isRead).length} unread
            </span>
          </div>
          {notifications.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No notifications yet.
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <h3 className="mb-4 text-base font-semibold text-slate-700">Management</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/appointments" className="card p-6 transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="mb-1 font-semibold text-slate-800">Manage Appointments</h4>
          <p className="text-sm text-slate-500">Confirm, cancel, reject, and review appointment details.</p>
        </Link>

        <Link href="/admin/doctors" className="card p-6 transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6m12 0a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
          </div>
          <h4 className="mb-1 font-semibold text-slate-800">Manage Doctors</h4>
          <p className="text-sm text-slate-500">Add departments, specialties, doctor schedules, and availability.</p>
        </Link>

        <Link href="/admin/patients" className="card p-6 transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100">
            <svg className="h-6 w-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h4 className="mb-1 font-semibold text-slate-800">View Patients</h4>
          <p className="text-sm text-slate-500">Review registered patients and basic medical profile details.</p>
        </Link>
      </div>
    </AdminLayout>
  );
}
