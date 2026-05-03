"use client";

import { useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import type { Appointment, StatusHistoryStatus } from "@/types";

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-700">{value || "-"}</p>
    </div>
  );
}

function timelineTone(status: StatusHistoryStatus) {
  switch (status) {
    case "pending":
      return {
        dot: "bg-yellow-500 ring-yellow-100",
        card: "border-yellow-100 bg-yellow-50/50",
        text: "text-yellow-700",
      };
    case "confirmed":
      return {
        dot: "bg-green-500 ring-green-100",
        card: "border-green-100 bg-green-50/50",
        text: "text-green-700",
      };
    case "cancelled":
      return {
        dot: "bg-red-500 ring-red-100",
        card: "border-red-100 bg-red-50/50",
        text: "text-red-700",
      };
    case "rejected":
      return {
        dot: "bg-slate-500 ring-slate-100",
        card: "border-slate-200 bg-slate-50",
        text: "text-slate-700",
      };
    default:
      return {
        dot: "bg-primary-500 ring-primary-100",
        card: "border-primary-100 bg-primary-50/40",
        text: "text-primary-700",
      };
  }
}

export default function AppointmentDetailsModal({ appointment, onClose }: AppointmentDetailsModalProps) {
  const history = appointment.statusHistory || [];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900">Appointment Details</h3>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="mt-1 text-xs font-medium text-slate-400">Reference: {appointment.referenceNumber || appointment.id}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close appointment details" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(92vh-5rem)] overflow-y-auto p-6">
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary-50 to-teal-50 p-5">
            <p className="text-sm font-semibold text-slate-900">{appointment.doctorName}</p>
            <p className="mt-1 text-sm text-primary-700">{appointment.department || appointment.specialty} / {appointment.specialty}</p>
            <p className="mt-3 text-sm text-slate-600">{appointment.date} at {appointment.time}</p>
          </div>

          <div className="space-y-6">
            <section>
              <h4 className="mb-3 text-sm font-bold text-slate-900">Patient Information</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <DetailItem label="Patient name" value={appointment.patientName} />
                <DetailItem label="Patient email" value={appointment.patientEmail} />
                <DetailItem label="Patient phone" value={appointment.patientPhone} />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-bold text-slate-900">Visit Information</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <DetailItem label="Reference number" value={appointment.referenceNumber || appointment.id} />
                <DetailItem label="Doctor" value={appointment.doctorName} />
                <DetailItem label="Department" value={appointment.department || appointment.specialty} />
                <DetailItem label="Specialty" value={appointment.specialty} />
                <DetailItem label="Date" value={appointment.date} />
                <DetailItem label="Time" value={appointment.time} />
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-bold text-slate-900">Notes</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Symptoms / patient notes</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{appointment.symptoms || "No symptoms or notes provided."}</p>
                </div>
                <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary-500">Admin notes</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{appointment.adminNote || "No admin notes yet."}</p>
                </div>
              </div>
            </section>

            <section>
              <h4 className="mb-3 text-sm font-bold text-slate-900">Dates</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <DetailItem label="Created" value={formatDateTime(appointment.createdAt)} />
                <DetailItem label="Updated" value={formatDateTime(appointment.updatedAt)} />
                <DetailItem label="Reviewed" value={formatDateTime(appointment.reviewedAt)} />
              </div>
            </section>

            <section>
              <h4 className="mb-4 text-sm font-bold text-slate-900">Status Timeline</h4>
              {history.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No timeline yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item, index) => {
                    const tone = timelineTone(item.status);
                    return (
                      <div key={`${item.status}-${item.changedAt}-${index}`} className={`flex gap-4 rounded-2xl border p-4 ${tone.card}`}>
                        <div className={`mt-1 h-3 w-3 rounded-full ring-4 ${tone.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className={`font-semibold capitalize ${tone.text}`}>{item.status}</p>
                            <p className="text-xs text-slate-400">{formatDateTime(item.changedAt)}</p>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
