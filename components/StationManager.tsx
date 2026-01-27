'use client';

import { useState, useEffect } from 'react';
import { Station } from '@/types';
import { getStations, addStation, updateStation, deleteStation } from '@/utils/storage';
import { validatePostcode } from '@/lib/stations';

export default function StationManager() {
  const [stations, setStations] = useState<Station[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', postcode: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = () => {
    setStations(getStations());
  };

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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this station?')) {
      deleteStation(id);
      loadStations();
      if (editingId === id) {
        setEditingId(null);
        setFormData({ name: '', postcode: '' });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    if (editingId) {
      updateStation(editingId, {
        name: formData.name.trim(),
        postcode: formData.postcode.trim().toUpperCase(),
      });
    } else {
      const newStation: Station = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        postcode: formData.postcode.trim().toUpperCase(),
      };
      addStation(newStation);
    }

    loadStations();
    setEditingId(null);
    setFormData({ name: '', postcode: '' });
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Station Management</h1>

      <div className="mb-6">
        <button
          onClick={handleAdd}
          className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
        >
          Add New Station
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-6">
          <h2 className="font-semibold mb-4">
            {editingId ? 'Edit Station' : 'Add New Station'}
          </h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

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
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map(station => (
              <tr key={station.id} className="border-t">
                <td className="p-3">{station.name}</td>
                <td className="p-3">{station.postcode}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
