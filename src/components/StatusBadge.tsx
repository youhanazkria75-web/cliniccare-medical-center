import React from "react";
import type { AppointmentStatus } from "@/types";

const config: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
  },
};

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
