'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAvailability, getAdminVehicles } from '@/lib/api';

export default function AdminAvailabilityPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [availability, setAvailability] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      loadAvailability();
    }
  }, [selectedVehicle, month, year]);

  const loadVehicles = async () => {
    try {
      const data = await getAdminVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const data = await getAvailability({
        vehicle_id: selectedVehicle,
        month,
        year,
      });
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Availability Overview</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(year, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {selectedVehicle && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bookings for Selected Period</h2>
          {availability.length === 0 ? (
            <p className="text-gray-600">No bookings found for this period</p>
          ) : (
            <div className="space-y-2">
              {availability.map((item, index) => (
                <div key={index} className="border-b pb-2">
                  <p className="font-medium">
                    {new Date(item.pickup_date).toLocaleDateString()} -{' '}
                    {new Date(item.dropoff_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">Status: {item.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

