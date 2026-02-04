'use client';

import { useState, useEffect } from 'react';
import { Calculation } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { fetchNotes, deleteNoteSupabase, getProfileRole, fetchProfilesForSuperuser } from '@/lib/data';

export default function NotesList() {
  const [notes, setNotes] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<{ id: string; username: string | null; role: string }[]>([]);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const loadNotes = async (userId: string) => {
    const supabase = createClient();
    setLoading(true);
    try {
      const data = await fetchNotes(supabase, userId);
      setNotes(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotes([]);
        setLoading(false);
        return;
      }
      const r = await getProfileRole(supabase);
      setRole(r);
      setCurrentUserId(user.id);
      setViewingUserId(user.id);
      if (r === 'superuser') {
        const list = await fetchProfilesForSuperuser(supabase);
        setProfiles(list);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (viewingUserId) loadNotes(viewingUserId);
  }, [viewingUserId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calculation?')) return;
    const supabase = createClient();
    try {
      await deleteNoteSupabase(supabase, id);
      if (viewingUserId) await loadNotes(viewingUserId);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const isViewingOwn = currentUserId && viewingUserId === currentUserId;

  if (loading && notes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Saved Calculations</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Calculations</h1>
      {role === 'superuser' && profiles.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="user-select" className="text-sm font-medium text-gray-700">
            View notes for:
          </label>
          <select
            id="user-select"
            value={viewingUserId || ''}
            onChange={(e) => setViewingUserId(e.target.value || null)}
            className="p-2 border border-gray-300 rounded"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username || p.id.slice(0, 8)} ({p.role})
              </option>
            ))}
          </select>
          {!isViewingOwn && (
            <span className="text-sm text-amber-600">View only</span>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}
      {notes.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded text-center">
          <p className="text-gray-600">No saved calculations yet.</p>
          <p className="text-gray-500 text-sm mt-2">Use the calculator to create and save calculations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="font-semibold text-lg">
                    {note.from} → {note.to}
                  </h2>
                  <p className="text-sm text-gray-500">{formatDate(note.timestamp)}</p>
                </div>
                {isViewingOwn && (
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-semibold">{note.distance} miles</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold">{note.time} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-semibold">{note.vehicle.make} {note.vehicle.model}</p>
                  <p className="text-xs text-gray-500">{note.vehicle.mpg} MPG</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fuel Used</p>
                  <p className="font-semibold">{note.fuel} litres</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
