"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PatientLayout from "@/components/PatientLayout";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { getPatientAppointments } from "@/lib/firestore";
import type { Appointment } from "@/types";

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}

function StatCard({ label, value, icon, tone }: StatCardProps) {
  return (
    <div className="card rounded-3xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && profile?.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }

    if (user) {
      getPatientAppointments(user.uid)
        .then((data) => setAppointments(data))
        .finally(() => setFetching(false));
    }
  }, [user, profile, loading, router]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments
      .filter(
        (appointment) =>
          appointment.date >= today &&
          (appointment.status === "pending" || appointment.status === "confirmed")
      )
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .at(0);
  }, [appointments]);

  if (loading || fetching) {
    return (
      <PatientLayout>
        <div className="flex h-64 items-center justify-center">
          <svg className="h-8 w-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </PatientLayout>
    );
  }

  const stats = [
    {
      label: "Total Appointments",
      value: appointments.length,
      tone: "bg-primary-100 text-primary-600",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Pending",
      value: appointments.filter((appointment) => appointment.status === "pending").length,
      tone: "bg-yellow-100 text-yellow-600",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Confirmed",
      value: appointments.filter((appointment) => appointment.status === "confirmed").length,
      tone: "bg-green-100 text-green-600",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Cancelled",
      value: appointments.filter((appointment) => appointment.status === "cancelled").length,
      tone: "bg-red-100 text-red-500",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Rejected",
      value: appointments.filter((appointment) => appointment.status === "rejected").length,
      tone: "bg-slate-100 text-slate-500",
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M6.343 5.657l12.02 12.02" />
        </svg>
      ),
    },
  ];

  return (
    <PatientLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-600 via-sky-500 to-teal-500 p-8 text-white shadow-lg">
          <p className="text-sm font-medium text-white/85">ClinicCare dashboard</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Welcome back, {profile?.fullName?.split(" ")[0] || "Patient"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            Check your upcoming visit, review appointment status, and quickly move to the pages you use most.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="card rounded-[2rem] p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Upcoming Appointment</h3>
              <p className="mt-1 text-sm text-slate-500">Your next active appointment appears here.</p>
            </div>
            <Link href="/patient/appointments" className="text-sm font-semibold text-primary-600 hover:underline">
              View all appointments
            </Link>
          </div>

          {upcoming ? (
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-2xl font-bold text-slate-900">{upcoming.doctorName}</p>
                    <StatusBadge status={upcoming.status} />
                  </div>
                  <p className="text-sm font-medium text-primary-700">
                    {upcoming.department || upcoming.specialty} / {upcoming.specialty}
                  </p>
                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Date</p>
                      <p className="mt-1 font-semibold text-slate-800">{upcoming.date}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Time</p>
                      <p className="mt-1 font-semibold text-slate-800">{upcoming.time}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Reference</p>
                      <p className="mt-1 font-semibold text-slate-800">{upcoming.referenceNumber || upcoming.id}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link href="/patient/book-appointment" className="btn-primary px-6">
                    Book another visit
                  </Link>
                  <Link href="/patient/notifications" className="btn-secondary px-6">
                    View notifications
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <h4 className="text-lg font-semibold text-slate-800">No upcoming appointments yet</h4>
              <p className="mt-2 text-sm text-slate-500">
                Once you book an appointment, it will appear here with its latest status.
              </p>
              <Link href="/patient/book-appointment" className="btn-primary mt-5 px-6">
                Book your first appointment
              </Link>
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-900">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/patient/book-appointment" className="card rounded-3xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="mb-1 text-base font-semibold text-slate-800">Book Appointment</h4>
              <p className="text-sm text-slate-500">Schedule a new visit with one of the available doctors.</p>
            </Link>

            <Link href="/patient/appointments" className="card rounded-3xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="mb-1 text-base font-semibold text-slate-800">My Appointments</h4>
              <p className="text-sm text-slate-500">Track statuses, open details, or update your requests.</p>
            </Link>

            <Link href="/patient/profile" className="card rounded-3xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="mb-1 text-base font-semibold text-slate-800">My Profile</h4>
              <p className="text-sm text-slate-500">Update contact information, medical profile, and photo.</p>
            </Link>
          </div>
        </section>
      </div>
    </PatientLayout>
  );
}
