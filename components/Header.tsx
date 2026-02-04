'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getProfileRole, type ProfileRole } from '@/lib/data';

const CAN_MANAGE_STATIONS_VEHICLES: ProfileRole[] = ['superuser', 'admin', 'manager'];
const CAN_MANAGE_USERS: ProfileRole[] = ['superuser', 'admin'];

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<ProfileRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      const load = async () => {
        try {
          const { data: { user: u } } = await supabase.auth.getUser();
          setUserEmail(u?.email ?? null);
          if (u) {
            const r = await getProfileRole(supabase);
            setRole(r);
            router.refresh();
          } else {
            setRole(null);
          }
        } catch {
          setUserEmail(null);
          setRole(null);
        }
      };
      load();
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(() => {
        load();
      });
      subscription = sub;
      const onVisibilityChange = () => load();
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibilityChange);
      }
      return () => {
        subscription?.unsubscribe();
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', onVisibilityChange);
        }
      };
    } catch {
      setUserEmail(null);
      setRole(null);
      return () => {};
    }
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const showStationsVehicles = role && CAN_MANAGE_STATIONS_VEHICLES.includes(role);
  const showUsers = role && CAN_MANAGE_USERS.includes(role);

  return (
    <nav className="bg-orange-600 text-white">
      <div className="max-w-7xl mx-auto flex items-center gap-6 py-4">
        <h1 className="text-xl font-bold">Andys Calculator</h1>
        <div className="flex gap-6 items-center">
          <Link href="/" className="hover:text-orange-200">
            Calculator
          </Link>
          {showStationsVehicles && (
            <>
              <Link href="/stations" className="hover:text-orange-200">
                Stations
              </Link>
              <Link href="/vehicles" className="hover:text-orange-200">
                Vehicles
              </Link>
            </>
          )}
          <Link href="/bulk-upload" className="hover:text-orange-200">
            Bulk Upload
          </Link>
          <Link href="/notes" className="hover:text-orange-200">
            Notes
          </Link>
          <Link href="/mi" className="hover:text-orange-200">
            MI
          </Link>
          {showUsers && (
            <Link href="/users" className="hover:text-orange-200">
              Users
            </Link>
          )}
          {userEmail ? (
            <>
              <span className="text-orange-200 text-sm truncate max-w-[160px]" title={userEmail}>
                {userEmail}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-orange-200 hover:text-white text-sm underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-orange-200 hover:text-white text-sm font-medium">
              Sign in
            </Link>
          )}
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
