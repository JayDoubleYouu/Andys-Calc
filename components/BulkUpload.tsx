'use client';

import { useState } from 'react';
import { getStations, getVehicles, saveNote, addStation, addVehicle } from '@/utils/storage';
import { findStationByNameFuzzy } from '@/lib/stations';
import { findVehicleByRegistration, getMPGByMakeModel } from '@/lib/vehicles';
import { geocodePostcode } from '@/lib/geocode';
import { getRouteDistance } from '@/lib/api';
import { Vehicle } from '@/types';

interface ProcessingResult {
  success: boolean;
  row: number;
  registration: string;
  from: string;
  to: string;
  error?: string;
}

interface MissingVehicle {
  registration: string;
  make: string;
  model: string;
  mpg: number;
}

export default function BulkUpload() {
  const [inputData, setInputData] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [missingVehicles, setMissingVehicles] = useState<Map<string, MissingVehicle>>(new Map());
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [currentVehicleReg, setCurrentVehicleReg] = useState<string>('');
  const [vehicleForm, setVehicleForm] = useState({ make: '', model: '', mpg: '' });
  const [validatedRows, setValidatedRows] = useState<Array<{ registration: string; from: string; to: string }>>([]);
  const [readyToProcess, setReadyToProcess] = useState(false);

  const parseInput = (text: string): Array<{ registration: string; from: string; to: string }> => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const rows: Array<{ registration: string; from: string; to: string }> = [];

    lines.forEach((line, index) => {
      let parts: string[] = [];
      
      if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else {
        parts = line.split(/\s{2,}/).map(p => p.trim());
      }
      
      parts = parts.filter(p => p && p.length > 0);
      
      if (parts.length >= 3) {
        const registration = (parts[0] || '').trim();
        const from = (parts[1] || '').trim();
        const to = parts.slice(2).join(' ').trim();
        
        if (registration && registration.length > 0 && 
            from && from.length > 0 && 
            to && to.length > 0) {
          rows.push({
            registration,
            from,
            to,
          });
        }
      }
    });

    return rows;
  };

  const validateAndFindMissingVehicles = () => {
    const rows = parseInput(inputData);
    if (rows.length === 0) {
      alert('No valid data found. Please check the format.');
      return;
    }

    const allVehicles = getVehicles();
    const missing = new Map<string, MissingVehicle>();
    const validRows: Array<{ registration: string; from: string; to: string }> = [];

    rows.forEach(row => {
      const registrationUpper = (row.registration || '').trim().toUpperCase();
      if (!registrationUpper) return;

      const vehicle = findVehicleByRegistration(allVehicles, registrationUpper);
      if (!vehicle) {
        // Vehicle not found - add to missing list
        // This row will NOT be added to validatedRows until vehicle is added
        if (!missing.has(registrationUpper)) {
          missing.set(registrationUpper, {
            registration: registrationUpper,
            make: '',
            model: '',
            mpg: 35, // default
          });
        }
        // IMPORTANT: Do NOT add this row to validRows - it will be excluded from processing
      } else {
        // Vehicle exists - add to valid rows (will be processed and saved to notes/MI)
        validRows.push(row);
      }
    });

    if (missing.size > 0) {
      setMissingVehicles(missing);
      setValidatedRows(validRows);
      setReadyToProcess(false);
      // Show modal for first missing vehicle
      const firstReg = Array.from(missing.keys())[0];
      showVehicleAddModal(firstReg);
    } else {
      // All vehicles exist, ready to process
      setValidatedRows(rows);
      setReadyToProcess(true);
    }
  };

  const showVehicleAddModal = (registration: string) => {
    const vehicle = missingVehicles.get(registration);
    if (vehicle) {
      setCurrentVehicleReg(registration);
      setVehicleForm({
        make: vehicle.make || '',
        model: vehicle.model || '',
        mpg: vehicle.mpg.toString() || '35',
      });
      setShowVehicleModal(true);
    }
  };

  const handleAddVehicle = () => {
    if (!vehicleForm.make.trim() || !vehicleForm.model.trim()) {
      alert('Please enter make and model');
      return;
    }

    const mpg = parseFloat(vehicleForm.mpg) || getMPGByMakeModel(vehicleForm.make.trim(), vehicleForm.model.trim());
    
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      registration: currentVehicleReg,
      mpg,
    };

    addVehicle(newVehicle);

    // Update missing vehicles map
    const updated = new Map(missingVehicles);
    updated.delete(currentVehicleReg);
    setMissingVehicles(updated);

    // Add this row to validated rows
    const rows = parseInput(inputData);
    const row = rows.find(r => r.registration.toUpperCase() === currentVehicleReg);
    if (row) {
      setValidatedRows([...validatedRows, row]);
    }

    setShowVehicleModal(false);

    // If more missing vehicles, show next one
    if (updated.size > 0) {
      const nextReg = Array.from(updated.keys())[0];
      showVehicleAddModal(nextReg);
    } else {
      // All vehicles added, ready to process
      setReadyToProcess(true);
    }
  };

  const handleSkipVehicle = () => {
    // Remove from missing vehicles - this vehicle will NOT be added to validatedRows
    // and will NOT be processed or saved to notes/MI
    const updated = new Map(missingVehicles);
    updated.delete(currentVehicleReg);
    setMissingVehicles(updated);
    setShowVehicleModal(false);

    // If more missing vehicles, show next one
    if (updated.size > 0) {
      const nextReg = Array.from(updated.keys())[0];
      showVehicleAddModal(nextReg);
    } else {
      // All vehicles handled, ready to process
      // Note: Only rows with existing vehicles are in validatedRows
      // Skipped vehicles are excluded and will not be processed
      setReadyToProcess(true);
    }
  };

  const processBulkUpload = async () => {
    if (validatedRows.length === 0) {
      alert('No valid rows to process. Please validate first.');
      return;
    }

    setProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: validatedRows.length });

    const newResults: ProcessingResult[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validatedRows.length; i++) {
      const row = validatedRows[i];
      setProgress({ current: i + 1, total: validatedRows.length });

      try {
        if (!row || !row.registration || !row.from || !row.to) {
          newResults.push({
            success: false,
            row: i + 1,
            registration: (row?.registration || '').trim() || 'N/A',
            from: (row?.from || '').trim() || 'N/A',
            to: (row?.to || '').trim() || 'N/A',
            error: 'Missing required fields',
          });
          failCount++;
          continue;
        }

        // Find vehicle (must exist - skip if not found)
        const allVehicles = getVehicles();
        const registrationUpper = (row.registration || '').trim().toUpperCase();
        const vehicle = findVehicleByRegistration(allVehicles, registrationUpper);
        
        if (!vehicle) {
          // Vehicle not found - skip this row (don't add to notes/MI)
          newResults.push({
            success: false,
            row: i + 1,
            registration: registrationUpper,
            from: row.from || 'N/A',
            to: row.to || 'N/A',
            error: 'Vehicle not found in system - skipped',
          });
          failCount++;
          continue; // Skip this row - do NOT save to notes or MI
        }

        // Find or create stations
        const allStations = getStations();
        const cleanFromName = (row.from || '').replace(/\s*W\/S\s*/i, '').trim();
        if (!cleanFromName) {
          newResults.push({
            success: false,
            row: i + 1,
            registration: row.registration,
            from: row.from || 'N/A',
            to: row.to || 'N/A',
            error: 'Invalid "From" station name',
          });
          failCount++;
          continue;
        }

        let fromStation = findStationByNameFuzzy(allStations, row.from) || 
                         findStationByNameFuzzy(allStations, cleanFromName);
        
        if (!fromStation) {
          const baseName = cleanFromName.split(' - ')[0].trim();
          fromStation = findStationByNameFuzzy(allStations, baseName);
        }
        
        if (!fromStation) {
          const stationName = cleanFromName;
          let defaultPostcode = 'SW1A 1AA';
          const nameLower = stationName.toLowerCase();
          if (nameLower.includes('cambridge')) {
            defaultPostcode = 'CB2 0QQ';
          } else if (nameLower.includes('barton')) {
            defaultPostcode = 'IP28 6AA';
          }
          
          fromStation = {
            id: Date.now().toString() + i + 'from',
            name: stationName,
            postcode: defaultPostcode,
          };
          addStation(fromStation);
        }

        const cleanToName = (row.to || '').replace(/\s*W\/S\s*/i, '').trim();
        if (!cleanToName) {
          newResults.push({
            success: false,
            row: i + 1,
            registration: row.registration,
            from: row.from || 'N/A',
            to: row.to || 'N/A',
            error: 'Invalid "To" station name',
          });
          failCount++;
          continue;
        }

        let toStation = findStationByNameFuzzy(allStations, row.to) || 
                       findStationByNameFuzzy(allStations, cleanToName);
        
        if (!toStation) {
          const baseName = cleanToName.split(' - ')[0].trim();
          toStation = findStationByNameFuzzy(allStations, baseName);
        }
        
        if (!toStation) {
          const stationName = cleanToName;
          let defaultPostcode = 'SW1A 1AA';
          const nameLower = stationName.toLowerCase();
          if (nameLower.includes('cambridge')) {
            defaultPostcode = 'CB2 0QQ';
          } else if (nameLower.includes('barton')) {
            defaultPostcode = 'IP28 6AA';
          }
          
          toStation = {
            id: Date.now().toString() + i + 'to',
            name: stationName,
            postcode: defaultPostcode,
          };
          addStation(toStation);
        }

        // Geocode stations
        let fromCoords, toCoords;
        try {
          fromCoords = await geocodePostcode(fromStation.postcode);
        } catch {
          newResults.push({
            success: false,
            row: i + 1,
            registration: row.registration,
            from: row.from,
            to: row.to,
            error: `Failed to geocode postcode for ${fromStation.name}`,
          });
          failCount++;
          continue;
        }

        try {
          toCoords = await geocodePostcode(toStation.postcode);
        } catch {
          newResults.push({
            success: false,
            row: i + 1,
            registration: row.registration,
            from: row.from,
            to: row.to,
            error: `Failed to geocode postcode for ${toStation.name}`,
          });
          failCount++;
          continue;
        }

        // Calculate route
        const routeResult = await getRouteDistance(
          fromCoords.latitude,
          fromCoords.longitude,
          toCoords.latitude,
          toCoords.longitude
        );

        // Calculate fuel
        const fuelLitres = (routeResult.distance / vehicle.mpg) * 4.54609;

        // Save calculation
        const calculation = {
          id: Date.now().toString() + i,
          from: fromStation.name,
          to: toStation.name,
          distance: routeResult.distance,
          time: routeResult.duration,
          vehicle: {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            mpg: vehicle.mpg,
            registration: vehicle.registration,
          },
          fuel: Math.round(fuelLitres * 10) / 10,
          timestamp: Date.now(),
        };

        saveNote(calculation);
        successCount++;
        newResults.push({
          success: true,
          row: i + 1,
          registration: row.registration,
          from: row.from,
          to: row.to,
        });
      } catch (error: any) {
        failCount++;
        newResults.push({
          success: false,
          row: i + 1,
          registration: row.registration || 'N/A',
          from: row.from || 'N/A',
          to: row.to || 'N/A',
          error: error.message || 'Unknown error',
        });
      }

      if (i < validatedRows.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setResults(newResults);
    setProcessing(false);
    setReadyToProcess(false);
    alert(`Processing complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Bulk Upload</h1>

      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Paste your data in the format: <strong>Registration	From	To</strong>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Each line should contain: Registration (tab or spaces) From Station (tab or spaces) To Station
          <br />
          Example: <code>FL24LXU	Barton Mills W/S	Cambridge - Addenbrooks</code>
        </p>
      </div>

      <textarea
        value={inputData}
        onChange={(e) => {
          setInputData(e.target.value);
          setReadyToProcess(false);
          setValidatedRows([]);
          setMissingVehicles(new Map());
        }}
        className="w-full h-64 p-3 border border-gray-300 rounded font-mono text-sm"
        placeholder="FL24LXU	Barton Mills W/S	Cambridge - Addenbrooks&#10;DE25FHX	Colchester	Ipswich"
      />

      <div className="mt-4 flex gap-4 items-center">
        <button
          onClick={validateAndFindMissingVehicles}
          disabled={processing || !inputData.trim()}
          className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Validate & Check Vehicles
        </button>

        {readyToProcess && (
          <button
            onClick={processBulkUpload}
            disabled={processing}
            className="bg-orange-600 text-white py-2 px-6 rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Confirm & Process'}
          </button>
        )}

        {processing && (
          <div className="text-gray-600">
            Processing {progress.current} of {progress.total}...
          </div>
        )}
      </div>

      {missingVehicles.size > 0 && !showVehicleModal && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            <strong>{missingVehicles.size} vehicle(s) not found in system.</strong> Please add them using the prompts above.
          </p>
        </div>
      )}

      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Vehicle: {currentVehicleReg}</h2>
            <p className="text-gray-600 mb-4">
              This vehicle is not in the system. Please provide make and model to add it.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Make</label>
                <input
                  type="text"
                  value={vehicleForm.make}
                  onChange={(e) => {
                    const make = e.target.value;
                    setVehicleForm({
                      ...vehicleForm,
                      make,
                      mpg: getMPGByMakeModel(make, vehicleForm.model).toString(),
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., Fiat, MAN, Renault"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  type="text"
                  value={vehicleForm.model}
                  onChange={(e) => {
                    const model = e.target.value;
                    setVehicleForm({
                      ...vehicleForm,
                      model,
                      mpg: getMPGByMakeModel(vehicleForm.make, model).toString(),
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="e.g., Ducato, TGE, Master"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">MPG</label>
                <input
                  type="number"
                  value={vehicleForm.mpg}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, mpg: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  min="1"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-filled based on make/model, but you can adjust if needed
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleAddVehicle}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded hover:bg-orange-700"
              >
                Add Vehicle
              </button>
              <button
                onClick={handleSkipVehicle}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Results</h2>
          <div className="bg-white border rounded max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-100 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Row</th>
                  <th className="p-2 text-left">Registration</th>
                  <th className="p-2 text-left">From</th>
                  <th className="p-2 text-left">To</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="p-2">{result.row}</td>
                    <td className="p-2">{result.registration}</td>
                    <td className="p-2">{result.from}</td>
                    <td className="p-2">{result.to}</td>
                    <td className="p-2">
                      {result.success ? (
                        <span className="text-green-600 font-semibold">Success</span>
                      ) : (
                        <span className="text-red-600">
                          <span className="font-semibold">Failed:</span> {result.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
