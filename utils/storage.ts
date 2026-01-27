import { Station, Vehicle, Calculation } from '@/types';
import { defaultStations } from '@/lib/stations';
import { defaultVehicles } from '@/lib/vehicles';

const STATIONS_KEY = 'ambulance_stations';
const VEHICLES_KEY = 'ambulance_vehicles';
const NOTES_KEY = 'ambulance_notes';

// Stations
export function getStations(): Station[] {
  if (typeof window === 'undefined') return defaultStations;
  
  const stored = localStorage.getItem(STATIONS_KEY);
  if (!stored) {
    saveStations(defaultStations);
    return defaultStations;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultStations;
  }
}

export function saveStations(stations: Station[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STATIONS_KEY, JSON.stringify(stations));
}

export function addStation(station: Station): void {
  const stations = getStations();
  stations.push(station);
  saveStations(stations);
}

export function updateStation(id: string, updates: Partial<Station>): void {
  const stations = getStations();
  const index = stations.findIndex(s => s.id === id);
  if (index !== -1) {
    stations[index] = { ...stations[index], ...updates };
    saveStations(stations);
  }
}

export function deleteStation(id: string): void {
  const stations = getStations().filter(s => s.id !== id);
  saveStations(stations);
}

// Vehicles
export function getVehicles(): Vehicle[] {
  if (typeof window === 'undefined') return defaultVehicles;
  
  const stored = localStorage.getItem(VEHICLES_KEY);
  if (!stored) {
    saveVehicles(defaultVehicles);
    return defaultVehicles;
  }
  try {
    const parsed = JSON.parse(stored);
    // Always check if stored vehicles match the current default count and structure
    // If count doesn't match or structure is invalid, reset to defaults
    if (parsed.length !== defaultVehicles.length) {
      saveVehicles(defaultVehicles);
      return defaultVehicles;
    }
    // If stored vehicles are the old default 3 vehicles, replace with new defaults
    if (parsed.length <= 3 && parsed.every((v: Vehicle) => v.make === 'Vehicle')) {
      saveVehicles(defaultVehicles);
      return defaultVehicles;
    }
    // Check if any vehicles are missing make or model - if so, reset to defaults
    const hasInvalidVehicles = parsed.some((v: Vehicle) => !v.make || !v.model || v.make.trim() === '' || v.model.trim() === '');
    if (hasInvalidVehicles) {
      saveVehicles(defaultVehicles);
      return defaultVehicles;
    }
    // Check if LB20KHW exists in stored vehicles - if not, reset to defaults
    const hasLB20KHW = parsed.some((v: Vehicle) => v.registration === 'LB20KHW');
    if (!hasLB20KHW) {
      saveVehicles(defaultVehicles);
      return defaultVehicles;
    }
    return parsed;
  } catch {
    return defaultVehicles;
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

export function addVehicle(vehicle: Vehicle): void {
  const vehicles = getVehicles();
  vehicles.push(vehicle);
  saveVehicles(vehicles);
}

export function updateVehicle(id: string, updates: Partial<Vehicle>): void {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === id);
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...updates };
    saveVehicles(vehicles);
  }
}

export function deleteVehicle(id: string): void {
  const vehicles = getVehicles().filter(v => v.id !== id);
  saveVehicles(vehicles);
}

// Notes/Calculations
export function getNotes(): Calculation[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(NOTES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveNote(calculation: Calculation): void {
  if (typeof window === 'undefined') return;
  const notes = getNotes();
  notes.push(calculation);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function deleteNote(id: string): void {
  if (typeof window === 'undefined') return;
  const notes = getNotes().filter(n => n.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function clearAllNotes(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTES_KEY, JSON.stringify([]));
}
