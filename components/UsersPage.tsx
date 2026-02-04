'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  fetchProfilesForSuperuser,
  getProfileRole,
  updateProfileRole,
  type ProfileRow,
  type AssignableRole,
} from '@/lib/data';

const CAN_ACCESS: string[] = ['superuser', 'admin'];
const ASSIGNABLE_ROLES: AssignableRole[] = ['general', 'admin', 'manager'];

export default function UsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const r = await getProfileRole(supabase);
      if (!CAN_ACCESS.includes(r)) {
        router.replace('/');
        return;
      }
      setRole(r);
      try {
        const list = await fetchProfilesForSuperuser(supabase);
        setProfiles(list);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed to load users');
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleRoleChange = async (userId: string, newRole: AssignableRole) => {
    const supabase = createClient();
    setUpdatingId(userId);
    setError(null);
    try {
      await updateProfileRole(supabase, userId, newRole);
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">User management</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User management</h1>
      <p className="text-gray-600 text-sm mb-4">
        Users who have signed in. Only superuser and admin can assign roles. Role cannot be chosen at sign-in.
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full">
          <thead className="bg-orange-100">
            <tr>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Change role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.email || '—'}</td>
                <td className="p-3">{p.username || '—'}</td>
                <td className="p-3">
                  <span className="font-medium">{p.role}</span>
                </td>
                <td className="p-3">
                  {p.role === 'superuser' ? (
                    <span className="text-gray-500 text-sm">Set via SQL only</span>
                  ) : (
                    <select
                      value={p.role}
                      disabled={updatingId === p.id}
                      onChange={(e) =>
                        handleRoleChange(p.id, e.target.value as AssignableRole)
                      }
                      className="p-2 border border-gray-300 rounded text-sm"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {profiles.length === 0 && (
        <p className="text-gray-500 mt-4">No users yet. Sign up to create the first account (they will be superuser).</p>
      )}
    </div>
  );
}
