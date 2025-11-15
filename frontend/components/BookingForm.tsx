'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  getLocations,
  getExtras,
  checkAvailability,
  validateCoupon,
  createBooking,
} from '@/lib/api';

interface BookingFormProps {
  vehicle: any;
  initialPickupDate?: Date | null;
  initialDropoffDate?: Date | null;
  initialPickupLocation?: string;
  initialDropoffLocation?: string;
}

export default function BookingForm({ 
  vehicle, 
  initialPickupDate = null,
  initialDropoffDate = null,
  initialPickupLocation = '',
  initialDropoffLocation = ''
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  const [formData, setFormData] = useState({
    pickup_location_id: initialPickupLocation,
    dropoff_location_id: initialDropoffLocation,
    pickup_date: initialPickupDate,
    dropoff_date: initialDropoffDate,
    selected_extras: [] as any[],
    customer: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      phone_country_code: '+212',
      date_of_birth: '',
      license_expiry: '',
      address: '',
      city: '',
      country: 'Morocco',
    },
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.pickup_date && formData.dropoff_date) {
      checkVehicleAvailability();
      calculatePricing();
    }
  }, [formData.pickup_date, formData.dropoff_date, formData.selected_extras]);

  const loadInitialData = async () => {
    try {
      const [locationsData, extrasData] = await Promise.all([
        getLocations(),
        getExtras(),
      ]);
      setLocations(locationsData);
      setExtras(extrasData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const checkVehicleAvailability = async () => {
    if (!formData.pickup_date || !formData.dropoff_date) return;

    try {
      const availabilityData = await checkAvailability(
        vehicle.id,
        formData.pickup_date.toISOString(),
        formData.dropoff_date.toISOString()
      );
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error checking availability:', error);
    }
  };

  const calculatePricing = async () => {
    if (!formData.pickup_date || !formData.dropoff_date) return;

    try {
      // Calculate base price
      const days = Math.ceil(
        (formData.dropoff_date.getTime() - formData.pickup_date.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let basePrice = vehicle.base_price_daily * days;
      if (days >= 30 && vehicle.base_price_monthly) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        basePrice = vehicle.base_price_monthly * months + vehicle.base_price_daily * remainingDays;
      } else if (days >= 7 && vehicle.base_price_weekly) {
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;
        basePrice = vehicle.base_price_weekly * weeks + vehicle.base_price_daily * remainingDays;
      }

      // Calculate extras price
      let extrasPrice = 0;
      formData.selected_extras.forEach((selectedExtra) => {
        const extra = extras.find((e) => e.id === selectedExtra.id);
        if (extra) {
          if (extra.price_type === 'per_day') {
            extrasPrice += extra.price * days * (selectedExtra.quantity || 1);
          } else {
            extrasPrice += extra.price * (selectedExtra.quantity || 1);
          }
        }
      });

      // Apply coupon discount
      let discountAmount = 0;
      if (coupon) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (basePrice + extrasPrice) * (coupon.discount_value / 100);
        } else {
          discountAmount = coupon.discount_value;
        }
      }

      const totalPrice = basePrice + extrasPrice - discountAmount;

      setPricing({
        days,
        base_price: basePrice,
        extras_price: extrasPrice,
        discount_amount: discountAmount,
        total_price: totalPrice,
      });
    } catch (error) {
      console.error('Error calculating pricing:', error);
    }
  };

  const handleCouponValidate = async () => {
    if (!couponCode) return;

    setCouponError('');
    try {
      const couponData = await validateCoupon(
        couponCode,
        pricing?.total_price,
        pricing?.days
      );
      setCoupon(couponData);
      calculatePricing(); // Recalculate with coupon
    } catch (error: any) {
      setCouponError(error.response?.data?.error || 'Invalid coupon code');
      setCoupon(null);
    }
  };

  const handleExtraToggle = (extraId: string) => {
    setFormData((prev) => {
      const existing = prev.selected_extras.find((e) => e.id === extraId);
      if (existing) {
        return {
          ...prev,
          selected_extras: prev.selected_extras.filter((e) => e.id !== extraId),
        };
      } else {
        return {
          ...prev,
          selected_extras: [...prev.selected_extras, { id: extraId, quantity: 1 }],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine country code with phone number
      const fullPhoneNumber = `${formData.customer.phone_country_code}${formData.customer.phone}`;
      
      // Prepare customer data without phone_country_code and with null license fields
      const customerData = {
        first_name: formData.customer.first_name,
        last_name: formData.customer.last_name,
        email: formData.customer.email,
        phone: fullPhoneNumber,
        date_of_birth: formData.customer.date_of_birth || null,
        license_number: null, // Removed from form
        license_country: null, // Removed from form
        license_expiry: formData.customer.license_expiry || null,
        address: formData.customer.address || null,
        city: formData.customer.city || null,
        country: formData.customer.country || null,
      };
      
      // Validate required fields before sending
      if (!formData.pickup_date || !formData.dropoff_date) {
        alert('Please select both pickup and dropoff dates');
        setLoading(false);
        return;
      }
      
      if (!formData.pickup_location_id || !formData.dropoff_location_id) {
        alert('Please select both pickup and dropoff locations');
        setLoading(false);
        return;
      }
      
      if (!customerData.first_name || !customerData.last_name || !customerData.email || !customerData.phone) {
        alert('Please fill in all required customer information');
        setLoading(false);
        return;
      }

      const bookingData: any = {
        vehicle_id: vehicle.id,
        pickup_location_id: formData.pickup_location_id,
        dropoff_location_id: formData.dropoff_location_id,
        pickup_date: formData.pickup_date.toISOString(),
        dropoff_date: formData.dropoff_date.toISOString(),
        extras: Array.isArray(formData.selected_extras) ? formData.selected_extras : [],
        customer: customerData,
      };
      
      // Only include coupon_code if it exists (validator expects string or undefined, not null)
      if (coupon?.code) {
        bookingData.coupon_code = coupon.code;
      }

      console.log('Final booking data being sent:', bookingData);
      const booking = await createBooking(bookingData);
      router.push(`/booking/confirmation?bookingNumber=${booking.booking_number}`);
    } catch (error: any) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Error creating booking';
      if (error.response?.data) {
        if (error.response.data.details) {
          errorMessage = `Validation error: ${error.response.data.details}`;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            const errorList = error.response.data.errors.map((e: any) => {
              const param = e.param || e.path || 'unknown';
              const msg = e.msg || 'Invalid value';
              return `${param}: ${msg}`;
            }).join(', ');
            errorMessage += ` (${errorList})`;
          }
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const errorList = error.response.data.errors.map((e: any) => {
            const param = e.param || e.path || 'unknown';
            const msg = e.msg || 'Invalid value';
            return `${param}: ${msg}`;
          }).join(', ');
          errorMessage = `Validation errors: ${errorList}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error creating booking: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Book Your Vehicle</h2>

      {/* Step 1: Dates and Locations */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pick-up Location
              </label>
              <select
                value={formData.pickup_location_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickup_location_id: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} - {loc.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drop-off Location
              </label>
              <select
                value={formData.dropoff_location_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dropoff_location_id: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} - {loc.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pick-up Date
              </label>
              <DatePicker
                selected={formData.pickup_date}
                onChange={(date: Date | null) =>
                  setFormData((prev) => ({ ...prev, pickup_date: date }))
                }
                minDate={new Date()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                dateFormat="yyyy-MM-dd"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drop-off Date
              </label>
              <DatePicker
                selected={formData.dropoff_date}
                onChange={(date: Date | null) =>
                  setFormData((prev) => ({ ...prev, dropoff_date: date }))
                }
                minDate={formData.pickup_date || new Date()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                dateFormat="yyyy-MM-dd"
                required
              />
            </div>
          </div>

          {availability && (
            <div
              className={`p-4 rounded-lg ${
                availability.available
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {availability.available ? (
                <p>
                  ✓ Available ({availability.available_count} unit(s) available)
                </p>
              ) : (
                <p>✗ Not available for selected dates</p>
              )}
            </div>
          )}

          {pricing && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Pricing Summary</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Base Price ({pricing.days} days):</span>
                  <span>€{pricing.base_price.toFixed(2)}</span>
                </div>
                {pricing.extras_price > 0 && (
                  <div className="flex justify-between">
                    <span>Extras:</span>
                    <span>€{pricing.extras_price.toFixed(2)}</span>
                  </div>
                )}
                {pricing.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-€{pricing.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>€{pricing.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (!formData.dropoff_location_id) {
                alert('Please select a drop-off location before continuing');
                return;
              }
              if (!formData.pickup_location_id) {
                alert('Please select a pick-up location before continuing');
                return;
              }
              if (!formData.pickup_date || !formData.dropoff_date) {
                alert('Please select both pick-up and drop-off dates before continuing');
                return;
              }
              if (!availability?.available) {
                alert('Vehicle is not available for the selected dates. Please choose different dates.');
                return;
              }
              setStep(2);
            }}
            className="w-full bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Continue to Extras
          </button>
        </div>
      )}

      {/* Step 2: Extras */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Additional Services</h3>
          <div className="space-y-4">
            {extras.map((extra) => {
              const isSelected = formData.selected_extras.some((e) => e.id === extra.id);
              const getImageUrl = (url: string | null) => {
                if (!url) return null;
                if (url.startsWith('http://') || url.startsWith('https://')) {
                  return url;
                }
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const baseUrl = apiUrl.replace('/api', '');
                return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
              };
              return (
                <label
                  key={extra.id}
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleExtraToggle(extra.id)}
                    className="w-5 h-5 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
                  />
                  {extra.cover_image && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={getImageUrl(extra.cover_image) || ''}
                        alt={extra.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 block">{extra.name}</span>
                    {extra.description && (
                      <p className="text-sm text-gray-600 mt-1">{extra.description}</p>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">
                    €{Number(extra.price || 0).toFixed(2)}
                    {extra.price_type === 'per_day' && '/day'}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="button"
                onClick={handleCouponValidate}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Apply
              </button>
            </div>
            {couponError && (
              <p className="text-red-600 text-sm mt-2">{couponError}</p>
            )}
            {coupon && (
              <p className="text-green-600 text-sm mt-2">
                Coupon applied: {coupon.code} ({coupon.discount_value}
                {coupon.discount_type === 'percentage' ? '%' : '€'} off)
              </p>
            )}
          </div>

          {pricing && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Pricing Summary</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Base Price ({pricing.days} days):</span>
                  <span>€{pricing.base_price.toFixed(2)}</span>
                </div>
                {pricing.extras_price > 0 && (
                  <div className="flex justify-between">
                    <span>Extras:</span>
                    <span>€{pricing.extras_price.toFixed(2)}</span>
                  </div>
                )}
                {pricing.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-€{pricing.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>€{pricing.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800"
            >
              Continue to Customer Info
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Information */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-xl font-semibold">Customer Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.customer.first_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer: { ...prev.customer, first_name: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.customer.last_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer: { ...prev.customer, last_name: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.customer.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value },
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.customer.phone_country_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer: { ...prev.customer, phone_country_code: e.target.value },
                    }))
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="+212">+212 (MA)</option>
                  <option value="+33">+33 (FR)</option>
                  <option value="+34">+34 (ES)</option>
                  <option value="+39">+39 (IT)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+49">+49 (DE)</option>
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+971">+971 (AE)</option>
                  <option value="+966">+966 (SA)</option>
                  <option value="+20">+20 (EG)</option>
                  <option value="+213">+213 (DZ)</option>
                  <option value="+216">+216 (TN)</option>
                </select>
                <input
                  type="tel"
                  value={formData.customer.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customer: { ...prev.customer, phone: e.target.value },
                    }))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
          </div>

          {pricing && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Final Pricing</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Base Price ({pricing.days} days):</span>
                  <span>€{pricing.base_price.toFixed(2)}</span>
                </div>
                {pricing.extras_price > 0 && (
                  <div className="flex justify-between">
                    <span>Extras:</span>
                    <span>€{pricing.extras_price.toFixed(2)}</span>
                  </div>
                )}
                {pricing.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-€{pricing.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span>€{pricing.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

