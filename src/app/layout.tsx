import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CTP Quepos - Notificaciones",
  description: "Sistema de notificaciones institucionales del CTP Quepos",
  icons: { icon: "/img/descarga.png", shortcut: "/img/descarga.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${outfit.variable}`}>
      <body className="flex min-h-dvh flex-col bg-surface text-[#1e1e1e] font-sans antialiased">
        <Header />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
          <p>Desarrollado por la Especialidad de Inform&aacute;tica | CTP de Quepos | {new Date().getFullYear()}</p>
        </footer>
      </body>
    </html>
  );
}
