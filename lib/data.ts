import { Station, Vehicle, Calculation } from '@/types';
import { defaultStations } from '@/lib/stations';
import { defaultVehicles } from '@/lib/vehicles';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ProfileRole = 'superuser' | 'admin' | 'manager' | 'general' | 'user';

export async function getProfileRole(
  supabase: SupabaseClient
): Promise<ProfileRole> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'general';
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = (data?.role as ProfileRole) || 'general';
  return role === 'user' ? 'general' : role;
}

export type ProfileRow = { id: string; username: string | null; email: string | null; role: string };

/** List all profiles (id, username, email, role). Superuser and admin can see all; others get empty. */
export async function fetchProfilesForSuperuser(
  supabase: SupabaseClient
): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email, role')
    .order('username', { ascending: true, nullsFirst: false });
  if (error) return [];
  return (data || []) as ProfileRow[];
}

/** Assignable roles only (superuser cannot be set from UI). */
export type AssignableRole = 'general' | 'admin' | 'manager';

export async function updateProfileRole(
  supabase: SupabaseClient,
  userId: string,
  role: AssignableRole
): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

export async function fetchStations(supabase: SupabaseClient): Promise<Station[]> {
  const { data, error } = await supabase.from('stations').select('id, name, postcode');
  if (error) throw error;
  const fetched = (data || []) as Station[];
  const byId = new Map<string, Station>(defaultStations.map((s) => [s.id, { ...s }]));
  fetched.forEach((s) => byId.set(s.id, s));
  return Array.from(byId.values());
}

export async function fetchVehicles(supabase: SupabaseClient): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, make, model, mpg, registration');
  if (error) throw error;
  const fetched = (data || []) as Vehicle[];
  const byId = new Map<string, Vehicle>(defaultVehicles.map((v) => [v.id, { ...v }]));
  fetched.forEach((v) => byId.set(v.id, v));
  return Array.from(byId.values());
}

export async function fetchNotes(
  supabase: SupabaseClient,
  userId: string
): Promise<Calculation[]> {
  const { data, error } = await supabase
    .from('calculations')
    .select('id, from_name, to_name, distance, time_minutes, vehicle, fuel, timestamp_ms')
    .eq('user_id', userId)
    .order('timestamp_ms', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    from: row.from_name,
    to: row.to_name,
    distance: Number(row.distance),
    time: Number(row.time_minutes),
    vehicle: row.vehicle as Calculation['vehicle'],
    fuel: Number(row.fuel),
    timestamp: Number(row.timestamp_ms),
  }));
}

export async function saveNoteSupabase(
  supabase: SupabaseClient,
  userId: string,
  calculation: Calculation
): Promise<void> {
  const { error } = await supabase.from('calculations').insert({
    id: calculation.id,
    user_id: userId,
    from_name: calculation.from,
    to_name: calculation.to,
    distance: calculation.distance,
    time_minutes: calculation.time,
    vehicle: calculation.vehicle,
    fuel: calculation.fuel,
    timestamp_ms: calculation.timestamp,
  });
  if (error) throw error;
}

export async function deleteNoteSupabase(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('calculations').delete().eq('id', id);
  if (error) throw error;
}

export async function clearAllNotesSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('calculations').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function addStationSupabase(
  supabase: SupabaseClient,
  station: Station
): Promise<void> {
  const { error } = await supabase.from('stations').insert({
    id: station.id,
    name: station.name,
    postcode: station.postcode,
  });
  if (error) throw error;
}

export async function updateStationSupabase(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<Station, 'name' | 'postcode'>>
): Promise<void> {
  const { error } = await supabase.from('stations').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteStationSupabase(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('stations').delete().eq('id', id);
  if (error) throw error;
}

export async function addVehicleSupabase(
  supabase: SupabaseClient,
  vehicle: Vehicle
): Promise<void> {
  const { error } = await supabase.from('vehicles').insert({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    mpg: vehicle.mpg,
    registration: vehicle.registration,
  });
  if (error) throw error;
}

export async function updateVehicleSupabase(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Omit<Vehicle, 'id'>>
): Promise<void> {
  const { error } = await supabase.from('vehicles').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteVehicleSupabase(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}
