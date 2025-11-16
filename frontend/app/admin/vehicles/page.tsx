'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAdminVehicles, createVehicle, updateVehicle, deleteVehicle, uploadImage, getExtras, getLocations, getVehicleSubunits } from '@/lib/api';
import Link from 'next/link';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [extras, setExtras] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'luxury',
    description: '',
    seats: 4,
    transmission: 'automatic',
    fuel_type: 'gasoline',
    color: '',
    features: [] as string[],
    images: [] as string[],
    available_extras: [] as string[],
    base_price_daily: 0,
    base_price_weekly: 0,
    base_price_monthly: 0,
    base_price_hourly: 0,
    minimum_rental_days: 1,
    minimum_age: 25,
    is_active: true,
    // Vehicle subunit fields
    license_plate: '',
    vin: '',
    location_id: '',
    mileage: 0,
  });

  useEffect(() => {
    loadVehicles();
    loadExtras();
    loadLocations();
  }, []);

  const loadExtras = async () => {
    try {
      const data = await getExtras();
      setExtras(data);
    } catch (error) {
      console.error('Error loading extras:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate vehicle unit information when creating a new vehicle
    if (!editingVehicle) {
      if (!formData.license_plate || formData.license_plate.trim() === '') {
        alert('License plate is required to create a vehicle. Please add vehicle unit information.');
        return;
      }
    }
    
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

  const handleEdit = async (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      description: vehicle.description || '',
      seats: vehicle.seats,
      transmission: vehicle.transmission || 'automatic',
      fuel_type: vehicle.fuel_type || 'gasoline',
      color: vehicle.color || '',
      features: vehicle.features || [],
      images: vehicle.images || [],
      available_extras: vehicle.available_extras || [],
      base_price_daily: vehicle.base_price_daily,
      base_price_weekly: vehicle.base_price_weekly || 0,
      base_price_monthly: vehicle.base_price_monthly || 0,
      base_price_hourly: vehicle.base_price_hourly || 0,
      minimum_rental_days: vehicle.minimum_rental_days,
      minimum_age: vehicle.minimum_age,
      is_active: vehicle.is_active,
      license_plate: '',
      vin: '',
      location_id: '',
      mileage: 0,
    });
    
    // Load vehicle subunits to get the first unit's info
    try {
      const subunits = await getVehicleSubunits(vehicle.id);
      if (subunits && subunits.length > 0) {
        const firstSubunit = subunits[0];
        setFormData((prev) => ({
          ...prev,
          license_plate: firstSubunit.license_plate || '',
          vin: firstSubunit.vin || '',
          location_id: firstSubunit.current_location_id || '',
          mileage: firstSubunit.mileage || 0,
        }));
      }
    } catch (error) {
      console.error('Error loading vehicle subunits:', error);
    }
    
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
      color: '',
      features: [],
      images: [],
      available_extras: [],
      base_price_daily: 0,
      base_price_weekly: 0,
      base_price_monthly: 0,
      base_price_hourly: 0,
      minimum_rental_days: 1,
      minimum_age: 25,
      is_active: true,
      license_plate: '',
      vin: '',
      location_id: '',
      mileage: 0,
    });
  };

  const handleExtraToggle = (extraId: string) => {
    setFormData((prev) => {
      const currentExtras = prev.available_extras || [];
      if (currentExtras.includes(extraId)) {
        return {
          ...prev,
          available_extras: currentExtras.filter((id) => id !== extraId),
        };
      } else {
        return {
          ...prev,
          available_extras: [...currentExtras, extraId],
        };
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Upload files one by one
      const uploadPromises = Array.from(files).map((file) => uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      // Add uploaded URLs to images array (avoid duplicates)
      const newImages = uploadedUrls.filter((url) => !formData.images.includes(url));
      setFormData({
        ...formData,
        images: [...formData.images, ...newImages],
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      // Extract error message from the error object
      const errorMessage = error?.message || error?.response?.data?.error || 'Error uploading image(s)';
      alert(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const setCoverPhoto = (index: number) => {
    if (index === 0) return; // Already the cover
    const newImages = [...formData.images];
    const [coverImage] = newImages.splice(index, 1);
    newImages.unshift(coverImage); // Move to first position
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return; // Can't move up from first
    if (direction === 'down' && index === formData.images.length - 1) return; // Can't move down from last
    
    const newImages = [...formData.images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  // Helper function to get full image URL
  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative URL, prepend the backend URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingVehicle(null);
    resetForm();
  };

  // Close modal on Escape key and prevent body scroll
  useEffect(() => {
    if (!showForm) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowForm(false);
        setEditingVehicle(null);
        resetForm();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

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

      {/* Vehicle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          ></div>

          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transmission *</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type *</label>
                <select
                  value={formData.fuel_type}
                  onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., Black, White, Red"
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

            {/* Available Extras Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Extras</label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                {extras.length === 0 ? (
                  <p className="text-sm text-gray-500">No extras available. Add extras first.</p>
                ) : (
                  <div className="space-y-2">
                    {extras.map((extra) => (
                      <label
                        key={extra.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.available_extras?.includes(extra.id) || false}
                          onChange={() => handleExtraToggle(extra.id)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-700">
                          {extra.name} - €{Number(extra.price).toFixed(2)} ({extra.price_type})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {formData.available_extras && formData.available_extras.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {formData.available_extras.length} extra{formData.available_extras.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Vehicle Unit Information */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold mb-2">
                Vehicle Unit Information
                {!editingVehicle && <span className="text-red-500 ml-1">* Required</span>}
              </h3>
              {!editingVehicle && (
                <p className="text-sm text-gray-600 mb-4">
                  A vehicle unit is required to make this vehicle available for booking. Please provide at least the license plate.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate {!editingVehicle && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required={!editingVehicle}
                    placeholder="e.g., ABC-123"
                    disabled={editingVehicle !== null}
                  />
                  {editingVehicle && (
                    <p className="text-xs text-gray-500 mt-1">
                      License plate cannot be changed after creation
                    </p>
                  )}
                  {!editingVehicle && (
                    <p className="text-xs text-gray-500 mt-1">
                      Required to create the first vehicle unit
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">VIN</label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Vehicle Identification Number"
                    disabled={editingVehicle !== null}
                  />
                  {editingVehicle && (
                    <p className="text-xs text-gray-500 mt-1">VIN cannot be changed after creation</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) =>
                      setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
              <div className="space-y-3">
                <div>
                  <label className="block mb-2">
                    <span className="sr-only">Upload images</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Select one or more images (JPEG, PNG, GIF, WebP). Max 5MB per image.
                  </p>
                  {uploading && (
                    <p className="text-sm text-blue-600 mt-2">Uploading images...</p>
                  )}
                </div>
                
                {formData.images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} added
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium mr-2">
                          Cover
                        </span>
                        First image is the cover photo
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.images.map((imageUrl, index) => {
                        const isCover = index === 0;
                        return (
                          <div
                            key={index}
                            className={`relative border-2 rounded-lg overflow-hidden ${
                              isCover ? 'border-blue-500 shadow-md' : 'border-gray-200'
                            }`}
                          >
                            {/* Cover Photo Badge */}
                            {isCover && (
                              <div className="absolute top-2 left-2 z-10">
                                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500 text-white text-xs font-semibold shadow-lg">
                                  Cover Photo
                                </span>
                              </div>
                            )}

                            <img
                              src={imageUrl}
                              alt={`Vehicle image ${index + 1}`}
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                              }}
                            />

                            {/* Action Buttons Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center group">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => setCoverPhoto(index)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                                    title="Set as cover photo"
                                  >
                                    Set Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-600 transition-colors"
                                  title="Remove image"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* Image Info and Controls */}
                            <div className="p-2 bg-white">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-gray-500 truncate flex-1" title={imageUrl}>
                                  {imageUrl.length > 25 ? `${imageUrl.substring(0, 25)}...` : imageUrl}
                                </p>
                                <span className="text-xs text-gray-400 ml-2">
                                  #{index + 1}
                                </span>
                              </div>
                              
                              {/* Move Buttons */}
                              <div className="flex gap-1 mt-1">
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, 'up')}
                                  disabled={index === 0}
                                  className={`flex-1 px-2 py-1 text-xs rounded ${
                                    index === 0
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  title="Move up"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveImage(index, 'down')}
                                  disabled={index === formData.images.length - 1}
                                  className={`flex-1 px-2 py-1 text-xs rounded ${
                                    index === formData.images.length - 1
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  title="Move down"
                                >
                                  ↓
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {editingVehicle ? 'Update' : 'Create'} Vehicle
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
                  Photo
                </th>
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
              {vehicles.map((vehicle) => {
                // Get the first image or use placeholder
                const firstImage = vehicle.images && vehicle.images.length > 0 
                  ? vehicle.images[0] 
                  : null;
                
                const imageUrl = getImageUrl(firstImage);

                return (
                  <tr 
                    key={vehicle.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex-shrink-0 h-16 w-24">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="h-16 w-24 object-cover rounded border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="64"%3E%3Crect fill="%23e5e7eb" width="96" height="64"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="10" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="h-16 w-24 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                    </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
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
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

