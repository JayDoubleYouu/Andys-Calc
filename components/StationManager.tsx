'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Station } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { fetchStations, getProfileRole, addStationSupabase, updateStationSupabase, deleteStationSupabase } from '@/lib/data';
import { validatePostcode } from '@/lib/stations';

const CAN_ACCESS = ['superuser', 'admin', 'manager'];

export default function StationManager() {
  const [stations, setStations] = useState<Station[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', postcode: '' });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStations = async () => {
    try {
      const supabase = createClient();
      const [list, role] = await Promise.all([fetchStations(supabase), getProfileRole(supabase)]);
      if (!CAN_ACCESS.includes(role)) {
        router.replace('/');
        return;
      }
      setStations(list);
      setCanManage(role === 'superuser' || role === 'admin' || role === 'manager');
      setError(null);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to load stations');
      setStations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ name: '', postcode: '' });
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (station: Station) => {
    setEditingId(station.id);
    setFormData({
      name: station.name,
      postcode: station.postcode,
    });
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this station?')) return;
    setStations((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormData({ name: '', postcode: '' });
      setShowForm(false);
    }
    const supabase = createClient();
    try {
      await deleteStationSupabase(supabase, id);
      await loadStations();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
      await loadStations();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Station name is required');
      return;
    }

    if (!formData.postcode.trim()) {
      setError('Postcode is required');
      return;
    }

    if (!validatePostcode(formData.postcode)) {
      setError('Please enter a valid UK postcode (e.g., SW1A 1AA)');
      return;
    }

    const supabase = createClient();
    const name = formData.name.trim();
    const postcode = formData.postcode.trim().toUpperCase();
    try {
      if (editingId) {
        setStations((prev) =>
          prev.map((s) =>
            s.id === editingId ? { ...s, name, postcode } : s
          )
        );
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', postcode: '' });
        await updateStationSupabase(supabase, editingId, { name, postcode });
        await loadStations();
      } else {
        const newStation: Station = {
          id: Date.now().toString(),
          name,
          postcode,
        };
        setStations((prev) => [...prev, newStation]);
        setShowForm(false);
        setFormData({ name: '', postcode: '' });
        await addStationSupabase(supabase, newStation);
        await loadStations();
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save station');
      await loadStations();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Station Management</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Station Management</h1>
      {!canManage && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
          You can view stations only. Only admins and managers can add or edit stations.
        </p>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-4 text-sm">
          {error}
          {(error.includes('policy') || error.includes('row level') || error.includes('RLS') || error.includes('permission') || error.includes('JWT')) && (
            <p className="mt-2 text-xs">Run supabase/fix_profiles_rls_recursion.sql in Supabase SQL Editor and ensure your user has superuser/admin/manager role.</p>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setRefreshing(true); setError(null); loadStations(); }}
          disabled={refreshing}
          className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
        >
          {refreshing ? 'Refreshing…' : 'Refresh list'}
        </button>
        {canManage && (
          <button
            onClick={handleAdd}
            className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
          >
            Add New Station
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6">
          <h2 className="font-semibold mb-4">
            {editingId ? 'Edit Station' : 'Add New Station'}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Station Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postcode</label>
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., SW1A 1AA"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
            >
              {editingId ? 'Update' : 'Add'} Station
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', postcode: '' });
                setError(null);
                setShowForm(false);
              }}
              className="bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded">
        <table className="w-full">
          <thead className="bg-orange-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Postcode</th>
              {canManage && <th className="p-3 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr key={station.id} className="border-t">
                <td className="p-3">{station.name}</td>
                <td className="p-3">{station.postcode}</td>
                {canManage && (
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(station)}
                      className="text-orange-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(station.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
