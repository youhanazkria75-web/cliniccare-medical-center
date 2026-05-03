"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PatientLayout from "@/components/PatientLayout";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import type { MedicalProfile } from "@/types";
import toast from "react-hot-toast";

const emptyMedicalProfile: MedicalProfile = {
  age: "",
  gender: "",
  bloodType: "",
  chronicDiseases: "",
  allergies: "",
  currentMedications: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export default function PatientProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile>(emptyMedicalProfile);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (!loading && profile?.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }
    if (profile) {
      setFullName(profile.fullName);
      setPhone(profile.phone);
      setPhotoURL(profile.photoURL || "");
      setMedicalProfile({
        ...emptyMedicalProfile,
        ...(profile.medicalProfile || {}),
      });
    }
  }, [user, profile, loading, router]);

  const setMedicalField = (key: keyof MedicalProfile, value: string) => {
    setMedicalProfile((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoURL(String(reader.result || ""));
      toast.success("Photo selected. Click Save Changes to keep it.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!phone.trim()) nextErrors.phone = "Phone number is required.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !user) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        photoURL,
        medicalProfile,
      });
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const medicalField = (
    key: keyof MedicalProfile,
    label: string,
    placeholder = "",
    type = "text"
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={medicalProfile[key] || ""}
        onChange={(event) => setMedicalField(key, event.target.value)}
        className="input-field"
        placeholder={placeholder}
      />
    </div>
  );

  if (loading) {
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

  const avatar = photoURL ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoURL} alt={fullName || "Patient"} className="h-full w-full object-cover" />
  ) : (
    <span className="text-3xl font-bold text-white">{fullName?.[0]?.toUpperCase() ?? "P"}</span>
  );

  return (
    <PatientLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update your contact details, profile photo, and medical information for ClinicCare Medical Center.
          </p>
        </div>

        <div className="card mb-6 rounded-[2rem] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-primary-400 to-teal-400">
                {avatar}
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-800">{fullName || "-"}</p>
                <p className="text-sm text-slate-500">{profile?.email}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600">
                  Patient
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2-2h6l2 2h4v12H3V7zm9 3a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                {photoURL ? "Change Photo" : "Add Photo / Camera"}
              </button>
              {photoURL && (
                <button type="button" onClick={() => setPhotoURL("")} className="btn-secondary">
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="card rounded-[2rem] p-8">
            <h3 className="mb-5 text-base font-bold text-slate-800">Personal Information</h3>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={`input-field ${errors.fullName ? "border-red-400 focus:ring-red-400" : ""}`}
                  placeholder="Your full name"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={`input-field ${errors.phone ? "border-red-400 focus:ring-red-400" : ""}`}
                  placeholder="+20 100 000 0000"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={profile?.email ?? ""}
                  className="input-field cursor-not-allowed bg-slate-50 text-slate-400"
                />
                <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Member Since</label>
                <input
                  type="text"
                  readOnly
                  value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}
                  className="input-field cursor-not-allowed bg-slate-50 text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="card rounded-[2rem] p-8">
            <h3 className="mb-5 text-base font-bold text-slate-800">Medical Profile</h3>
            <div className="grid gap-5 md:grid-cols-2">
              {medicalField("age", "Age", "Example: 21", "number")}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Gender</label>
                <select
                  value={medicalProfile.gender || ""}
                  onChange={(event) => setMedicalField("gender", event.target.value)}
                  className="input-field"
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Blood Type</label>
                <select
                  value={medicalProfile.bloodType || ""}
                  onChange={(event) => setMedicalField("bloodType", event.target.value)}
                  className="input-field"
                >
                  <option value="">Select blood type</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {medicalField("chronicDiseases", "Chronic Diseases", "Example: diabetes, asthma")}
              {medicalField("allergies", "Allergies", "Example: penicillin, peanuts")}
              {medicalField("currentMedications", "Current Medications", "Example: vitamin D")}
              {medicalField("emergencyContactName", "Emergency Contact Name", "Full name")}
              {medicalField("emergencyContactPhone", "Emergency Contact Phone", "+20 100 000 0000")}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 md:w-auto md:px-8">
            {saving && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </PatientLayout>
  );
}
