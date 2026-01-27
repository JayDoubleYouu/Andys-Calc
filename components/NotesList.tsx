'use client';

import { useState, useEffect } from 'react';
import { Calculation } from '@/types';
import { getNotes, deleteNote } from '@/utils/storage';

export default function NotesList() {
  const [notes, setNotes] = useState<Calculation[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    setNotes(getNotes().sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this calculation?')) {
      deleteNote(id);
      loadNotes();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Saved Calculations</h1>

      {notes.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded text-center">
          <p className="text-gray-600">No saved calculations yet.</p>
          <p className="text-gray-500 text-sm mt-2">Use the calculator to create and save calculations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="bg-white border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="font-semibold text-lg">
                    {note.from} → {note.to}
                  </h2>
                  <p className="text-sm text-gray-500">{formatDate(note.timestamp)}</p>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
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
