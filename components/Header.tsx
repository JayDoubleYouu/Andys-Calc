'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <nav className="bg-orange-600 text-white">
      <div className="max-w-7xl mx-auto flex items-center gap-6 py-4">
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
      {/* Ambulance track - same path, facing right, with flashing lights */}
      <div className="relative h-10 overflow-hidden bg-orange-700/50">
        <div
          className="absolute top-1/2 z-[1] ambulance-drive flex items-center gap-0.5"
          style={{ willChange: 'left' }}
          aria-hidden
        >
          <span className="text-2xl relative" role="img" aria-label="Ambulance">
            🚑
          </span>
          {/* Flashing roof lights */}
          <span
            className="ambulance-light w-2 h-2 rounded-full bg-blue-400"
            style={{ color: 'rgb(96 165 250)' }}
          />
          <span
            className="ambulance-light w-2 h-2 rounded-full bg-red-500"
            style={{ color: 'rgb(239 68 68)' }}
          />
        </div>
      </div>
    </nav>
  );
}
