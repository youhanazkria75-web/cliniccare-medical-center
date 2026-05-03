"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppointmentDetailsModal from "@/components/AppointmentDetailsModal";
import PatientLayout from "@/components/PatientLayout";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteAppointment,
  getActiveDoctors,
  getPatientAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "@/lib/firestore";
import { TIME_SLOTS } from "@/data/doctors";
import type { Appointment, AppointmentStatus, Doctor } from "@/types";
import toast from "react-hot-toast";

type FilterType = "all" | AppointmentStatus;

interface EditModalProps {
  appt: Appointment;
  doctors: Doctor[];
  patientId: string;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ appt, doctors, patientId, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    department: appt.department || appt.specialty,
    specialty: appt.specialty,
    doctorId: appt.doctorId || "",
    doctorName: appt.doctorName,
    date: appt.date,
    time: appt.time,
    symptoms: appt.symptoms,
  });
  const [saving, setSaving] = useState(false);

  const departments = useMemo(
    () => Array.from(new Set(doctors.map((doctor) => doctor.department))).filter(Boolean),
    [doctors]
  );

  const specialties = useMemo(() => {
    const source = form.department
      ? doctors.filter((doctor) => doctor.department === form.department)
      : doctors;
    return Array.from(new Set(source.map((doctor) => doctor.specialty))).filter(Boolean);
  }, [doctors, form.department]);

  const doctorOptions = useMemo(
    () =>
      doctors.filter(
        (doctor) =>
          (!form.department || doctor.department === form.department) &&
          (!form.specialty || doctor.specialty === form.specialty)
      ),
    [doctors, form.department, form.specialty]
  );

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find((item) => item.id === doctorId);
    setForm({
      ...form,
      doctorId,
      doctorName: doctor?.name || "",
      department: doctor?.department || form.department,
      specialty: doctor?.specialty || form.specialty,
    });
  };

  const today = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    if (!form.department || !form.specialty || !form.doctorId || !form.date || !form.time) {
      toast.error("Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      await updateAppointment(
        appt.id,
        {
          department: form.department,
          specialty: form.specialty,
          doctorId: form.doctorId,
          doctorName: form.doctorName,
          date: form.date,
          time: form.time,
          symptoms: form.symptoms,
        },
        patientId
      );
      toast.success("Appointment updated!");
      onSaved();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update appointment.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-5 text-lg font-bold text-slate-800">Edit Appointment</h3>

        {doctors.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No doctors available. Please contact the medical center.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm({
                    ...form,
                    department: e.target.value,
                    specialty: "",
                    doctorId: "",
                    doctorName: "",
                  })
                }
                className="input-field"
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Specialty</label>
              <select
                value={form.specialty}
                onChange={(e) =>
                  setForm({
                    ...form,
                    specialty: e.target.value,
                    doctorId: "",
                    doctorName: "",
                  })
                }
                className="input-field"
              >
                <option value="">Select a specialty</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Doctor</label>
              <select
                value={form.doctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="input-field"
              >
                <option value="">Select a doctor</option>
                {doctorOptions.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input-field"
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Symptoms / Notes
              </label>
              <textarea
                rows={3}
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                className="input-field resize-none"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || doctors.length === 0}
            className="btn-primary flex-1"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [detailsAppt, setDetailsAppt] = useState<Appointment | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    setFetching(true);
    const [apptData, doctorData] = await Promise.all([
      getPatientAppointments(user.uid),
      getActiveDoctors(),
    ]);
    setAppointments(apptData);
    setDoctors(doctorData);
    setFetching(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && profile?.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, loading]);

  const handleCancel = async (id: string) => {
    if (!user || !confirm("Cancel this appointment?")) return;
    try {
      await updateAppointmentStatus(id, "cancelled", {
        actorRole: "patient",
        changedBy: user.uid,
        message: "Appointment cancelled by patient.",
      });
      toast.success("Appointment cancelled.");
      load();
    } catch {
      toast.error("Failed to cancel appointment.");
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

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return appointments.filter((appt) => {
      const matchesStatus = filter === "all" || appt.status === filter;
      const matchesText =
        !text ||
        appt.doctorName.toLowerCase().includes(text) ||
        appt.specialty.toLowerCase().includes(text) ||
        (appt.department || "").toLowerCase().includes(text);
      return matchesStatus && matchesText;
    });
  }, [appointments, filter, search]);

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "rejected", label: "Rejected" },
  ];

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

  return (
    <PatientLayout>
      {editAppt && user && (
        <EditModal
          appt={editAppt}
          doctors={doctors}
          patientId={user.uid}
          onClose={() => setEditAppt(null)}
          onSaved={load}
        />
      )}
      {detailsAppt && (
        <AppointmentDetailsModal
          appointment={detailsAppt}
          onClose={() => setDetailsAppt(null)}
        />
      )}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Appointments</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track your ClinicCare Medical Center visits.
          </p>
        </div>
        <Link href="/patient/book-appointment" className="btn-primary">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Book New
        </Link>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by doctor or specialty"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                filter === tab.key
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-2 text-base font-semibold text-slate-700">No appointments yet</h3>
          <p className="mb-5 text-sm text-slate-400">Book your first appointment to get started.</p>
          <Link href="/patient/book-appointment" className="btn-primary">
            Book Appointment
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-sm text-slate-500">
          No appointments match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((appt) => (
            <div key={appt.id} className="card p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h4 className="font-semibold text-slate-800">{appt.doctorName}</h4>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{appt.referenceNumber || appt.id.slice(0, 8)}</span>
                    <StatusBadge status={appt.status} />
                  </div>
                  <p className="mb-3 text-sm font-medium text-primary-600">
                    {appt.department || appt.specialty} / {appt.specialty}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {appt.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {appt.time}
                    </span>
                  </div>
                  {appt.adminNote && (
                    <p className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700">
                      Admin note: {appt.adminNote}
                    </p>
                  )}
                </div>

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
                        onClick={() => setEditAppt(appt)}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="btn-danger px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {appt.status === "cancelled" && (
                    <button
                      onClick={() => handleDelete(appt.id)}
                      className="btn-danger px-3 py-1.5 text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PatientLayout>
  );
}
