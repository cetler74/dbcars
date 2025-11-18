'use client';

import { useState, useEffect, useRef } from 'react';
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
  getVehicleBlockedDates,
} from '@/lib/api';

interface BookingFormProps {
  vehicle: any;
  initialPickupDate?: Date | null;
  initialDropoffDate?: Date | null;
  initialPickupLocation?: string;
  initialDropoffLocation?: string;
  onStepChange?: (step: number) => void;
}

export default function BookingForm({ 
  vehicle, 
  initialPickupDate = null,
  initialDropoffDate = null,
  initialPickupLocation = '',
  initialDropoffLocation = '',
  onStepChange
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const hasNotifiedInitial = useRef(false);
  
  // Helper function to change step and notify parent
  const changeStep = (newStep: number) => {
    console.log('changeStep called with:', newStep, 'current step:', step);
    setStep((prevStep) => {
      console.log('setStep called, prev:', prevStep, 'new:', newStep);
      return newStep;
    });
    if (onStepChange) {
      console.log('Calling onStepChange with:', newStep);
      onStepChange(newStep);
    }
  };
  
  // Notify parent of initial step only once
  useEffect(() => {
    if (onStepChange && !hasNotifiedInitial.current) {
      onStepChange(step);
      hasNotifiedInitial.current = true;
    }
  }, [onStepChange]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  
  // Blocked dates state
  const [blockedDatesData, setBlockedDatesData] = useState<any>(null);

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
    if (vehicle?.id) {
      loadBlockedDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  useEffect(() => {
    console.log('Step changed to:', step);
  }, [step]);

  useEffect(() => {
    if (formData.pickup_date && formData.dropoff_date) {
      checkVehicleAvailability();
      calculatePricing();
    }
  }, [formData.pickup_date, formData.dropoff_date, formData.selected_extras, coupon]);

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

  const loadBlockedDates = async () => {
    try {
      // Load blocked dates for the next 12 months
      const data = await getVehicleBlockedDates(vehicle.id);
      setBlockedDatesData(data);
      console.log('Loaded blocked dates:', data);
    } catch (error) {
      console.error('Error loading blocked dates:', error);
    }
  };

  // Helper function to check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    if (!blockedDatesData) return true;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check blocked dates (maintenance/blocked notes)
    if (blockedDatesData.blocked_dates) {
      const isBlocked = blockedDatesData.blocked_dates.some((note: any) => {
        const noteDate = new Date(note.note_date).toISOString().split('T')[0];
        return dateStr === noteDate;
      });
      if (isBlocked) return false;
    }
    
    // Check if date falls within any booking
    if (blockedDatesData.bookings) {
      const isBooked = blockedDatesData.bookings.some((booking: any) => {
        const pickupDate = new Date(booking.pickup_date).toISOString().split('T')[0];
        const dropoffDate = new Date(booking.dropoff_date).toISOString().split('T')[0];
        return dateStr >= pickupDate && dateStr <= dropoffDate;
      });
      if (isBooked) return false;
    }
    
    return true;
  };

  const checkVehicleAvailability = async () => {
    if (!formData.pickup_date || !formData.dropoff_date) return;

    try {
      // Use the selected dates with their times, or normalize if at start of day
      const normalizedPickupDate = new Date(formData.pickup_date);
      const pickupHours = normalizedPickupDate.getUTCHours();
      const pickupMinutes = normalizedPickupDate.getUTCMinutes();
      const pickupSeconds = normalizedPickupDate.getUTCSeconds();
      
      if (pickupHours === 0 && pickupMinutes === 0 && pickupSeconds === 0) {
        normalizedPickupDate.setUTCHours(0, 0, 0, 0);
      }
      
      const normalizedDropoffDate = new Date(formData.dropoff_date);
      const dropoffHours = normalizedDropoffDate.getUTCHours();
      const dropoffMinutes = normalizedDropoffDate.getUTCMinutes();
      const dropoffSeconds = normalizedDropoffDate.getUTCSeconds();
      
      if (dropoffHours === 0 && dropoffMinutes === 0 && dropoffSeconds === 0) {
        normalizedDropoffDate.setUTCHours(23, 59, 59, 999);
      }

      const availabilityData = await checkAvailability(
        vehicle.id,
        normalizedPickupDate.toISOString(),
        normalizedDropoffDate.toISOString()
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

      // Ensure minimum 1 day rental
      const rentalDays = Math.max(1, days);
      
      // Calculate hours for display
      const hours = Math.ceil(
        (formData.dropoff_date.getTime() - formData.pickup_date.getTime()) /
          (1000 * 60 * 60)
      );

      let basePrice = vehicle.base_price_daily * rentalDays;
      if (rentalDays >= 30 && vehicle.base_price_monthly && vehicle.base_price_monthly > 0) {
        const months = Math.floor(rentalDays / 30);
        const remainingDays = rentalDays % 30;
        basePrice = vehicle.base_price_monthly * months + vehicle.base_price_daily * remainingDays;
      } else if (rentalDays >= 7 && vehicle.base_price_weekly && vehicle.base_price_weekly > 0) {
        const weeks = Math.floor(rentalDays / 7);
        const remainingDays = rentalDays % 7;
        basePrice = vehicle.base_price_weekly * weeks + vehicle.base_price_daily * remainingDays;
      }

      // Calculate extras price
      let extrasPrice = 0;
        formData.selected_extras.forEach((selectedExtra) => {
        const extra = extras.find((e) => e.id === selectedExtra.id);
        if (extra) {
          if (extra.price_type === 'per_day') {
            extrasPrice += extra.price * rentalDays * (selectedExtra.quantity || 1);
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
        days: rentalDays,
        hours,
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
      // Price will be recalculated automatically by useEffect when coupon changes
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
      
      // Validate minimum 1 day (24 hours) rental period
      const timeDiff = formData.dropoff_date.getTime() - formData.pickup_date.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff < 24) {
        alert(`Minimum rental period is 1 day (24 hours). Your selected period is ${Math.round(hoursDiff * 10) / 10} hours.`);
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

      // Normalize dates: if time is at start of day (00:00:00), normalize to full day range
      // Otherwise, use the selected time
      const normalizedPickupDate = new Date(formData.pickup_date);
      const pickupHours = normalizedPickupDate.getUTCHours();
      const pickupMinutes = normalizedPickupDate.getUTCMinutes();
      const pickupSeconds = normalizedPickupDate.getUTCSeconds();
      
      // Only normalize if time is exactly at start of day
      if (pickupHours === 0 && pickupMinutes === 0 && pickupSeconds === 0) {
        normalizedPickupDate.setUTCHours(0, 0, 0, 0);
      }
      
      const normalizedDropoffDate = new Date(formData.dropoff_date);
      const dropoffHours = normalizedDropoffDate.getUTCHours();
      const dropoffMinutes = normalizedDropoffDate.getUTCMinutes();
      const dropoffSeconds = normalizedDropoffDate.getUTCSeconds();
      
      // Only normalize if time is exactly at start of day
      if (dropoffHours === 0 && dropoffMinutes === 0 && dropoffSeconds === 0) {
        normalizedDropoffDate.setUTCHours(23, 59, 59, 999); // End of dropoff day
      }

      // Check availability before submitting
      try {
        const availabilityCheck = await checkAvailability(
          vehicle.id,
          normalizedPickupDate.toISOString(),
          normalizedDropoffDate.toISOString()
        );
        
        if (!availabilityCheck.available) {
          alert('Sorry, this vehicle is not available for the selected dates. Please choose different dates.');
          setLoading(false);
          return;
        }
      } catch (availabilityError) {
        console.error('Error checking availability before submission:', availabilityError);
        // Continue with submission - backend will also check availability
      }

      const bookingData: any = {
        vehicle_id: vehicle.id,
        pickup_location_id: formData.pickup_location_id,
        dropoff_location_id: formData.dropoff_location_id,
        pickup_date: normalizedPickupDate.toISOString(),
        dropoff_date: normalizedDropoffDate.toISOString(),
        extras: Array.isArray(formData.selected_extras) ? formData.selected_extras : [],
        customer: customerData,
      };
      
      // Only include coupon_code if it exists (validator expects string or undefined, not null)
      if (coupon?.code) {
        bookingData.coupon_code = coupon.code;
      }

      console.log('Final booking data being sent:', JSON.stringify(bookingData, null, 2));
      console.log('Booking data types:', {
        vehicle_id: typeof bookingData.vehicle_id,
        pickup_location_id: typeof bookingData.pickup_location_id,
        dropoff_location_id: typeof bookingData.dropoff_location_id,
        pickup_date: typeof bookingData.pickup_date,
        dropoff_date: typeof bookingData.dropoff_date,
        customer: typeof bookingData.customer,
        extras: Array.isArray(bookingData.extras),
      });
      
      const booking = await createBooking(bookingData);
      router.push(`/booking/confirmation?bookingNumber=${booking.booking_number}`);
    } catch (error: any) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Error creating booking';
      let isAvailabilityError = false;
      
      if (error.response?.data) {
        // Check if response data is empty object
        if (Object.keys(error.response.data).length === 0) {
          errorMessage = 'Validation failed: Please check that all required fields are filled correctly.';
          console.error('Empty error response - likely validation issue');
        } else if (error.response.data.details) {
          errorMessage = `Validation error: ${error.response.data.details}`;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
          
          // Check if it's an availability error
          if (error.response.data.error.toLowerCase().includes('not available') || 
              error.response.data.error.toLowerCase().includes('availability')) {
            isAvailabilityError = true;
            errorMessage = 'Sorry, this vehicle is not available for the selected dates. Please choose different dates and try again.';
          }
          
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
      
      // Show user-friendly error message
      if (isAvailabilityError) {
        alert(errorMessage);
      } else {
        alert(`Error creating booking: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  console.log('BookingForm render - current step:', step);
  
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col w-full justify-center">
      <h2 className="text-2xl font-bold mb-6">Book Your Vehicle</h2>
      <div className="mb-2 text-sm text-gray-500">Current Step: {step}</div>

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
                Pick-up Date & Time
              </label>
              <DatePicker
                selected={formData.pickup_date}
                onChange={(date: Date | null) => {
                  setFormData((prev) => {
                    // If dropoff date is same day or before new pickup date, reset it
                    let newDropoffDate = prev.dropoff_date;
                    if (date && prev.dropoff_date) {
                      const minDropoffDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
                      if (prev.dropoff_date <= date) {
                        newDropoffDate = null;
                      }
                    }
                    return { ...prev, pickup_date: date, dropoff_date: newDropoffDate };
                  });
                }}
                minDate={new Date()}
                filterDate={isDateAvailable}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText="Select date & time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drop-off Date & Time
              </label>
              <DatePicker
                selected={formData.dropoff_date}
                onChange={(date: Date | null) => {
                  setFormData((prev) => {
                    // Validate minimum 1 day rental period
                    if (date && prev.pickup_date) {
                      const timeDiff = date.getTime() - prev.pickup_date.getTime();
                      const hoursDiff = timeDiff / (1000 * 60 * 60);
                      if (hoursDiff < 24) {
                        // If less than 24 hours, set to exactly 24 hours after pickup
                        const minDropoffDate = new Date(prev.pickup_date.getTime() + 24 * 60 * 60 * 1000);
                        return { ...prev, dropoff_date: minDropoffDate };
                      }
                    }
                    return { ...prev, dropoff_date: date };
                  });
                }}
                minDate={
                  formData.pickup_date
                    ? (() => {
                        // Minimum date is the day after pickup (to ensure 24+ hours)
                        const minDate = new Date(formData.pickup_date);
                        minDate.setDate(minDate.getDate() + 1);
                        return minDate;
                      })()
                    : new Date()
                }
                filterDate={(date: Date) => {
                  if (!formData.pickup_date) return isDateAvailable(date);
                  // Prevent selecting same day as pickup
                  if (date.toDateString() === formData.pickup_date.toDateString()) {
                    return false;
                  }
                  return isDateAvailable(date);
                }}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="dd/MM/yyyy HH:mm"
                placeholderText="Select date & time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum rental period is 1 day (24 hours)</p>
              {formData.pickup_date && formData.dropoff_date && (() => {
                const timeDiff = formData.dropoff_date.getTime() - formData.pickup_date.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                if (hoursDiff < 24) {
                  return (
                    <p className="text-xs text-red-500 mt-1">
                      Rental period must be at least 24 hours. Current: {Math.round(hoursDiff * 10) / 10} hours
                    </p>
                  );
                }
                return null;
              })()}
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
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Rental Period:</span>
                  <span>{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours} {pricing.hours === 1 ? 'hour' : 'hours'})</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Price ({pricing.days} {pricing.days === 1 ? 'day' : 'days'}):</span>
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              console.log('Continue to Extras clicked', {
                dropoff_location_id: formData.dropoff_location_id,
                pickup_location_id: formData.pickup_location_id,
                pickup_date: formData.pickup_date,
                dropoff_date: formData.dropoff_date,
                availability: availability,
                currentStep: step
              });
              
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
              if (availability && !availability.available) {
                alert('Vehicle is not available for the selected dates. Please choose different dates.');
                return;
              }
              
              console.log('All validations passed, changing to step 2');
              changeStep(2);
            }}
            className="w-full bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Continue to Extras
          </button>
        </div>
      )}

      {/* Step 2: Extras */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Additional Services</h3>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Side - Extras List */}
            <div className="w-full lg:w-[70%] space-y-4">
            {extras.map((extra) => {
              const isSelected = formData.selected_extras.some((e) => e.id === extra.id);
              return (
                <label
                  key={extra.id}
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleExtraToggle(extra.id)}
                      className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-400"
                  />
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

            {/* Right Side - Vehicle Image and Pricing Summary */}
            <div className="w-full lg:w-[35%] flex-shrink-0 space-y-4">
              {/* Vehicle Image */}
              {(() => {
                const getImageUrl = (url: string | null) => {
                  if (!url) return null;
                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    return url;
                  }
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                  const baseUrl = apiUrl.replace('/api', '');
                  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
                };
                const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
                const mainImage = vehicleImages.length > 0 ? vehicleImages[0] : null;
                
                return (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {mainImage ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900">{vehicle.make} {vehicle.model}</h4>
                      {vehicle.year && (
                        <p className="text-sm text-gray-600">{vehicle.year}</p>
                      )}
                </div>
                  </div>
                );
              })()}

              {/* Pricing Summary */}
              {pricing && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-4 text-lg">Pricing Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 pb-2 border-b border-gray-200">
                      <span>Rental Period:</span>
                      <span>{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours} {pricing.hours === 1 ? 'hour' : 'hours'})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Price ({pricing.days} {pricing.days === 1 ? 'day' : 'days'}):</span>
                      <span className="font-medium">€{pricing.base_price.toFixed(2)}</span>
                    </div>
                    {pricing.extras_price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Extras:</span>
                        <span className="font-medium">€{pricing.extras_price.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span className="font-medium">-€{pricing.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl border-t border-gray-300 pt-3 mt-3">
                      <span>Total:</span>
                      <span className="text-orange-600">€{pricing.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Coupon Code - Separate container below pricing summary */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coupon Code (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCouponValidate}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-600 text-xs mt-2">{couponError}</p>
                )}
                {coupon && (
                  <p className="text-green-600 text-xs mt-2">
                    Coupon applied: {coupon.code} ({coupon.discount_value}
                    {coupon.discount_type === 'percentage' ? '%' : '€'} off)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="flex-1 bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => changeStep(3)}
              className="flex-1 bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Customer Information */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-xl font-semibold">Customer Information</h3>

          {/* Customer Information Form - Full Width */}
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

          {/* Vehicle Image, Name, Pricing Summary, and Extras - Stacked Below */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Image and Name */}
            <div className="lg:col-span-1 space-y-4">
              {(() => {
                const getImageUrl = (url: string | null) => {
                  if (!url) return null;
                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    return url;
                  }
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                  const baseUrl = apiUrl.replace('/api', '');
                  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
                };
                const vehicleImages = Array.isArray(vehicle.images) ? vehicle.images : vehicle.images ? [vehicle.images] : [];
                const mainImage = vehicleImages.length > 0 ? vehicleImages[0] : null;
                
                return (
                  <>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {mainImage ? (
                        <div className="relative w-full h-48">
                          <Image
                            src={getImageUrl(mainImage) || '/placeholder-car.jpg'}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 text-lg">{vehicle.make} {vehicle.model}</h4>
                        {vehicle.year && (
                          <p className="text-sm text-gray-600">{vehicle.year}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Days Summary - Separate Container */}
                    {formData.pickup_date && formData.dropoff_date && (() => {
                      const pickupLocation = locations.find((loc) => loc.id === formData.pickup_location_id);
                      const dropoffLocation = locations.find((loc) => loc.id === formData.dropoff_location_id);
                      
                      return (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Pickup Date:</span>
                              <span className="font-medium text-gray-900">
                                {formData.pickup_date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {pickupLocation && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Pickup Location:</span>
                                <span className="font-medium text-gray-900 text-right">
                                  {pickupLocation.name} - {pickupLocation.city}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 mt-2">
                              <span className="text-gray-600">Dropoff Date:</span>
                              <span className="font-medium text-gray-900">
                                {formData.dropoff_date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {dropoffLocation && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Dropoff Location:</span>
                                <span className="font-medium text-gray-900 text-right">
                                  {dropoffLocation.name} - {dropoffLocation.city}
                                </span>
                              </div>
                            )}
                            {pricing && (
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                <span className="text-gray-600 font-medium">Rental Period:</span>
                                <span className="font-bold text-gray-900">{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours} {pricing.hours === 1 ? 'hour' : 'hours'})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                );
              })()}
            </div>

            {/* Pricing Summary and Selected Extras */}
            <div className="lg:col-span-2">
              {pricing && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-4 text-lg">Pricing Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 pb-2 border-b border-gray-200">
                      <span>Rental Period:</span>
                      <span>{pricing.days} {pricing.days === 1 ? 'day' : 'days'} ({pricing.hours} {pricing.hours === 1 ? 'hour' : 'hours'})</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Price ({pricing.days} {pricing.days === 1 ? 'day' : 'days'}):</span>
                      <span className="font-medium">€{pricing.base_price.toFixed(2)}</span>
                    </div>
                    {pricing.extras_price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Extras:</span>
                        <span className="font-medium">€{pricing.extras_price.toFixed(2)}</span>
                      </div>
                    )}
                    {pricing.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount:</span>
                        <span className="font-medium">-€{pricing.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xl border-t border-gray-300 pt-3 mt-3">
                      <span>Total:</span>
                      <span className="text-orange-600">€{pricing.total_price.toFixed(2)}</span>
                    </div>
                  </div>

                  {formData.selected_extras.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold mb-3 text-base">Selected Extras</h4>
                      <div className="space-y-3">
                        {formData.selected_extras.map((extra) => {
                          const extraDetails = extras.find((e) => e.id === extra.id);
                          return (
                            <div
                              key={extra.id}
                              className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {extraDetails?.name || 'Extra'}
                                </p>
                                {extraDetails?.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {extraDetails.description}
                                  </p>
                                )}
                              </div>
                              <span className="font-semibold text-gray-900 text-sm ml-4">
                                €{Number(extraDetails?.price || 0).toFixed(2)}
                                {extraDetails?.price_type === 'per_day' && '/day'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => changeStep(2)}
              className="flex-1 bg-gray-200 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

