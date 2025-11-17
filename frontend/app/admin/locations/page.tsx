'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getAdminLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,
} from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  MapPin, 
  Plus, 
  MoreVertical,
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  Calendar,
  Phone,
  Mail,
  Building2,
  Map,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Navigation
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: 'Morocco',
    phone: '',
    email: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_active: true,
  });

  useEffect(() => {
    loadLocations();
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

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await getAdminLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      };

      if (editingLocation) {
        await updateLocation(editingLocation.id, submitData);
        toast.success('Location updated successfully!');
      } else {
        await createLocation(submitData);
        toast.success('Location created successfully!');
      }
      setShowForm(false);
      setEditingLocation(null);
      resetForm();
      loadLocations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving location');
    }
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      country: location.country || 'Morocco',
      phone: location.phone || '',
      email: location.email || '',
      latitude: location.latitude,
      longitude: location.longitude,
      is_active: location.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await deleteLocation(id);
      toast.success('Location deleted successfully');
      loadLocations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting location');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleLocationStatus(id);
      toast.success('Location status updated successfully');
      loadLocations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error toggling location status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      country: 'Morocco',
      phone: '',
      email: '',
      latitude: null,
      longitude: null,
      is_active: true,
    });
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingLocation(null);
    resetForm();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Locations Management</h1>
          <p className="text-gray-600 text-lg">Manage pickup and drop-off locations for rentals</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingLocation(null);
            resetForm();
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading locations..." />
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={MapPin}
            title="No locations found"
            description="Get started by creating your first pickup or drop-off location."
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{location.name}</div>
                          {location.email && (
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {location.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.city}</div>
                          <div className="text-xs text-gray-500">{location.country}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div className="text-sm text-gray-700 max-w-xs">
                          {truncateText(location.address, 60)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {location.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{location.phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {location.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(location.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative" ref={(el) => (menuRefs.current[location.id] = el)}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === location.id ? null : location.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === location.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                            <button
                              onClick={() => {
                                handleEdit(location);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleToggleStatus(location.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              {location.is_active ? (
                                <>
                                  <PowerOff className="w-4 h-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="w-4 h-4" />
                                  Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(location.id);
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {locations.map((location) => (
              <div key={location.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{location.name}</h3>
                      {location.email && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {location.email}
                        </p>
                      )}
                    </div>
                  </div>
                  {location.is_active ? (
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
                
                <div className="space-y-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600">
                      <span className="font-medium">{location.city}</span>
                      {location.country && <span className="text-gray-500">, {location.country}</span>}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{location.address}</span>
                  </div>
                  {location.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">{location.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-600">{formatDate(location.created_at)}</span>
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <div className="relative" ref={(el) => (menuRefs.current[`mobile-${location.id}`] = el)}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === `mobile-${location.id}` ? null : `mobile-${location.id}`)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === `mobile-${location.id}` && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                        <button
                          onClick={() => {
                            handleEdit(location);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleToggleStatus(location.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          {location.is_active ? (
                            <>
                              <PowerOff className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(location.id);
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
            ))}
          </div>
        </div>
      )}

      {/* Location Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="flex min-h-full items-center justify-center">
            <div
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h2>
                <button 
                  onClick={closeModal} 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                      placeholder="Airport Office"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                      rows={3}
                      required
                      placeholder="123 Main Street, Building A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        required
                        placeholder="Marrakech"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="Morocco"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="+212 123 456 789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="location@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Latitude <span className="text-xs text-gray-500 font-normal">(Optional - for future map integration)</span>
                    </label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            latitude: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="31.6295"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Longitude <span className="text-xs text-gray-500 font-normal">(Optional - for future map integration)</span>
                    </label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            longitude: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="-7.9811"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {editingLocation ? 'Update' : 'Create'} Location
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
