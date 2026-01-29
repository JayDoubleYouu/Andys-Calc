import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

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
        <Header />
        <main className="min-h-screen bg-orange-50">
          {children}
        </main>
      </body>
    </html>
  );
}
