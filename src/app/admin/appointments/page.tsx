"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import AppointmentDetailsModal from "@/components/AppointmentDetailsModal";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteAppointment,
  getAllAppointments,
  updateAppointmentStatus,
} from "@/lib/firestore";
import type { Appointment, AppointmentStatus } from "@/types";
import toast from "react-hot-toast";

type FilterType = "all" | AppointmentStatus;

function ReviewModal({
  appointment,
  status,
  onClose,
  onSaved,
}: {
  appointment: Appointment;
  status: AppointmentStatus;
  onClose: () => void;
  onSaved: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(appointment.adminNote || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaved(note);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold capitalize text-slate-800">
          {status} Appointment
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add an optional admin note for {appointment.patientName}.
        </p>

        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">{appointment.doctorName}</p>
          <p>{appointment.date} at {appointment.time}</p>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Admin Note
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input-field resize-none"
            placeholder="Optional note for the patient"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function exportAppointmentsCsv(appointments: Appointment[]) {
  const headers = ["Reference number","Patient name","Patient email","Patient phone","Doctor name","Department / specialty","Date","Time","Status","Symptoms","Admin note","Created date"];
  const rows = appointments.map((appt) => [appt.referenceNumber || appt.id, appt.patientName, appt.patientEmail, appt.patientPhone, appt.doctorName, `${appt.department || appt.specialty} / ${appt.specialty}`, appt.date, appt.time, appt.status, appt.symptoms || "", appt.adminNote || "", appt.createdAt]);
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cliniccare-appointments.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [fetching, setFetching] = useState(true);
  const [detailsAppt, setDetailsAppt] = useState<Appointment | null>(null);
  const [reviewAction, setReviewAction] = useState<{
    appointment: Appointment;
    status: AppointmentStatus;
  } | null>(null);

  const load = async () => {
    setFetching(true);
    const data = await getAllAppointments();
    setAppointments(data);
    setFetching(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && profile?.role !== "admin") {
      router.push("/patient/dashboard");
      return;
    }
    if (user && profile?.role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, loading]);

  const handleStatusChange = async (
    appointment: Appointment,
    status: AppointmentStatus,
    adminNote: string
  ) => {
    if (!profile) return;
    try {
      await updateAppointmentStatus(appointment.id, status, {
        actorRole: "admin",
        changedBy: profile.fullName || profile.uid,
        reviewedBy: profile.uid,
        adminNote,
        message: `Appointment ${status} by admin.`,
      });
      toast.success(`Appointment ${status}.`);
      load();
    } catch {
      toast.error("Action failed. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this appointment permanently?")) return;
    try {
      await deleteAppointment(id);
      toast.success("Appointment deleted.");
      load();
    } catch {
      toast.error("Failed to delete appointment.");
    }
  };

  const departments = useMemo(
    () =>
      Array.from(
        new Set(appointments.map((appt) => appt.department || appt.specialty))
      ).filter(Boolean),
    [appointments]
  );

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return appointments.filter((appt) => {
      const department = appt.department || appt.specialty;
      const matchesStatus = filter === "all" || appt.status === filter;
      const matchesDepartment =
        departmentFilter === "all" || department === departmentFilter || appt.specialty === departmentFilter;
      const matchesDate = !dateFilter || appt.date === dateFilter;
      const matchesText =
        !text ||
        appt.patientName.toLowerCase().includes(text) ||
        appt.doctorName.toLowerCase().includes(text) ||
        appt.patientEmail.toLowerCase().includes(text);
      return matchesStatus && matchesDepartment && matchesDate && matchesText;
    });
  }, [appointments, dateFilter, departmentFilter, filter, search]);

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "rejected", label: "Rejected" },
  ];

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

  return (
    <AdminLayout>
      {detailsAppt && (
        <AppointmentDetailsModal
          appointment={detailsAppt}
          onClose={() => setDetailsAppt(null)}
        />
      )}
      {reviewAction && (
        <ReviewModal
          appointment={reviewAction.appointment}
          status={reviewAction.status}
          onClose={() => setReviewAction(null)}
          onSaved={(note) =>
            handleStatusChange(reviewAction.appointment, reviewAction.status, note)
          }
        />
      )}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">All Appointments</h2>
          <p className="mt-1 text-sm text-slate-500">
            {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""} across ClinicCare departments.
          </p>
        </div>
        <button type="button" onClick={() => exportAppointmentsCsv(filtered)} className="btn-secondary">Export CSV</button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              filter === tab.key
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                filter === tab.key ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.key === "all"
                ? appointments.length
                : appointments.filter((appt) => appt.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search patient or doctor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input-field"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No appointments found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor / Department</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date & Time</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Symptoms</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((appt) => (
                  <tr key={appt.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4"><p className="font-bold text-slate-800">{appt.referenceNumber || appt.id.slice(0, 8)}</p></td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{appt.patientName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{appt.patientEmail}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{appt.patientPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">{appt.doctorName}</p>
                      <p className="mt-0.5 text-xs font-medium text-teal-600">
                        {appt.department || appt.specialty}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{appt.specialty}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700">{appt.date}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{appt.time}</p>
                    </td>
                    <td className="max-w-[180px] px-5 py-4">
                      <p className="truncate text-xs text-slate-500">{appt.symptoms || "-"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setDetailsAppt(appt)}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Details
                        </button>
                        {appt.status === "pending" && (
                          <>
                            <button
                              onClick={() => setReviewAction({ appointment: appt, status: "confirmed" })}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setReviewAction({ appointment: appt, status: "rejected" })}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(appt.status === "pending" || appt.status === "confirmed") && (
                          <button
                            onClick={() => setReviewAction({ appointment: appt, status: "cancelled" })}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-700 transition-colors hover:bg-yellow-100"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(appt.id)}
                          className="btn-danger px-3 py-1.5 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
