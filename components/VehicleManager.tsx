'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Vehicle } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { fetchVehicles, getProfileRole, addVehicleSupabase, updateVehicleSupabase, deleteVehicleSupabase } from '@/lib/data';
import { validateMPG } from '@/lib/vehicles';

const CAN_ACCESS = ['superuser', 'admin', 'manager'];

export default function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ make: '', model: '', mpg: '', registration: '' });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = async () => {
    const supabase = createClient();
    try {
      const [list, role] = await Promise.all([fetchVehicles(supabase), getProfileRole(supabase)]);
      if (!CAN_ACCESS.includes(role)) {
        router.replace('/');
        return;
      }
      setVehicles(list);
      setCanManage(role === 'superuser' || role === 'admin' || role === 'manager');
      setError(null);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || 'Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ make: '', model: '', mpg: '', registration: '' });
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      mpg: vehicle.mpg.toString(),
      registration: vehicle.registration,
    });
    setError(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormData({ make: '', model: '', mpg: '', registration: '' });
      setShowForm(false);
    }
    const supabase = createClient();
    try {
      await deleteVehicleSupabase(supabase, id);
      await loadVehicles();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
      await loadVehicles();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const mpg = parseFloat(formData.mpg);
    if (!formData.make.trim() || !formData.model.trim()) {
      setError('Make and model are required');
      return;
    }

    if (!formData.registration.trim()) {
      setError('Registration number is required');
      return;
    }

    if (!validateMPG(mpg)) {
      setError('MPG must be a positive number');
      return;
    }

    const supabase = createClient();
    const make = formData.make.trim();
    const model = formData.model.trim();
    const registration = formData.registration.trim().toUpperCase();
    try {
      if (editingId) {
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === editingId
              ? { ...v, make, model, mpg, registration }
              : v
          )
        );
        setShowForm(false);
        setEditingId(null);
        setFormData({ make: '', model: '', mpg: '', registration: '' });
        await updateVehicleSupabase(supabase, editingId, {
          make,
          model,
          mpg,
          registration,
        });
        await loadVehicles();
      } else {
        const newVehicle: Vehicle = {
          id: Date.now().toString(),
          make,
          model,
          mpg,
          registration,
        };
        setVehicles((prev) => [...prev, newVehicle]);
        setShowForm(false);
        setFormData({ make: '', model: '', mpg: '', registration: '' });
        await addVehicleSupabase(supabase, newVehicle);
        await loadVehicles();
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to save vehicle');
      await loadVehicles();
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Vehicle Management</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Vehicle Management</h1>
      {!canManage && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
          You can view vehicles only. Only admins and managers can add or edit vehicles.
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
          onClick={() => { setRefreshing(true); setError(null); loadVehicles(); }}
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
            Add New Vehicle
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6">
          <h2 className="font-semibold mb-4">
            {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Make</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration</label>
              <input
                type="text"
                value={formData.registration}
                onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g., AB21 XYZ"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">MPG</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.mpg}
                onChange={(e) => setFormData({ ...formData, mpg: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
            >
              {editingId ? 'Update' : 'Add'} Vehicle
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({ make: '', model: '', mpg: '', registration: '' });
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

      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full">
          <thead className="bg-orange-100">
            <tr>
              <th className="p-3 text-left">Make</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">Registration</th>
              <th className="p-3 text-left">MPG</th>
              {canManage && <th className="p-3 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t">
                <td className="p-3">{vehicle.make || 'N/A'}</td>
                <td className="p-3">{vehicle.model || 'N/A'}</td>
                <td className="p-3">{vehicle.registration || 'N/A'}</td>
                <td className="p-3">{vehicle.mpg ?? 'N/A'}</td>
                {canManage && (
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="text-orange-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
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
