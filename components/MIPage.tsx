'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calculation, Vehicle } from '@/types';
import { getNotes, getVehicles } from '@/utils/storage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { findVehicleByRegistration } from '@/lib/vehicles';

interface VehicleStats {
  vehicle: Vehicle;
  totalMiles: number;
  totalFuel: number;
  totalMinutes: number;
  journeys: Calculation[];
}

interface MonthlyData {
  month: string;
  miles: number;
  fuel: number;
  minutes: number;
  moves: number;
}

export default function MIPage() {
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [searchRegistration, setSearchRegistration] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [allNotes, setAllNotes] = useState<Calculation[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const notes = getNotes();
    setAllNotes(notes);
    calculateStats(notes);
  };

  const calculateStats = (notes: Calculation[]) => {
    const vehicles = getVehicles();
    const statsMap = new Map<string, VehicleStats>();

    // Initialize stats for all vehicles
    vehicles.forEach(vehicle => {
      statsMap.set(vehicle.id, {
        vehicle,
        totalMiles: 0,
        totalFuel: 0,
        totalMinutes: 0,
        journeys: [],
      });
    });

    // Aggregate stats from notes
    notes.forEach(note => {
      const vehicleId = note.vehicle.id;
      const stats = statsMap.get(vehicleId);
      
      if (stats) {
        stats.totalMiles += note.distance;
        stats.totalFuel += note.fuel;
        stats.totalMinutes += note.time;
        stats.journeys.push(note);
      }
    });

    // Convert to array and sort by total miles (descending)
    const statsArray = Array.from(statsMap.values())
      .filter(stats => stats.journeys.length > 0)
      .sort((a, b) => b.totalMiles - a.totalMiles);

    setVehicleStats(statsArray);
  };

  // Apply filters function
  const applyFilters = useCallback((notes: Calculation[]): Calculation[] => {
    let filtered = [...notes];

    // Filter by registration
    if (searchRegistration.trim()) {
      const vehicles = getVehicles();
      const vehicle = findVehicleByRegistration(vehicles, searchRegistration.trim());
      if (vehicle) {
        filtered = filtered.filter(n => n.vehicle.id === vehicle.id);
      } else {
        filtered = []; // No vehicle found with that registration
      }
    }

    // Filter by month
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.timestamp);
        return noteDate.getFullYear() === parseInt(year) && 
               noteDate.getMonth() + 1 === parseInt(month);
      });
    }

    return filtered;
  }, [searchRegistration, selectedMonth]);

  // Calculate overall totals
  const overallTotals = useMemo(() => {
    const filteredNotes = applyFilters(allNotes);
    return {
      totalMoves: filteredNotes.length,
      totalMiles: filteredNotes.reduce((sum, n) => sum + n.distance, 0),
      totalFuel: filteredNotes.reduce((sum, n) => sum + n.fuel, 0),
      totalMinutes: filteredNotes.reduce((sum, n) => sum + n.time, 0),
    };
  }, [allNotes, applyFilters]);

  // Calculate monthly data for graph
  const monthlyData = useMemo(() => {
    const filteredNotes = applyFilters(allNotes);
    
    if (filteredNotes.length === 0) {
      return [];
    }
    
    const monthlyMap = new Map<string, MonthlyData>();

    filteredNotes.forEach(note => {
      const date = new Date(note.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthLabel,
          miles: 0,
          fuel: 0,
          minutes: 0,
          moves: 0,
        });
      }

      const data = monthlyMap.get(monthKey)!;
      data.miles += note.distance;
      data.fuel += note.fuel;
      data.minutes += note.time;
      data.moves += 1;
    });

    return Array.from(monthlyMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [allNotes, applyFilters]);

  // Get available months for filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allNotes.forEach(note => {
      const date = new Date(note.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [allNotes]);

  // Filtered vehicle stats
  const filteredVehicleStats = useMemo(() => {
    if (!searchRegistration.trim()) return vehicleStats;
    
    const vehicles = getVehicles();
    const vehicle = findVehicleByRegistration(vehicles, searchRegistration.trim());
    if (!vehicle) return [];

    const stats = vehicleStats.find(s => s.vehicle.id === vehicle.id);
    return stats ? [stats] : [];
  }, [vehicleStats, searchRegistration]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const selectedStats = selectedVehicle 
    ? filteredVehicleStats.find(s => s.vehicle.id === selectedVehicle)
    : null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Management Information</h1>

      {allNotes.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded text-center border">
          <p className="text-gray-600">No journey data available yet.</p>
          <p className="text-gray-500 text-sm mt-2">Start calculating routes to see vehicle statistics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Moves</p>
              <p className="text-3xl font-bold text-orange-600">{overallTotals.totalMoves}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Miles</p>
              <p className="text-3xl font-bold text-orange-600">{overallTotals.totalMiles.toFixed(1)}</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Fuel Used</p>
              <p className="text-3xl font-bold text-orange-600">{overallTotals.totalFuel.toFixed(1)}L</p>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Time</p>
              <p className="text-3xl font-bold text-orange-600">{formatTime(overallTotals.totalMinutes)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search by Registration</label>
                <input
                  type="text"
                  value={searchRegistration}
                  onChange={(e) => setSearchRegistration(e.target.value)}
                  placeholder="Enter registration..."
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">All Months</option>
                  {availableMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                    const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                    return (
                      <option key={month} value={month}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchRegistration('');
                    setSelectedMonth('');
                  }}
                  className="w-full bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Graph */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Usage Over Time</h2>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="miles" 
                    stroke="#f97316" 
                    name="Miles"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="fuel" 
                    stroke="#ea580c" 
                    name="Fuel (L)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="moves" 
                    stroke="#fb923c" 
                    name="Moves"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No data available for the selected filters</p>
              </div>
            )}
          </div>

          {/* Vehicle Cards */}
          {filteredVehicleStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredVehicleStats.map(stats => (
                <div
                  key={stats.vehicle.id}
                  onClick={() => setSelectedVehicle(selectedVehicle === stats.vehicle.id ? null : stats.vehicle.id)}
                  className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedVehicle === stats.vehicle.id ? 'border-orange-600 shadow-lg' : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <h3 className="font-bold text-lg mb-2">
                    {stats.vehicle.make} {stats.vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{stats.vehicle.registration}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Total Miles</p>
                      <p className="font-semibold text-lg">{stats.totalMiles.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Fuel</p>
                      <p className="font-semibold text-lg">{stats.totalFuel.toFixed(1)}L</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Journeys</p>
                      <p className="font-semibold text-lg">{stats.journeys.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Time</p>
                      <p className="font-semibold text-lg">{formatTime(stats.totalMinutes)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchRegistration.trim() ? (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-yellow-800">No vehicle found with registration: {searchRegistration}</p>
            </div>
          ) : null}

          {/* Detailed View for Selected Vehicle */}
          {selectedStats && (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedStats.vehicle.make} {selectedStats.vehicle.model}
                  </h2>
                  <p className="text-gray-600">Registration: {selectedStats.vehicle.registration}</p>
                  <p className="text-gray-600">MPG: {selectedStats.vehicle.mpg}</p>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-orange-50 rounded">
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedStats.totalMiles.toFixed(1)} miles</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Fuel Used</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedStats.totalFuel.toFixed(1)} litres</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Driving Time</p>
                  <p className="text-2xl font-bold text-orange-600">{formatTime(selectedStats.totalMinutes)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Number of Journeys</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedStats.journeys.length}</p>
                </div>
              </div>

              <h3 className="font-semibold text-lg mb-4">Journey History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-orange-100">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">From</th>
                      <th className="p-3 text-left">To</th>
                      <th className="p-3 text-left">Distance</th>
                      <th className="p-3 text-left">Time</th>
                      <th className="p-3 text-left">Fuel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStats.journeys
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map(journey => (
                        <tr key={journey.id} className="border-t">
                          <td className="p-3 text-sm">{formatDate(journey.timestamp)}</td>
                          <td className="p-3">{journey.from}</td>
                          <td className="p-3">{journey.to}</td>
                          <td className="p-3">{journey.distance} miles</td>
                          <td className="p-3">{journey.time} min</td>
                          <td className="p-3">{journey.fuel}L</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
