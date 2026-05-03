"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getAllPatients } from "@/lib/firestore";
import type { MedicalProfile, UserProfile } from "@/types";

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value || "-"}</p>
    </div>
  );
}

function PatientProfileModal({ patient, onClose }: { patient: UserProfile; onClose: () => void }) {
  const medical: MedicalProfile = patient.medicalProfile || {};

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-teal-400 text-xl font-bold text-white">
              {patient.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={patient.photoURL} alt={patient.fullName} className="h-full w-full object-cover" />
              ) : (
                patient.fullName?.[0]?.toUpperCase() || "P"
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Patient Profile</h3>
              <p className="text-sm text-slate-500">{patient.fullName}</p>
              <p className="text-xs text-slate-400">{patient.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close patient profile" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Contact Details</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <DetailItem label="Name" value={patient.fullName} />
              <DetailItem label="Email" value={patient.email} />
              <DetailItem label="Phone" value={patient.phone} />
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Medical Profile</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <DetailItem label="Age" value={medical.age} />
              <DetailItem label="Gender" value={medical.gender} />
              <DetailItem label="Blood type" value={medical.bloodType} />
              <DetailItem label="Chronic diseases" value={medical.chronicDiseases} />
              <DetailItem label="Allergies" value={medical.allergies} />
              <DetailItem label="Current medications" value={medical.currentMedications} />
              <DetailItem label="Emergency contact" value={medical.emergencyContactName} />
              <DetailItem label="Emergency phone" value={medical.emergencyContactPhone} />
              <DetailItem label="Joined" value={patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "-"} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminPatientsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [patients, setPatients] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<UserProfile | null>(null);

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
      getAllPatients().then((data) => {
        setPatients(data);
        setFetching(false);
      });
    }
  }, [user, profile, loading, router]);

  const filtered = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase()) ||
      patient.phone.includes(search)
  );

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
      {selectedPatient && <PatientProfileModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patients</h2>
          <p className="mt-1 text-sm text-slate-500">{patients.length} registered patient{patients.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search patients" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field w-full pl-9 sm:w-72" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card rounded-[2rem] p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No patients found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden rounded-[2rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Patient</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Medical Profile</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((patient) => (
                  <tr key={patient.uid} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                          {patient.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={patient.photoURL} alt={patient.fullName} className="h-full w-full object-cover" />
                          ) : (
                            patient.fullName?.[0]?.toUpperCase() || "P"
                          )}
                        </div>
                        <span className="font-semibold text-slate-800">{patient.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{patient.email}</td>
                    <td className="px-5 py-4 text-slate-600">{patient.phone || "-"}</td>
                    <td className="px-5 py-4 text-slate-600">{patient.medicalProfile ? "Available" : "Not added"}</td>
                    <td className="px-5 py-4 text-slate-600">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "-"}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedPatient(patient)} className="btn-secondary px-3 py-2 text-xs">View Profile</button>
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
