import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Particles from "@/components/Particles";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACCPS | AI Content Copyright Protection",
  description:
    "Blockchain-powered AI content copyright protection system on Sepolia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground selection:bg-primary selection:text-white`}
      >
        <AuthProvider>
          <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
          <Particles />
          <Navbar />
          <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
            {children}
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111",
                color: "#e5e5e5",
                border: "1px solid #262626",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
