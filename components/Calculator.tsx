'use client';

import { useState, useEffect } from 'react';
import { Station, Vehicle, Calculation } from '@/types';
import { getStations, getVehicles, saveNote, getNotes, deleteNote, clearAllNotes } from '@/utils/storage';
import { getRouteDistance } from '@/lib/api';
import { geocodePostcode } from '@/lib/geocode';

export default function Calculator() {
  const [stations, setStations] = useState<Station[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [notes, setNotes] = useState<Calculation[]>([]);
  const [fromStation, setFromStation] = useState<string>('');
  const [toStation, setToStation] = useState<string>('');
  const [fromStationSearch, setFromStationSearch] = useState<string>('');
  const [toStationSearch, setToStationSearch] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [vehicleSearch, setVehicleSearch] = useState<string>('');
  const [distance, setDistance] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [fuel, setFuel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStations(getStations());
    setVehicles(getVehicles());
    loadNotes();
  }, []);

  const loadNotes = () => {
    setNotes(getNotes().sort((a, b) => b.timestamp - a.timestamp));
  };

  // Filter stations based on search terms
  const filteredFromStations = stations.filter(station => {
    if (!fromStationSearch.trim()) return true;
    const searchLower = fromStationSearch.toLowerCase().trim();
    return station.name?.toLowerCase().includes(searchLower) ||
           station.postcode?.toLowerCase().includes(searchLower);
  });

  const filteredToStations = stations.filter(station => {
    if (!toStationSearch.trim()) return true;
    const searchLower = toStationSearch.toLowerCase().trim();
    return station.name?.toLowerCase().includes(searchLower) ||
           station.postcode?.toLowerCase().includes(searchLower);
  });

  const calculateRoute = async () => {
    if (!fromStation || !toStation) {
      setError('Please select both from and to stations');
      return;
    }

    const from = stations.find(s => s.id === fromStation);
    const to = stations.find(s => s.id === toStation);

    if (!from || !to) {
      setError('Invalid station selection');
      return;
    }

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      // Geocode postcodes to get coordinates
      let fromCoords, toCoords;
      try {
        fromCoords = await geocodePostcode(from.postcode);
      } catch (err) {
        setError(`Failed to geocode postcode for ${from.name} (${from.postcode}). Please check the postcode is valid.`);
        setLoading(false);
        return;
      }

      try {
        toCoords = await geocodePostcode(to.postcode);
      } catch (err) {
        setError(`Failed to geocode postcode for ${to.name} (${to.postcode}). Please check the postcode is valid.`);
        setLoading(false);
        return;
      }

      const result = await getRouteDistance(
        fromCoords.latitude,
        fromCoords.longitude,
        toCoords.latitude,
        toCoords.longitude
      );

      setDistance(result.distance);
      setTime(result.duration);

      if (selectedVehicle) {
        const vehicle = vehicles.find(v => v.id === selectedVehicle);
        if (vehicle) {
          // Calculate fuel: (distance in miles / MPG) * 4.54609 (litres per gallon)
          const fuelLitres = (result.distance / vehicle.mpg) * 4.54609;
          setFuel(Math.round(fuelLitres * 10) / 10);
        } else {
          setFuel(null);
        }
      } else {
        setFuel(null);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      if (errorMessage.includes('geocode')) {
        // Already handled above
        return;
      }
      setError(`Failed to calculate route: ${errorMessage}. Please check the postcodes are valid and try again.`);
      console.error('Route calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFromStationChange = (stationId: string) => {
    setFromStation(stationId);
    const station = stations.find(s => s.id === stationId);
    if (station) {
      setFromStationSearch(station.name);
    }
  };

  const handleToStationChange = (stationId: string) => {
    setToStation(stationId);
    const station = stations.find(s => s.id === stationId);
    if (station) {
      setToStationSearch(station.name);
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setVehicleSearch(vehicle.registration);
      if (distance) {
        const fuelLitres = (distance / vehicle.mpg) * 4.54609;
        setFuel(Math.round(fuelLitres * 10) / 10);
      }
    } else {
      setFuel(null);
    }
  };

  // Filter vehicles based on search term (registration, make, or model)
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!vehicleSearch.trim()) return true;
    const searchLower = vehicleSearch.toLowerCase().trim();
    return (
      vehicle.registration?.toLowerCase().includes(searchLower) ||
      vehicle.make?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower)
    );
  });

  const handleSave = () => {
    if (!fromStation || !toStation || !selectedVehicle || !distance || !time || fuel === null) {
      setError('Please complete the calculation before saving');
      return;
    }

    const from = stations.find(s => s.id === fromStation);
    const to = stations.find(s => s.id === toStation);
    const vehicle = vehicles.find(v => v.id === selectedVehicle);

    if (!from || !to || !vehicle) {
      setError('Invalid data');
      return;
    }

    const calculation = {
      id: Date.now().toString(),
      from: from.name,
      to: to.name,
      distance,
      time,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        mpg: vehicle.mpg,
        registration: vehicle.registration,
      },
      fuel,
      timestamp: Date.now(),
    };

    saveNote(calculation);
    setSaved(true);
    loadNotes();
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this calculation?')) {
      deleteNote(id);
      loadNotes();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportToCSV = () => {
    if (notes.length === 0) {
      setError('No calculations to export');
      return;
    }

    // CSV header
    const headers = ['Date', 'From Station', 'To Station', 'Distance (miles)', 'Time (minutes)', 'Vehicle Make', 'Vehicle Model', 'Registration', 'MPG', 'Fuel Used (litres)'];
    
    // CSV rows
    const rows = notes.map(note => {
      const date = new Date(note.timestamp).toLocaleString();
      return [
        date,
        note.from,
        note.to,
        note.distance.toString(),
        note.time.toString(),
        note.vehicle.make,
        note.vehicle.model,
        note.vehicle.registration,
        note.vehicle.mpg.toString(),
        note.fuel.toString(),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `route-calculations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-6">Route Calculator</h1>

          <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">From Station</label>
          <input
            type="text"
            value={fromStationSearch}
            onChange={(e) => {
              setFromStationSearch(e.target.value);
              // Clear selection if search doesn't match current station
              if (fromStation) {
                const currentStation = stations.find(s => s.id === fromStation);
                if (currentStation && !currentStation.name?.toLowerCase().includes(e.target.value.toLowerCase().trim())) {
                  setFromStation('');
                }
              }
            }}
            placeholder="Search by station name or postcode..."
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <select
            value={fromStation}
            onChange={(e) => handleFromStationChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select station {filteredFromStations.length !== stations.length ? `(${filteredFromStations.length} found)` : ''}</option>
            {filteredFromStations.map(station => (
              <option key={station.id} value={station.id}>
                {station.name} ({station.postcode})
              </option>
            ))}
          </select>
          {fromStationSearch.trim() && filteredFromStations.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No stations found matching "{fromStationSearch}"</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">To Station</label>
          <input
            type="text"
            value={toStationSearch}
            onChange={(e) => {
              setToStationSearch(e.target.value);
              // Clear selection if search doesn't match current station
              if (toStation) {
                const currentStation = stations.find(s => s.id === toStation);
                if (currentStation && !currentStation.name?.toLowerCase().includes(e.target.value.toLowerCase().trim())) {
                  setToStation('');
                }
              }
            }}
            placeholder="Search by station name or postcode..."
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <select
            value={toStation}
            onChange={(e) => handleToStationChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Select station {filteredToStations.length !== stations.length ? `(${filteredToStations.length} found)` : ''}</option>
            {filteredToStations.map(station => (
              <option key={station.id} value={station.id}>
                {station.name} ({station.postcode})
              </option>
            ))}
          </select>
          {toStationSearch.trim() && filteredToStations.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No stations found matching "{toStationSearch}"</p>
          )}
        </div>

            <button
              onClick={calculateRoute}
              disabled={loading || !fromStation || !toStation}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculating...' : 'Calculate Route'}
            </button>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {(distance !== null || time !== null) && (
          <div className="bg-gray-50 p-4 rounded border">
            <h2 className="font-semibold mb-2">Route Information</h2>
            {distance !== null && (
              <p className="mb-1">Distance: <strong>{distance} miles</strong></p>
            )}
            {time !== null && (
              <p className="mb-1">Time: <strong>{time} minutes</strong></p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Vehicle</label>
          <input
            type="text"
            value={vehicleSearch}
            onChange={(e) => {
              setVehicleSearch(e.target.value);
              // Clear selection if search doesn't match current vehicle
              if (selectedVehicle) {
                const currentVehicle = vehicles.find(v => v.id === selectedVehicle);
                if (currentVehicle && !currentVehicle.registration?.toLowerCase().includes(e.target.value.toLowerCase().trim())) {
                  setSelectedVehicle('');
                  setFuel(null);
                }
              }
            }}
            placeholder="Search by registration, make, or model..."
            className="w-full p-2 border border-gray-300 rounded mb-2"
            disabled={distance === null}
          />
          <select
            value={selectedVehicle}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={distance === null}
          >
            <option value="">Select vehicle {filteredVehicles.length !== vehicles.length ? `(${filteredVehicles.length} found)` : ''}</option>
            {filteredVehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} - {vehicle.registration} ({vehicle.mpg} MPG)
              </option>
            ))}
          </select>
          {vehicleSearch.trim() && filteredVehicles.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No vehicles found matching "{vehicleSearch}"</p>
          )}
        </div>

        {fuel !== null && (
          <div className="bg-gray-50 p-4 rounded border">
            <p className="font-semibold">Fuel Consumption: <strong>{fuel} litres</strong></p>
          </div>
        )}

            <button
              onClick={handleSave}
              disabled={!fromStation || !toStation || !selectedVehicle || !distance || !time || fuel === null}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saved ? 'Saved!' : 'Save Calculation'}
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Saved Calculations</h2>
            {notes.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  className="bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
                >
                  Export to CSV
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
                      clearAllNotes();
                      loadNotes();
                    }
                  }}
                  className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          {notes.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded text-center border">
              <p className="text-gray-600">No saved calculations yet.</p>
              <p className="text-gray-500 text-sm mt-2">Use the calculator to create and save calculations.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {notes.map(note => (
                <div key={note.id} className="bg-white border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {note.from} → {note.to}
                      </h3>
                      <p className="text-sm text-gray-500">{formatDate(note.timestamp)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
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
                      <p className="text-xs text-gray-500">{note.vehicle.registration} - {note.vehicle.mpg} MPG</p>
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
      </div>
    </div>
  );
}
