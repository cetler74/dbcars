'use client';

import { useEffect, useState, useRef } from 'react';
import DatePicker from '@/components/LazyDatePicker';
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Ticket, 
  Plus, 
  MoreVertical,
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  Calendar,
  Percent,
  Euro,
  Tag,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    minimum_rental_days: null as number | null,
    minimum_amount: null as number | null,
    valid_from: null as Date | null,
    valid_until: null as Date | null,
    usage_limit: null as number | null,
    is_active: true,
  });

  useEffect(() => {
    loadCoupons();
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

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await getAdminCoupons();
      setCoupons(data);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate dates
      if (!formData.valid_from || !formData.valid_until) {
        toast.error('Please select both valid from and valid until dates');
        return;
      }

      if (formData.valid_from >= formData.valid_until) {
        toast.error('Valid from date must be before valid until date');
        return;
      }

      const submitData = {
        ...formData,
        code: formData.code.toUpperCase().replace(/\s+/g, ''),
        minimum_rental_days: formData.minimum_rental_days || null,
        minimum_amount: formData.minimum_amount || null,
        usage_limit: formData.usage_limit || null,
        valid_from: formData.valid_from.toISOString().split('T')[0],
        valid_until: formData.valid_until.toISOString().split('T')[0],
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, submitData);
        toast.success('Coupon updated successfully!');
      } else {
        await createCoupon(submitData);
        toast.success('Coupon created successfully!');
      }
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving coupon');
    }
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_rental_days: coupon.minimum_rental_days,
      minimum_amount: coupon.minimum_amount,
      valid_from: coupon.valid_from ? new Date(coupon.valid_from) : null,
      valid_until: coupon.valid_until ? new Date(coupon.valid_until) : null,
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, usageCount: number) => {
    if (usageCount > 0) {
      toast.error(`Cannot delete coupon that has been used ${usageCount} time(s). Deactivate it instead.`);
      return;
    }
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      toast.success('Coupon deleted successfully');
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting coupon');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleCouponStatus(id);
      toast.success('Coupon status updated successfully');
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error toggling coupon status');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_rental_days: null,
      minimum_amount: null,
      valid_from: null,
      valid_until: null,
      usage_limit: null,
      is_active: true,
    });
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingCoupon(null);
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

  const formatDiscount = (type: string, value: number) => {
    return type === 'percentage' ? `${value}%` : formatCurrency(value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getValidationPreview = () => {
    const { discount_type, discount_value, minimum_amount, minimum_rental_days } = formData;
    const parts: string[] = [];

    if (discount_type === 'percentage') {
      parts.push(`${discount_value}% off`);
    } else {
      parts.push(`${formatCurrency(discount_value)} off`);
    }

    if (minimum_amount && minimum_amount > 0) {
      parts.push(`orders over ${formatCurrency(minimum_amount)}`);
    }

    if (minimum_rental_days && minimum_rental_days > 0) {
      parts.push(`for ${minimum_rental_days}+ day rentals`);
    }

    return parts.length > 1 ? parts.join(' ') : parts[0] || 'No conditions';
  };

  const getCouponStatus = (coupon: any) => {
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (now > validUntil) return 'expired';
    if (!coupon.is_active) return 'inactive';
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return 'exhausted';
    return 'active';
  };

  const getUsageDisplay = (usageCount: number, usageLimit: number | null) => {
    if (usageLimit) {
      const percentage = (usageCount / usageLimit) * 100;
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">{usageCount}/{usageLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentage >= 100 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                percentage >= 75 ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                'bg-gradient-to-r from-emerald-500 to-green-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">{usageCount} <span className="text-gray-500">(unlimited)</span></span>
      </div>
    );
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Coupons Management</h1>
          <p className="text-gray-600 text-lg">Create and manage discount coupons for customers</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCoupon(null);
            resetForm();
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading coupons..." />
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={Ticket}
            title="No coupons found"
            description="Get started by creating your first discount coupon for customers."
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Valid Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Usage
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
                {coupons.map((coupon) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <tr key={coupon.id} className={`hover:bg-gray-50 transition-colors ${status === 'expired' ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-orange-100 rounded-lg">
                            <Ticket className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold font-mono text-gray-900">{coupon.code}</div>
                            {coupon.description && (
                              <div className="text-xs text-gray-500 mt-0.5">{coupon.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <Percent className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Euro className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm font-bold text-gray-900">
                            {formatDiscount(coupon.discount_type, coupon.discount_value)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                            coupon.discount_type === 'percentage'
                              ? 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700 border-blue-200'
                              : 'bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-700 border-purple-200'
                          }`}
                        >
                          <Tag className="w-3.5 h-3.5" />
                          {coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">{formatDate(coupon.valid_from)}</span>
                            <span className="mx-2 text-gray-400">→</span>
                            <span className="font-medium">{formatDate(coupon.valid_until)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getUsageDisplay(coupon.usage_count || 0, coupon.usage_limit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : status === 'inactive' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-red-50 to-rose-50 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-gray-50 to-slate-50 text-gray-700 border border-gray-200 rounded-full text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative" ref={(el) => (menuRefs.current[coupon.id] = el)}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === coupon.id ? null : coupon.id)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === coupon.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                              <button
                                onClick={() => {
                                  handleEdit(coupon);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleStatus(coupon.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                {coupon.is_active ? (
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
                                  handleDelete(coupon.id, coupon.usage_count || 0);
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
            {coupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              return (
                <div key={coupon.id} className={`p-4 ${status === 'expired' ? 'bg-gray-50/50' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-orange-600" />
                      <div>
                        <h3 className="font-bold font-mono text-gray-900 text-lg">{coupon.code}</h3>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{coupon.description}</p>
                        )}
                      </div>
                    </div>
                    {status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : status === 'inactive' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-semibold">
                        <Clock className="w-3 h-3" />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      {coupon.discount_type === 'percentage' ? (
                        <Percent className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <Euro className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="font-bold text-gray-900">{formatDiscount(coupon.discount_type, coupon.discount_value)}</span>
                      <Tag className="w-3.5 h-3.5 text-gray-400 ml-2" />
                      <span className="text-gray-600 capitalize">{coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">
                        <span className="font-medium">{formatDate(coupon.valid_from)}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{formatDate(coupon.valid_until)}</span>
                      </span>
                    </div>
                    <div>
                      {getUsageDisplay(coupon.usage_count || 0, coupon.usage_limit)}
                    </div>
                  </div>

                  <div className="flex justify-end mt-3">
                    <div className="relative" ref={(el) => (menuRefs.current[`mobile-${coupon.id}`] = el)}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === `mobile-${coupon.id}` ? null : `mobile-${coupon.id}`)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {openMenuId === `mobile-${coupon.id}` && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                          <button
                            onClick={() => {
                              handleEdit(coupon);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              handleToggleStatus(coupon.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            {coupon.is_active ? (
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
                              handleDelete(coupon.id, coupon.usage_count || 0);
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
        </div>
      )}

      {/* Coupon Form Modal */}
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
                  {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Coupon Code * <span className="text-xs text-gray-500 font-normal">(Uppercase, no spaces)</span>
                  </label>
                  <div className="relative">
                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '') })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono"
                      required
                      placeholder="SUMMER2025"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                    rows={2}
                    placeholder="Summer promotion discount"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Type *</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.discount_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discount_type: e.target.value as 'percentage' | 'fixed_amount',
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white appearance-none"
                        required
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed_amount">Fixed Amount (€)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(€)'}
                    </label>
                    <div className="relative">
                      {formData.discount_type === 'percentage' ? (
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      ) : (
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      )}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount_value}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min. Rental Days <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.minimum_rental_days || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimum_rental_days: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="e.g., 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min. Amount (€) <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.minimum_amount || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minimum_amount: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholder="e.g., 100"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Valid From *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
                      <DatePicker
                        selected={formData.valid_from}
                        onChange={(date: Date | null) => setFormData({ ...formData, valid_from: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholderText="Select start date"
                        minDate={new Date()}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Valid Until *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
                      <DatePicker
                        selected={formData.valid_until}
                        onChange={(date: Date | null) => setFormData({ ...formData, valid_until: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        placeholderText="Select end date"
                        minDate={formData.valid_from || new Date()}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Usage Limit <span className="text-xs text-gray-500 font-normal">(Leave empty for unlimited)</span>
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>

                {/* Validation Preview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">Validation Preview:</p>
                  </div>
                  <p className="text-sm text-blue-700 font-medium">{getValidationPreview()}</p>
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
                    {editingCoupon ? 'Update' : 'Create'} Coupon
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
