'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/types';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle, saveVehicles } from '@/utils/storage';
import { defaultVehicles } from '@/lib/vehicles';
import { validateMPG } from '@/lib/vehicles';

export default function VehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ make: '', model: '', mpg: '', registration: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setVehicles(getVehicles());
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ make: '', model: '', mpg: '', registration: '' });
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData({ make: vehicle.make, model: vehicle.model, mpg: vehicle.mpg.toString(), registration: vehicle.registration });
    setError(null);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicle(id);
      loadVehicles();
      if (editingId === id) {
        setEditingId(null);
        setFormData({ make: '', model: '', mpg: '', registration: '' });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    if (editingId) {
      updateVehicle(editingId, {
        make: formData.make.trim(),
        model: formData.model.trim(),
        mpg,
        registration: formData.registration.trim().toUpperCase(),
      });
    } else {
      const newVehicle: Vehicle = {
        id: Date.now().toString(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        mpg,
        registration: formData.registration.trim().toUpperCase(),
      };
      addVehicle(newVehicle);
    }

    loadVehicles();
    setEditingId(null);
    setFormData({ make: '', model: '', mpg: '', registration: '' });
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Vehicle Management</h1>

      <div className="mb-6 flex gap-2">
        <button
          onClick={handleAdd}
          className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
        >
          Add New Vehicle
        </button>
        <button
          onClick={() => {
            if (confirm('Reset all vehicles to default database? This will replace your current vehicles with the full list of 516 vehicles.')) {
              saveVehicles(defaultVehicles);
              loadVehicles();
            }
          }}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Reset to Default Vehicles
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6">
          <h2 className="font-semibold mb-4">
            {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

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

      <div className="bg-white border rounded">
        <table className="w-full">
          <thead className="bg-orange-100">
            <tr>
              <th className="p-3 text-left">Make</th>
              <th className="p-3 text-left">Model</th>
              <th className="p-3 text-left">Registration</th>
              <th className="p-3 text-left">MPG</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(vehicle => (
              <tr key={vehicle.id} className="border-t">
                <td className="p-3">{vehicle.make || 'N/A'}</td>
                <td className="p-3">{vehicle.model || 'N/A'}</td>
                <td className="p-3">{vehicle.registration || 'N/A'}</td>
                <td className="p-3">{vehicle.mpg || 'N/A'}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
