'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Calculator from '@/components/Calculator';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function HomePage() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setChecking(false);
      return;
    }
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      supabase.auth.getUser()
        .then(({ data: { user: u } }) => {
          setUser(u ?? null);
          setChecking(false);
        })
        .catch(() => {
          setUser(null);
          setChecking(false);
        });
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      subscription = sub;
    } catch {
      setUser(null);
      setChecking(false);
    }
    return () => subscription?.unsubscribe();
  }, []);

  // Show welcome + login whenever not logged in (no loading flash)
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-orange-100 p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Andys Calculator</h1>
          <p className="text-gray-600 mb-8">Sign in to use the calculator, stations, and notes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex justify-center items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex justify-center items-center px-6 py-3 border-2 border-orange-600 text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return <Calculator />;
}
