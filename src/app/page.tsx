"use client";

import Link from "next/link";

const features = [
  {
    title: "Department-Based Booking",
    desc: "Patients choose a department, specialty, doctor, date, and time in one simple flow.",
  },
  {
    title: "Medical Profiles",
    desc: "Patients can keep basic health and emergency contact information ready for staff review.",
  },
  {
    title: "Admin Management",
    desc: "Admins manage doctors, appointments, patient records, status notes, and notifications.",
  },
];

const departments = [
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
  "Dental Care",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-teal-500">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-800">
              ClinicCare Medical Center
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary px-4 py-2 text-sm">
              Login
            </Link>
            <Link href="/register" className="btn-primary px-4 py-2 text-sm">
              Register
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
          Medical Center Appointment Management System
        </div>

        <h1 className="mb-5 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
          ClinicCare Medical Center
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500">
          Book appointments with multiple departments and doctors, track your visit status,
          and receive updates from the medical center staff in one Firebase-connected system.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Get Started
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Sign In
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {departments.map((department) => (
            <span
              key={department}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
            >
              {department}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-slate-800 md:text-3xl">
            Simple Tools for a University Project
          </h2>
          <p className="mx-auto max-w-xl text-base text-slate-500">
            A clean medical-center workflow for patients and admins, backed by Firebase Auth and Firestore.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 transition-shadow hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-teal-400 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-bold text-slate-800">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-sm text-slate-400">
        Copyright {new Date().getFullYear()} ClinicCare Medical Center by youhana zkria
      </footer>
    </div>
  );
}
