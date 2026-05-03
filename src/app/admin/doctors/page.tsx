"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  addDoctor,
  deleteDoctorIfSafe,
  getAllDoctors,
  toggleDoctorActive,
  updateDoctor,
} from "@/lib/firestore";
import type { Doctor } from "@/types";
import toast from "react-hot-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DoctorFormState {
  name: string;
  specialty: string;
  department: string;
  availableDays: string[];
  startTime: string;
  endTime: string;
  consultationFee: string;
  isActive: boolean;
}

const emptyDoctorForm: DoctorFormState = {
  name: "",
  specialty: "",
  department: "",
  availableDays: [],
  startTime: "09:00",
  endTime: "17:00",
  consultationFee: "",
  isActive: true,
};

function DoctorModal({
  doctor,
  onClose,
  onSaved,
}: {
  doctor: Doctor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<DoctorFormState>(
    doctor
      ? {
          name: doctor.name,
          specialty: doctor.specialty,
          department: doctor.department,
          availableDays: doctor.availableDays,
          startTime: doctor.startTime,
          endTime: doctor.endTime,
          consultationFee: String(doctor.consultationFee || ""),
          isActive: doctor.isActive,
        }
      : emptyDoctorForm
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleDay = (day: string) => {
    setForm((current) => ({
      ...current,
      availableDays: current.availableDays.includes(day)
        ? current.availableDays.filter((item) => item !== day)
        : [...current.availableDays, day],
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Doctor name is required.";
    if (!form.department.trim()) nextErrors.department = "Department is required.";
    if (!form.specialty.trim()) nextErrors.specialty = "Specialty is required.";
    if (!form.startTime) nextErrors.startTime = "Start time is required.";
    if (!form.endTime) nextErrors.endTime = "End time is required.";
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = "End time must be after start time.";
    }
    return nextErrors;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      department: form.department.trim(),
      availableDays: form.availableDays,
      startTime: form.startTime,
      endTime: form.endTime,
      consultationFee: Number(form.consultationFee || 0),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (doctor) {
        await updateDoctor(doctor.id, payload);
        toast.success("Doctor updated.");
      } else {
        await addDoctor(payload);
        toast.success("Doctor added.");
      }
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to save doctor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary-500">Doctor Management</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">{doctor ? "Edit Doctor" : "Add Doctor"}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close doctor modal" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Doctor Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`input-field ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="Dr. Sara Ahmed" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={`input-field ${errors.department ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="Heart and Vascular Department" />
            {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Specialty</label>
            <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className={`input-field ${errors.specialty ? "border-red-400 focus:ring-red-400" : ""}`} placeholder="Cardiology" />
            {errors.specialty && <p className="mt-1 text-xs text-red-500">{errors.specialty}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Consultation Fee</label>
            <input type="number" min="0" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} className="input-field" placeholder="250" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Start Time</label>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={`input-field ${errors.startTime ? "border-red-400 focus:ring-red-400" : ""}`} />
            {errors.startTime && <p className="mt-1 text-xs text-red-500">{errors.startTime}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">End Time</label>
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={`input-field ${errors.endTime ? "border-red-400 focus:ring-red-400" : ""}`} />
            {errors.endTime && <p className="mt-1 text-xs text-red-500">{errors.endTime}</p>}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">Available Days</label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DAYS.map((day) => {
              const checked = form.availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${checked ? "border-primary-200 bg-primary-50 text-primary-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${checked ? "border-primary-500 bg-primary-500 text-white" : "border-slate-300 text-transparent"}`}>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600" />
          Active doctor available for booking
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save Doctor"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDoctorsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = async () => {
    setFetching(true);
    try {
      const data = await getAllDoctors();
      setDoctors(data);
    } finally {
      setFetching(false);
    }
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

  const handleToggle = async (doctor: Doctor) => {
    try {
      await toggleDoctorActive(doctor.id, !doctor.isActive);
      toast.success(doctor.isActive ? "Doctor deactivated." : "Doctor activated.");
      load();
    } catch {
      toast.error("Failed to update doctor status.");
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (!confirm(`Delete ${doctor.name}?`)) return;
    try {
      await deleteDoctorIfSafe(doctor.id);
      toast.success("Doctor deleted.");
      load();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete doctor.";
      toast.error(message);
    }
  };

  const filteredDoctors = useMemo(() => {
    const term = search.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(term) ||
        doctor.department.toLowerCase().includes(term) ||
        doctor.specialty.toLowerCase().includes(term)
    );
  }, [doctors, search]);

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
      {showAddModal && <DoctorModal doctor={null} onClose={() => setShowAddModal(false)} onSaved={load} />}
      {editingDoctor && <DoctorModal doctor={editingDoctor} onClose={() => setEditingDoctor(null)} onSaved={load} />}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Doctors</h2>
          <p className="mt-1 text-sm text-slate-500">Manage medical center doctors, departments, and schedules.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Doctor
        </button>
      </div>

      <div className="card mb-6 rounded-[2rem] p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search doctors, departments, or specialties" className="input-field pl-10" />
        </div>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="card rounded-[2rem] p-16 text-center">
          <p className="text-sm text-slate-500">No doctors found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden rounded-[2rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fee</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{doctor.name}</p>
                      <p className="text-xs text-slate-400">{doctor.specialty}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{doctor.department}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{doctor.startTime} - {doctor.endTime}</p>
                      <p className="mt-1 text-xs text-slate-400">{doctor.availableDays.join(", ") || "No days selected"}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{doctor.consultationFee ? `${doctor.consultationFee} EGP` : "-"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${doctor.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {doctor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setEditingDoctor(doctor)} className="btn-secondary px-3 py-2 text-xs">Edit</button>
                        <button onClick={() => handleToggle(doctor)} className="btn-secondary px-3 py-2 text-xs">{doctor.isActive ? "Deactivate" : "Activate"}</button>
                        <button onClick={() => handleDelete(doctor)} className="btn-danger px-3 py-2 text-xs">Delete</button>
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
