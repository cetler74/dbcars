import { useState, useEffect, useCallback } from 'react';
import { getAvailability, getAdminVehicles, getVehicleSubunits } from '@/lib/api';
import toast from 'react-hot-toast';

interface AvailabilityFilters {
  vehicle_id?: string;
  month?: number;
  year?: number;
  status?: string[];
  locationId?: string;
  searchQuery?: string;
}

export function useAvailability(filters: AvailabilityFilters) {
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [subunits, setSubunits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await getAdminVehicles();
      setVehicles(data);
    } catch (err: any) {
      console.error('Error loading vehicles:', err);
      toast.error('Error loading vehicles');
      setError('Failed to load vehicles');
    }
  }, []);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters: any = {
        month: filters.month || new Date().getMonth() + 1,
        year: filters.year || new Date().getFullYear(),
      };
      if (filters.vehicle_id) {
        apiFilters.vehicle_id = filters.vehicle_id;
      }
      const data = await getAvailability(apiFilters);
      setAvailabilityData(data);
    } catch (err: any) {
      console.error('Error loading availability:', err);
      toast.error('Error loading availability data');
      setError('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.year, filters.vehicle_id]);

  const loadSubunits = useCallback(async (vehicleId: string) => {
    if (!vehicleId) {
      setSubunits([]);
      return;
    }
    try {
      const data = await getVehicleSubunits(vehicleId);
      setSubunits(data);
    } catch (err: any) {
      console.error('Error loading subunits:', err);
      toast.error('Error loading vehicle units');
      setError('Failed to load subunits');
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    if (filters.vehicle_id) {
      loadSubunits(filters.vehicle_id);
    } else {
      setSubunits([]);
    }
  }, [filters.vehicle_id, loadSubunits]);

  const refresh = useCallback(() => {
    loadAvailability();
    if (filters.vehicle_id) {
      loadSubunits(filters.vehicle_id);
    }
  }, [loadAvailability, loadSubunits, filters.vehicle_id]);

  return {
    availabilityData,
    vehicles,
    subunits,
    loading,
    error,
    refresh,
    loadVehicles,
    loadAvailability,
    loadSubunits,
  };
}
