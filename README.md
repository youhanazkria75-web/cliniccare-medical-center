# ClinicCare — Clinic Appointment Management System

A full-stack medical information system built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Firebase** (Authentication + Firestore).

---

## Features

| Role    | Capabilities |
|---------|-------------|
| Patient | Register / login, book appointments, view/edit/cancel pending appointments, delete cancelled appointments, update profile |
| Admin   | Login, view all appointments with status filters, confirm / cancel / delete any appointment, view all patients |

---

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase Authentication** (email/password)
- **Firebase Firestore** (NoSQL database)
- **react-hot-toast** (notifications)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── login/page.tsx                  # Login
│   ├── register/page.tsx               # Registration
│   ├── patient/
│   │   ├── dashboard/page.tsx          # Patient dashboard
│   │   ├── book-appointment/page.tsx   # Book appointment form
│   │   ├── appointments/page.tsx       # My appointments (edit/cancel/delete)
│   │   └── profile/page.tsx            # Edit profile
│   └── admin/
│       ├── dashboard/page.tsx          # Admin dashboard
│       ├── appointments/page.tsx       # All appointments (confirm/cancel/delete)
│       └── patients/page.tsx           # All patients list
├── components/
│   ├── PatientLayout.tsx               # Patient sidebar layout
│   ├── AdminLayout.tsx                 # Admin sidebar layout
│   └── StatusBadge.tsx                 # Status badge component
├── contexts/
│   └── AuthContext.tsx                 # Auth state + helpers
├── data/
│   └── doctors.ts                      # Fixed specialties & time slots
├── lib/
│   ├── firebase.ts                     # Firebase initialization
│   └── firestore.ts                    # All Firestore CRUD operations
└── types/
    └── index.ts                        # TypeScript types
```

---

## Step 1 — Firebase Setup

### 1.1 Create a Firebase project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → give it a name (e.g. `clinic-care`) → Continue
3. Disable Google Analytics (optional) → Create project

### 1.2 Enable Authentication

1. In the Firebase console, go to **Authentication → Get Started**
2. Under **Sign-in method**, enable **Email/Password**
3. Click **Save**

### 1.3 Create Firestore Database

1. Go to **Firestore Database → Create database**
2. Choose **"Start in production mode"** (we'll add rules below)
3. Pick a region close to your users → Enable

### 1.4 Get your Firebase config

1. Go to **Project Settings** (gear icon) → **General** → scroll to **Your apps**
2. Click **"</> Web"** and register the app
3. Copy the `firebaseConfig` values

### 1.5 Set up Firestore Security Rules

1. Go to **Firestore → Rules**
2. Replace the default rules with the content of `firestore.rules` in this project
3. Click **Publish**

---

## Step 2 — Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then fill in your actual Firebase values in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=clinic-care.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=clinic-care
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=clinic-care.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
```

---

## Step 3 — Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 4 — Create the First Admin Account

Admin accounts must be created manually. Here's how:

1. **Register a normal account** at `/register` using the email you want as admin.
2. **Open Firebase Console → Firestore → users collection**
3. Find the document with your registered email.
4. Click on the `role` field and change its value from `"patient"` to `"admin"`
5. Click **Update**

Next time you log in with that email, you'll be redirected to `/admin/dashboard`.

---

## Doctors & Specialties

These are hardcoded in `src/data/doctors.ts`:

| Specialty        | Doctor             |
|------------------|--------------------|
| Cardiology       | Dr. Sara Ahmed     |
| Dermatology      | Dr. Omar Hassan    |
| Pediatrics       | Dr. Mona Ali       |
| Orthopedics      | Dr. Karim Youssef  |
| General Medicine | Dr. Ahmed Samir    |

---

## Firestore Collections

### `users`
```
{
  uid: string,
  fullName: string,
  email: string,
  phone: string,
  role: "patient" | "admin",
  createdAt: ISO string,
  updatedAt: ISO string
}
```

### `appointments`
```
{
  id: string,
  patientId: string,
  patientName: string,
  patientEmail: string,
  patientPhone: string,
  specialty: string,
  doctorName: string,
  date: string (YYYY-MM-DD),
  time: string (e.g. "09:00 AM"),
  symptoms: string,
  status: "pending" | "confirmed" | "cancelled",
  createdAt: ISO string,
  updatedAt: ISO string
}
```

---

## Routing & Protection

| Route | Access |
|-------|--------|
| `/` | Public |
| `/login` | Public |
| `/register` | Public |
| `/patient/*` | Authenticated patients only |
| `/admin/*` | Authenticated admins only |

- Not logged in → redirect to `/login`
- Patient accessing `/admin/*` → redirect to `/patient/dashboard`
- Admin accessing `/patient/*` → redirect to `/admin/dashboard`

---

## Build for Production

```bash
npm run build
npm start
```
