import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff2",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ChantierHub",
  description: "Gestion et suivi de projet de construction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
