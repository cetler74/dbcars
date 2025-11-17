'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminVehicles, deleteVehicle } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Tag,
  Euro,
  Package,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEdit = (vehicle: any) => {
    router.push(`/admin/vehicles/${vehicle.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await deleteVehicle(id);
      toast.success('Vehicle deleted successfully');
      loadVehicles();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting vehicle');
    }
  };

  // Helper function to get full image URL
  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchTerm || 
      `${vehicle.make} ${vehicle.model} ${vehicle.year}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || vehicle.category === categoryFilter;
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && vehicle.is_active) ||
      (statusFilter === 'inactive' && !vehicle.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories
  const categories = [...new Set(vehicles.map(v => v.category))].filter(Boolean);

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vehicles Management</h1>
          <p className="text-gray-600 text-lg">Manage your fleet of rental vehicles</p>
        </div>
        <button
          onClick={() => router.push('/admin/vehicles/new')}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Vehicles</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by make, model, year..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading vehicles..." />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={Car}
            title={vehicles.length === 0 ? "No vehicles found" : "No vehicles match your filters"}
            description={vehicles.length === 0 ? "Get started by adding your first vehicle to the fleet." : "Try adjusting your search or filter criteria."}
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50">
              <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Photo
                </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Vehicle
                </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Daily Price
                </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Availability
                </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredVehicles.map((vehicle) => {
                const firstImage = vehicle.images && vehicle.images.length > 0 
                  ? vehicle.images[0] 
                  : null;
                
                const imageUrl = getImageUrl(firstImage);

                return (
                  <tr 
                    key={vehicle.id}
                      className="cursor-pointer"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex-shrink-0 h-20 w-28 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${vehicle.make} ${vehicle.model}`}
                              className="h-full w-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="112" height="80"%3E%3Crect fill="%23e5e7eb" width="112" height="80"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-xs text-gray-500">
                              {vehicle.year}
                            </div>
                          </div>
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {vehicle.category || 'N/A'}
                          </span>
                        </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(Number(vehicle.base_price_daily || 0))}
                          </span>
                          <span className="text-xs text-gray-500">/day</span>
                        </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Package className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <div className="text-sm">
                            <span className="font-bold text-gray-900">{vehicle.available_count || 0}</span>
                            <span className="text-gray-500"> / </span>
                            <span className="text-gray-700">{vehicle.subunit_count || 0}</span>
                          </div>
                        </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold shadow-sm">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                    </span>
                        )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative" ref={(el) => (menuRefs.current[vehicle.id] = el)}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === vehicle.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                              <button
                                onClick={() => {
                                  handleEdit(vehicle);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(vehicle.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredVehicles.map((vehicle) => {
              const firstImage = vehicle.images && vehicle.images.length > 0 
                ? vehicle.images[0] 
                : null;
              
              const imageUrl = getImageUrl(firstImage);

              return (
                <div
                  key={vehicle.id}
                  className="p-4 cursor-pointer"
                  onClick={() => handleEdit(vehicle)}
                >
                  <div className="flex gap-4 mb-3">
                    <div className="flex-shrink-0 h-24 w-32 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="96"%3E%3Crect fill="%23e5e7eb" width="128" height="96"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-sm text-gray-500">{vehicle.year}</p>
                        </div>
                        {vehicle.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600 capitalize">{vehicle.category || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-bold text-gray-900">{formatCurrency(Number(vehicle.base_price_daily || 0))}</span>
                          <span className="text-gray-500 text-xs">/day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600">
                            <span className="font-bold text-gray-900">{vehicle.available_count || 0}</span>
                            <span className="text-gray-500"> / </span>
                            <span>{vehicle.subunit_count || 0}</span> available
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative" ref={(el) => (menuRefs.current[`mobile-${vehicle.id}`] = el)}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === `mobile-${vehicle.id}` ? null : `mobile-${vehicle.id}`)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === `mobile-${vehicle.id}` && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                          <button
                            onClick={() => {
                              handleEdit(vehicle);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(vehicle.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
          </div>

          {/* Summary Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700 font-medium">
              Showing <span className="font-bold">{filteredVehicles.length}</span> of{' '}
              <span className="font-bold">{vehicles.length}</span> vehicle{vehicles.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
