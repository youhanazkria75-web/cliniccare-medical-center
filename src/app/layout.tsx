import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ClinicCare Medical Center - Appointment Management System",
  description:
    "Book and manage appointments with ClinicCare Medical Center departments and doctors.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { fontSize: "14px", borderRadius: "10px" },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}