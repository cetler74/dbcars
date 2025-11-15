'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  getAdminExtras,
  createExtra,
  updateExtra,
  deleteExtra,
  uploadImage,
} from '@/lib/api';
import Image from 'next/image';

export default function AdminExtrasPage() {
  const [extras, setExtras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExtra, setEditingExtra] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    price_type: 'per_rental' as 'per_rental' | 'per_day' | 'per_week',
    is_active: true,
    cover_image: '',
  });
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [coverImageKey, setCoverImageKey] = useState(0);

  useEffect(() => {
    loadExtras();
  }, []);

  const loadExtras = async () => {
    setLoading(true);
    try {
      const data = await getAdminExtras();
      setExtras(data);
    } catch (error) {
      console.error('Error loading extras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExtra) {
        await updateExtra(editingExtra.id, formData);
      } else {
        await createExtra(formData);
      }
      setShowForm(false);
      setEditingExtra(null);
      resetForm();
      loadExtras();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving extra');
    }
  };

  const handleEdit = (extra: any) => {
    setEditingExtra(extra);
    setFormData({
      name: extra.name,
      description: extra.description || '',
      price: extra.price,
      price_type: extra.price_type,
      is_active: extra.is_active,
      cover_image: extra.cover_image || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this extra?')) return;
    try {
      await deleteExtra(id);
      loadExtras();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting extra');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      price_type: 'per_rental',
      is_active: true,
      cover_image: '',
    });
    setCoverImageKey((prev) => prev + 1);
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCoverImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, cover_image: imageUrl }));
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Error uploading cover image');
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingExtra(null);
    resetForm();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Extras Management</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingExtra(null);
            resetForm();
          }}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
        >
          Add Extra
        </button>
      </div>

      {/* Extra Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-semibold">
                  {editingExtra ? 'Edit Extra' : 'Add New Extra'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Photo <span className="text-gray-500 text-xs">(Displayed on booking page)</span>
                  </label>
                  <div className="flex gap-4">
                    <input
                      key={coverImageKey}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      disabled={uploadingCoverImage}
                    />
                    {uploadingCoverImage && (
                      <span className="text-sm text-gray-500 self-center">Uploading...</span>
                    )}
                  </div>
                  {formData.cover_image && (
                    <div className="mt-2">
                      <Image
                        src={getImageUrl(formData.cover_image) || ''}
                        alt="Cover"
                        width={200}
                        height={150}
                        className="max-w-xs h-32 object-cover rounded-lg"
                        unoptimized
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Type *
                    </label>
                    <select
                      value={formData.price_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_type: e.target.value as 'per_rental' | 'per_day' | 'per_week',
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="per_rental">Per Rental</option>
                      <option value="per_day">Per Day</option>
                      <option value="per_week">Per Week</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {editingExtra ? 'Update' : 'Create'} Extra
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Extras List */}
      {loading ? (
        <p>Loading extras...</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cover Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {extras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No extras found. Click "Add Extra" to create one.
                  </td>
                </tr>
              ) : (
                extras.map((extra) => (
                  <tr key={extra.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {extra.cover_image ? (
                        <Image
                          src={getImageUrl(extra.cover_image) || ''}
                          alt={extra.name}
                          width={80}
                          height={60}
                          className="w-20 h-15 object-cover rounded"
                          unoptimized
                        />
                      ) : (
                        <div className="w-20 h-15 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{extra.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {extra.description || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      €{Number(extra.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {extra.price_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          extra.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {extra.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(extra.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(extra)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(extra.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

