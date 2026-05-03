import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  AppNotification,
  Appointment,
  AppointmentStatus,
  Doctor,
  MedicalProfile,
  StatusHistoryItem,
  UserProfile,
  UserRole,
} from "@/types";

const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ["pending", "confirmed"];
const ADMIN_NOTIFICATION_USER_ID = "admin";

function nowIso() {
  return new Date().toISOString();
}

function sortByCreatedDesc<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

async function getNextAppointmentReference() {
  try {
    const snap = await getDocs(collection(db, "appointments"));
    return `APT-${new Date().getFullYear()}-${String(snap.size + 1).padStart(4, "0")}`;
  } catch {
    return `APT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  }
}

function normalizeAppointment(id: string, data: Partial<Appointment>): Appointment {
  return {
    id: data.id || id,
    referenceNumber: data.referenceNumber || `APT-${new Date(data.createdAt || Date.now()).getFullYear()}-${(data.id || id).slice(-4).toUpperCase()}`,
    patientId: data.patientId || "",
    patientName: data.patientName || "",
    patientEmail: data.patientEmail || "",
    patientPhone: data.patientPhone || "",
    doctorId: data.doctorId,
    doctorName: data.doctorName || "",
    department: data.department,
    specialty: data.specialty || data.department || "",
    date: data.date || "",
    time: data.time || "",
    symptoms: data.symptoms || "",
    status: data.status || "pending",
    adminNote: data.adminNote || "",
    reviewedAt: data.reviewedAt,
    reviewedBy: data.reviewedBy,
    statusHistory: data.statusHistory || [],
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || data.createdAt || "",
  };
}

function normalizeDoctor(id: string, data: Partial<Doctor>): Doctor {
  return {
    id: data.id || id,
    name: data.name || "",
    specialty: data.specialty || "",
    department: data.department || "",
    availableDays: Array.isArray(data.availableDays) ? data.availableDays : [],
    startTime: data.startTime || "",
    endTime: data.endTime || "",
    consultationFee: Number(data.consultationFee || 0),
    isActive: data.isActive !== false,
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || data.createdAt || "",
  };
}

function normalizeNotification(
  id: string,
  data: Partial<AppNotification>
): AppNotification {
  return {
    id: data.id || id,
    userId: data.userId || "",
    roleTarget: data.roleTarget || "patient",
    title: data.title || "",
    message: data.message || "",
    type: data.type || "info",
    isRead: data.isRead === true,
    relatedAppointmentId: data.relatedAppointmentId,
    createdAt: data.createdAt || "",
  };
}

function appendHistory(
  appointment: Appointment,
  item: Omit<StatusHistoryItem, "changedAt">
) {
  return [
    ...(appointment.statusHistory || []),
    {
      ...item,
      changedAt: nowIso(),
    },
  ];
}

async function safeCreateNotification(
  data: Omit<AppNotification, "id" | "createdAt" | "isRead"> & {
    isRead?: boolean;
  }
) {
  try {
    await createNotification(data);
  } catch (error) {
    console.warn("Notification was not created.", error);
  }
}

// Users

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, "uid" | "createdAt" | "updatedAt">
): Promise<void> {
  const timestamp = nowIso();
  await setDoc(doc(db, "users", uid), {
    uid,
    ...data,
    photoURL: data.photoURL || "",
    medicalProfile: data.medicalProfile || {},
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<
    Pick<UserProfile, "fullName" | "phone" | "photoURL"> & { medicalProfile: MedicalProfile }
  >
): Promise<void> {
  const payload: Record<string, unknown> = {
    updatedAt: nowIso(),
  };

  if (data.fullName !== undefined) payload.fullName = data.fullName;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.photoURL !== undefined) payload.photoURL = data.photoURL;
  if (data.medicalProfile !== undefined) payload.medicalProfile = data.medicalProfile;

  await updateDoc(doc(db, "users", uid), payload);
}

export async function getAllPatients(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", "patient"));
  const snap = await getDocs(q);
  return sortByCreatedDesc(snap.docs.map((d) => d.data() as UserProfile));
}

// Doctors

export async function getAllDoctors(): Promise<Doctor[]> {
  const snap = await getDocs(collection(db, "doctors"));
  return sortByCreatedDesc(
    snap.docs.map((d) => normalizeDoctor(d.id, d.data() as Partial<Doctor>))
  );
}

export async function getActiveDoctors(): Promise<Doctor[]> {
  const doctors = await getAllDoctors();
  return doctors
    .filter((doctor) => doctor.isActive)
    .sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));
}

export async function addDoctor(
  data: Omit<Doctor, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const timestamp = nowIso();
  const ref = doc(collection(db, "doctors"));
  await setDoc(ref, {
    id: ref.id,
    ...data,
    consultationFee: Number(data.consultationFee || 0),
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return ref.id;
}

export async function updateDoctor(
  id: string,
  data: Partial<Omit<Doctor, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...data,
    updatedAt: nowIso(),
  };

  if (data.consultationFee !== undefined) {
    payload.consultationFee = Number(data.consultationFee || 0);
  }

  await updateDoc(doc(db, "doctors", id), payload);
}

export async function toggleDoctorActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await updateDoctor(id, { isActive });
}

export async function deleteDoctorIfSafe(id: string): Promise<void> {
  const snap = await getDoc(doc(db, "doctors", id));
  if (!snap.exists()) return;

  const doctor = normalizeDoctor(snap.id, snap.data() as Partial<Doctor>);
  const conflicts = await getPotentialDoctorAppointmentMatches(doctor.id, doctor.name);
  const hasActiveAppointments = conflicts.some((appt) =>
    ACTIVE_APPOINTMENT_STATUSES.includes(appt.status)
  );

  if (hasActiveAppointments) {
    throw new Error(
      "This doctor has pending or confirmed appointments and cannot be deleted."
    );
  }

  await deleteDoc(doc(db, "doctors", id));
}

// Appointments

async function getPotentialDoctorAppointmentMatches(
  doctorId?: string,
  doctorName?: string
): Promise<Appointment[]> {
  const matches = new Map<string, Appointment>();
  const tasks: Promise<void>[] = [];

  if (doctorId) {
    tasks.push(
      getDocs(
        query(collection(db, "appointments"), where("doctorId", "==", doctorId), limit(250))
      ).then((snap) => {
        snap.docs.forEach((d) =>
          matches.set(d.id, normalizeAppointment(d.id, d.data() as Partial<Appointment>))
        );
      })
    );
  }

  if (doctorName) {
    tasks.push(
      getDocs(
        query(
          collection(db, "appointments"),
          where("doctorName", "==", doctorName),
          limit(250)
        )
      ).then((snap) => {
        snap.docs.forEach((d) =>
          matches.set(d.id, normalizeAppointment(d.id, d.data() as Partial<Appointment>))
        );
      })
    );
  }

  await Promise.all(tasks);
  return Array.from(matches.values());
}

export async function findAppointmentConflict(params: {
  doctorId?: string;
  doctorName: string;
  date: string;
  time: string;
  excludeAppointmentId?: string;
}): Promise<Appointment | null> {
  const matches = await getPotentialDoctorAppointmentMatches(
    params.doctorId,
    params.doctorName
  );

  return (
    matches.find(
      (appt) =>
        appt.id !== params.excludeAppointmentId &&
        appt.date === params.date &&
        appt.time === params.time &&
        ACTIVE_APPOINTMENT_STATUSES.includes(appt.status)
    ) || null
  );
}

export async function createAppointment(
  data: Omit<
    Appointment,
    "id" | "createdAt" | "updatedAt" | "status" | "statusHistory"
  > & { status?: AppointmentStatus }
): Promise<string> {
  const conflict = await findAppointmentConflict({
    doctorId: data.doctorId,
    doctorName: data.doctorName,
    date: data.date,
    time: data.time,
  });

  if (conflict) {
    throw new Error(
      "This doctor already has an appointment at this date and time. Please choose another time."
    );
  }

  const timestamp = nowIso();
  const ref = doc(collection(db, "appointments"));
  const referenceNumber = await getNextAppointmentReference();
  const appointment: Appointment = {
    ...data,
    id: ref.id,
    referenceNumber,
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        message: "Appointment request created by patient.",
        changedBy: data.patientId,
        changedAt: timestamp,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await setDoc(ref, appointment);

  await safeCreateNotification({
    userId: ADMIN_NOTIFICATION_USER_ID,
    roleTarget: "admin",
    title: "New appointment booked",
    message: `${data.patientName} booked an appointment with ${data.doctorName} on ${data.date} at ${data.time}.`,
    type: "appointment_booked",
    relatedAppointmentId: ref.id,
  });

  return ref.id;
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const snap = await getDoc(doc(db, "appointments", id));
  if (!snap.exists()) return null;
  return normalizeAppointment(snap.id, snap.data() as Partial<Appointment>);
}

export async function getPatientAppointments(
  patientId: string
): Promise<Appointment[]> {
  const q = query(
    collection(db, "appointments"),
    where("patientId", "==", patientId),
    limit(250)
  );
  const snap = await getDocs(q);
  return sortByCreatedDesc(
    snap.docs.map((d) => normalizeAppointment(d.id, d.data() as Partial<Appointment>))
  );
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const snap = await getDocs(collection(db, "appointments"));
  return sortByCreatedDesc(
    snap.docs.map((d) => normalizeAppointment(d.id, d.data() as Partial<Appointment>))
  );
}

export async function updateAppointment(
  id: string,
  data: Partial<
    Pick<
      Appointment,
      "doctorId" | "doctorName" | "department" | "specialty" | "date" | "time" | "symptoms"
    >
  >,
  changedBy?: string
): Promise<void> {
  const snap = await getDoc(doc(db, "appointments", id));
  if (!snap.exists()) throw new Error("Appointment not found.");

  const current = normalizeAppointment(snap.id, snap.data() as Partial<Appointment>);
  const next = { ...current, ...data };

  const conflict = await findAppointmentConflict({
    doctorId: next.doctorId,
    doctorName: next.doctorName,
    date: next.date,
    time: next.time,
    excludeAppointmentId: id,
  });

  if (conflict) {
    throw new Error(
      "This doctor already has an appointment at this date and time. Please choose another time."
    );
  }

  await updateDoc(doc(db, "appointments", id), {
    ...data,
    updatedAt: nowIso(),
    statusHistory: appendHistory(current, {
      status: "updated",
      message: "Appointment details updated by patient.",
      changedBy: changedBy || current.patientId,
    }),
  });

  await safeCreateNotification({
    userId: ADMIN_NOTIFICATION_USER_ID,
    roleTarget: "admin",
    title: "Appointment updated",
    message: `${current.patientName} updated an appointment with ${next.doctorName} on ${next.date} at ${next.time}.`,
    type: "appointment_updated",
    relatedAppointmentId: id,
  });
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  options: {
    actorRole?: UserRole;
    changedBy?: string;
    reviewedBy?: string;
    adminNote?: string;
    message?: string;
  } = {}
): Promise<void> {
  const snap = await getDoc(doc(db, "appointments", id));
  if (!snap.exists()) throw new Error("Appointment not found.");

  const current = normalizeAppointment(snap.id, snap.data() as Partial<Appointment>);
  const actorRole = options.actorRole || "patient";
  const timestamp = nowIso();
  const defaultMessage =
    actorRole === "admin"
      ? `Appointment ${status} by admin.`
      : `Appointment ${status} by patient.`;

  const updateData: Partial<Appointment> = {
    status,
    updatedAt: timestamp,
    statusHistory: [
      ...(current.statusHistory || []),
      {
        status,
        message: options.message || defaultMessage,
        changedBy: options.changedBy || options.reviewedBy || current.patientId,
        changedAt: timestamp,
      },
    ],
  };

  if (actorRole === "admin") {
    updateData.reviewedAt = timestamp;
    updateData.reviewedBy = options.reviewedBy || options.changedBy || "admin";
    if (options.adminNote !== undefined) {
      updateData.adminNote = options.adminNote;
    }
  }

  await updateDoc(doc(db, "appointments", id), updateData);

  if (actorRole === "admin") {
    const noteMessage = options.adminNote?.trim()
      ? ` Admin note: ${options.adminNote.trim()}`
      : "";
    await safeCreateNotification({
      userId: current.patientId,
      roleTarget: "patient",
      title: `Appointment ${status}`,
      message: `Your appointment with ${current.doctorName} on ${current.date} at ${current.time} was ${status}.${noteMessage}`,
      type: `appointment_${status}`,
      relatedAppointmentId: id,
    });
  } else if (status === "cancelled") {
    await safeCreateNotification({
      userId: ADMIN_NOTIFICATION_USER_ID,
      roleTarget: "admin",
      title: "Appointment cancelled by patient",
      message: `${current.patientName} cancelled the appointment with ${current.doctorName} on ${current.date} at ${current.time}.`,
      type: "appointment_cancelled_by_patient",
      relatedAppointmentId: id,
    });
  }
}

export async function deleteAppointment(id: string): Promise<void> {
  await deleteDoc(doc(db, "appointments", id));
}

// Notifications

export async function createNotification(
  data: Omit<AppNotification, "id" | "createdAt" | "isRead"> & {
    isRead?: boolean;
  }
): Promise<string> {
  const ref = doc(collection(db, "notifications"));
  await setDoc(ref, {
    id: ref.id,
    ...data,
    isRead: data.isRead || false,
    createdAt: nowIso(),
  });
  return ref.id;
}

export async function getNotificationsForUser(
  userId: string,
  role: UserRole
): Promise<AppNotification[]> {
  const q =
    role === "admin"
      ? query(
          collection(db, "notifications"),
          where("roleTarget", "==", "admin"),
          limit(50)
        )
      : query(collection(db, "notifications"), where("userId", "==", userId), limit(50));

  const snap = await getDocs(q);
  return sortByCreatedDesc(
    snap.docs.map((d) =>
      normalizeNotification(d.id, d.data() as Partial<AppNotification>)
    )
  );
}


export async function getUnreadNotificationsCount(
  userId: string,
  role: UserRole
): Promise<number> {
  const notifications = await getNotificationsForUser(userId, role);
  return notifications.filter((item) => !item.isRead).length;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), {
    isRead: true,
  });
}


export async function markNotificationsAsRead(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => updateDoc(doc(db, "notifications", id), { isRead: true })));
}
