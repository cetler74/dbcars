'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAdminVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/lib/api';
import Link from 'next/link';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'luxury',
    description: '',
    seats: 4,
    transmission: 'automatic',
    fuel_type: 'gasoline',
    features: [] as string[],
    images: [] as string[],
    base_price_daily: 0,
    base_price_weekly: 0,
    base_price_monthly: 0,
    base_price_hourly: 0,
    minimum_rental_days: 1,
    minimum_age: 25,
    is_active: true,
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await getAdminVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, formData);
      } else {
        await createVehicle(formData);
      }
      setShowForm(false);
      setEditingVehicle(null);
      resetForm();
      loadVehicles();
    } catch (error) {
      alert('Error saving vehicle');
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      description: vehicle.description || '',
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      fuel_type: vehicle.fuel_type,
      features: vehicle.features || [],
      images: vehicle.images || [],
      base_price_daily: vehicle.base_price_daily,
      base_price_weekly: vehicle.base_price_weekly || 0,
      base_price_monthly: vehicle.base_price_monthly || 0,
      base_price_hourly: vehicle.base_price_hourly || 0,
      minimum_rental_days: vehicle.minimum_rental_days,
      minimum_age: vehicle.minimum_age,
      is_active: vehicle.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await deleteVehicle(id);
      loadVehicles();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting vehicle');
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'luxury',
      description: '',
      seats: 4,
      transmission: 'automatic',
      fuel_type: 'gasoline',
      features: [],
      images: [],
      base_price_daily: 0,
      base_price_weekly: 0,
      base_price_monthly: 0,
      base_price_hourly: 0,
      minimum_rental_days: 1,
      minimum_age: 25,
      is_active: true,
    });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Vehicles Management</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingVehicle(null);
            resetForm();
          }}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
        >
          Add Vehicle
        </button>
      </div>

      {/* Vehicle Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="luxury">Luxury</option>
                  <option value="super_luxury">Super Luxury</option>
                  <option value="exotic">Exotic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Price (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.base_price_daily}
                  onChange={(e) =>
                    setFormData({ ...formData, base_price_daily: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seats</label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                {editingVehicle ? 'Update' : 'Create'} Vehicle
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
                className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles List */}
      {loading ? (
        <p>Loading vehicles...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Daily Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subunits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                    {vehicle.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    €{Number(vehicle.base_price_daily || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {vehicle.available_count || 0} / {vehicle.subunit_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        vehicle.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

