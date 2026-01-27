import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andys Calculator",
  description: "Calculate routes and fuel consumption between ambulance stations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-orange-600 text-white p-4">
          <div className="max-w-7xl mx-auto flex items-center gap-6">
            <h1 className="text-xl font-bold">Andys Calculator</h1>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-orange-200">
                Calculator
              </Link>
            <Link href="/stations" className="hover:text-orange-200">
              Stations
            </Link>
            <Link href="/vehicles" className="hover:text-orange-200">
              Vehicles
            </Link>
            <Link href="/bulk-upload" className="hover:text-orange-200">
              Bulk Upload
            </Link>
            <Link href="/mi" className="hover:text-orange-200">
              MI
            </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-orange-50">
          {children}
        </main>
      </body>
    </html>
  );
}
