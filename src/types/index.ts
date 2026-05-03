export type UserRole = "patient" | "admin";

export interface MedicalProfile {
  age?: string;
  gender?: string;
  bloodType?: string;
  chronicDiseases?: string;
  allergies?: string;
  currentMedications?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  photoURL?: string;
  medicalProfile?: MedicalProfile;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "rejected";
export type StatusHistoryStatus = AppointmentStatus | "updated";

export interface StatusHistoryItem {
  status: StatusHistoryStatus;
  message: string;
  changedBy: string;
  changedAt: string;
}

export interface Appointment {
  id: string;
  referenceNumber?: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorId?: string;
  doctorName: string;
  department?: string;
  specialty: string;
  date: string;
  time: string;
  symptoms: string;
  status: AppointmentStatus;
  adminNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  statusHistory?: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  availableDays: string[];
  startTime: string;
  endTime: string;
  consultationFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationTargetRole = "patient" | "admin";

export interface AppNotification {
  id: string;
  userId: string;
  roleTarget: NotificationTargetRole;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedAppointmentId?: string;
  createdAt: string;
}

export interface DoctorOption {
  specialty: string;
  doctor: string;
}
