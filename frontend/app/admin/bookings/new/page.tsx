'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import CustomerSearch from '@/components/CustomerSearch';
import { 
  getVehicles, 
  getLocations, 
  getExtras, 
  createBooking,
  checkAvailability,
  getDraft,
  saveDraft,
  deleteDraft,
  getVehicle 
} from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: string;
  base_price_daily: number;
  images: string[];
  features: string[];
  seats: number;
  transmission: string;
  fuel_type: string;
  subunits: any[];
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country?: string;
}

interface Extra {
  id: string;
  name: string;
  description?: string;
  price: number;
  price_type: 'per_rental' | 'per_day' | 'per_week';
  cover_image?: string;
}

interface SelectedExtra {
  id: string;
  quantity: number;
}

export default function AdminCreateBookingPage() {
  const router = useRouter();
  
  // Date selection
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffDate, setDropoffDate] = useState<Date | null>(null);
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [rentalDays, setRentalDays] = useState(0);
  
  // Date picker visibility
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDropoffDatePicker, setShowDropoffDatePicker] = useState(false);
  
  // Refs for click outside detection
  const pickupDateRef = useRef<HTMLDivElement>(null);
  const dropoffDateRef = useRef<HTMLDivElement>(null);
  
  // Refs for step sections (for auto-scrolling)
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

  // Available data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allExtras, setAllExtras] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingVehicles, setSearchingVehicles] = useState(false);

  // Selected data
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [pickupLocationId, setPickupLocationId] = useState('');
  const [dropoffLocationId, setDropoffLocationId] = useState('');
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);

  // Customer data
  const [customerData, setCustomerData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    license_number: '',
    license_country: '',
    license_expiry: '',
    address: '',
    city: '',
    country: '',
  });

  // Pricing
  const [basePrice, setBasePrice] = useState(0);
  const [extrasPrice, setExtrasPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Notes
  const [notes, setNotes] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  // Manual price adjustments
  const [showManualAdjustments, setShowManualAdjustments] = useState(false);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [manualFee, setManualFee] = useState(0);
  const [priceAdjustmentReason, setPriceAdjustmentReason] = useState('');

  // Draft management
  const searchParams = useSearchParams();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Error modal
  const [errorModal, setErrorModal] = useState<{
    title: string;
    message: string;
    actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'secondary' }>;
  } | null>(null);

  // Booking summary minimize state
  const [isSummaryMinimized, setIsSummaryMinimized] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [locationsData, extrasData] = await Promise.all([
        getLocations(),
        getExtras(),
      ]);
      setAllLocations(locationsData);
      setAllExtras(extrasData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Validate coupon code
  const validateCouponCode = async () => {
    if (!couponCode) return;
    
    setCouponError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(
        `${apiUrl}/coupons/${couponCode}?total_amount=${totalPrice}&rental_days=${rentalDays}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        setCouponError(error.error || 'Invalid coupon');
        setAppliedCoupon(null);
        return;
      }
      
      const coupon = await response.json();
      setAppliedCoupon(coupon);
      toast.success(`Coupon applied: ${coupon.code}`);
    } catch (error: any) {
      setCouponError('Failed to validate coupon');
      setAppliedCoupon(null);
    }
  };

  // Save draft to backend
  const saveDraftToBackend = async () => {
    if (!pickupDate && !selectedVehicle && !customerData.first_name) {
      return; // Nothing to save
    }
    
    setIsSavingDraft(true);
    try {
      const draftData = {
        id: draftId || undefined,
        draft_data: {
          pickupDate: pickupDate?.toISOString(),
          pickupTime,
          dropoffDate: dropoffDate?.toISOString(),
          dropoffTime,
          selectedVehicle,
          pickupLocationId,
          dropoffLocationId,
          selectedExtras,
          customerData,
          notes,
          couponCode,
          appliedCoupon,
          manualDiscount,
          manualFee,
          priceAdjustmentReason
        },
        customer_name: customerData.first_name ? 
          `${customerData.first_name} ${customerData.last_name}`.trim() : null,
        vehicle_name: selectedVehicle ? 
          `${selectedVehicle.make} ${selectedVehicle.model}` : null,
        total_price: totalPrice || null
      };
      
      const saved = await saveDraft(draftData);
      setDraftId(saved.id);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Load draft from URL param
  useEffect(() => {
    const draftParam = searchParams.get('draft');
    if (draftParam) {
      loadDraft(draftParam);
    }
  }, [searchParams]);

  const loadDraft = async (id: string) => {
    try {
      const draft = await getDraft(id);
      const data = draft.draft_data;
      
      // Restore all state
      if (data.pickupDate) setPickupDate(new Date(data.pickupDate));
      if (data.pickupTime) setPickupTime(data.pickupTime);
      if (data.dropoffDate) setDropoffDate(new Date(data.dropoffDate));
      if (data.dropoffTime) setDropoffTime(data.dropoffTime);
      if (data.selectedVehicle) setSelectedVehicle(data.selectedVehicle);
      if (data.pickupLocationId) setPickupLocationId(data.pickupLocationId);
      if (data.dropoffLocationId) setDropoffLocationId(data.dropoffLocationId);
      if (data.selectedExtras) setSelectedExtras(data.selectedExtras);
      if (data.customerData) setCustomerData(data.customerData);
      if (data.notes) setNotes(data.notes);
      if (data.couponCode) setCouponCode(data.couponCode);
      if (data.appliedCoupon) setAppliedCoupon(data.appliedCoupon);
      if (data.manualDiscount) setManualDiscount(data.manualDiscount);
      if (data.manualFee) setManualFee(data.manualFee);
      if (data.priceAdjustmentReason) setPriceAdjustmentReason(data.priceAdjustmentReason);
      
      setDraftId(id);
      toast.success('Draft loaded successfully');
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error('Failed to load draft');
    }
  };

  // Auto-save draft every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraftToBackend();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [
    pickupDate, pickupTime, dropoffDate, dropoffTime,
    selectedVehicle, pickupLocationId, dropoffLocationId,
    selectedExtras, customerData, notes, couponCode,
    appliedCoupon, manualDiscount, manualFee, priceAdjustmentReason,
    draftId, totalPrice
  ]);

  // Auto-scroll to next step when current step is completed
  useEffect(() => {
    if (pickupDate && dropoffDate && rentalDays > 0 && vehicles.length > 0 && step2Ref.current) {
      // Step 1 complete, scroll to Step 2 (Vehicle Selection)
      setTimeout(() => {
        step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500); // Small delay to let vehicles load
    }
  }, [pickupDate, dropoffDate, rentalDays, vehicles.length]);

  useEffect(() => {
    if (selectedVehicle && step3Ref.current) {
      // Step 2 complete, scroll to Step 3 (Locations & Extras)
      setTimeout(() => {
        step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    if (pickupLocationId && dropoffLocationId && step4Ref.current) {
      // Step 3 complete, scroll to Step 4 (Customer Info)
      setTimeout(() => {
        step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [pickupLocationId, dropoffLocationId]);

  useEffect(() => {
    if (customerData.first_name && customerData.email && step5Ref.current) {
      // Step 4 complete, scroll to Step 5 (Review & Submit)
      setTimeout(() => {
        step5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [customerData.first_name, customerData.email]);

  const handleSaveDraftAndExit = async () => {
    await saveDraftToBackend();
    toast.success('Draft saved!');
    router.push('/admin/bookings/drafts');
  };

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupDateRef.current && !pickupDateRef.current.contains(event.target as Node)) {
        setShowPickupDatePicker(false);
      }
      if (dropoffDateRef.current && !dropoffDateRef.current.contains(event.target as Node)) {
        setShowDropoffDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate rental days when dates change
  useEffect(() => {
    if (pickupDate && dropoffDate) {
      const pickup = new Date(pickupDate);
      const dropoff = new Date(dropoffDate);
      const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
      const [dropoffHour, dropoffMinute] = dropoffTime.split(':').map(Number);
      
      pickup.setHours(pickupHour, pickupMinute, 0, 0);
      dropoff.setHours(dropoffHour, dropoffMinute, 0, 0);
      
      const diffTime = dropoff.getTime() - pickup.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setRentalDays(diffDays > 0 ? diffDays : 0);
    } else {
      setRentalDays(0);
    }
  }, [pickupDate, pickupTime, dropoffDate, dropoffTime]);

  // Auto-search vehicles when dates/times change
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (pickupDate && dropoffDate && rentalDays > 0) {
      setSearchingVehicles(true);
      
      timer = setTimeout(() => {
        searchAvailableVehicles();
      }, 800);
    } else {
      // Clear vehicles if dates are incomplete
      setVehicles([]);
      setSelectedVehicle(null);
      setSearchingVehicles(false);
    }
    
    return () => clearTimeout(timer);
  }, [pickupDate, pickupTime, dropoffDate, dropoffTime, rentalDays]);

  // Search for available vehicles
  const searchAvailableVehicles = async () => {
    if (!pickupDate || !dropoffDate) {
      toast.error('Please select pickup and dropoff dates');
      return;
    }

    if (rentalDays <= 0) {
      toast.error('Dropoff date must be after pickup date');
      return;
    }

    setSearchingVehicles(true);
    try {
      const pickup = new Date(pickupDate);
      const dropoff = new Date(dropoffDate);
      const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
      const [dropoffHour, dropoffMinute] = dropoffTime.split(':').map(Number);
      
      pickup.setHours(pickupHour, pickupMinute, 0, 0);
      dropoff.setHours(dropoffHour, dropoffMinute, 0, 0);
      
      const vehiclesData = await getVehicles({
        available_from: pickup.toISOString(),
        available_to: dropoff.toISOString(),
      });
      
      setVehicles(vehiclesData);
      
      if (vehiclesData.length === 0) {
        toast.error('No vehicles available for selected dates');
      } else {
        toast.success(`Found ${vehiclesData.length} available vehicle(s)`);
      }
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast.error('Failed to search for available vehicles');
    } finally {
      setSearchingVehicles(false);
    }
  };

  // Calculate pricing when vehicle or extras change
  useEffect(() => {
    if (selectedVehicle && rentalDays > 0) {
      const base = selectedVehicle.base_price_daily * rentalDays;
      setBasePrice(base);
      
      let extras = 0;
      selectedExtras.forEach((selectedExtra) => {
        const extra = allExtras.find((e) => e.id === selectedExtra.id);
        if (extra) {
          if (extra.price_type === 'per_day') {
            extras += extra.price * rentalDays * selectedExtra.quantity;
          } else {
            extras += extra.price * selectedExtra.quantity;
          }
        }
      });
      setExtrasPrice(extras);
      
      // Calculate coupon discount
      let discount = 0;
      if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
          discount = (base + extras) * (appliedCoupon.discount_value / 100);
        } else {
          discount = appliedCoupon.discount_value;
        }
      }
      
      // Apply manual adjustments
      const total = base + extras - discount - manualDiscount + manualFee;
      setTotalPrice(total);
    } else {
      setBasePrice(0);
      setExtrasPrice(0);
      setTotalPrice(0);
    }
  }, [selectedVehicle, rentalDays, selectedExtras, allExtras, appliedCoupon, manualDiscount, manualFee]);

  const handleExtraToggle = (extraId: string) => {
    const existing = selectedExtras.find((e) => e.id === extraId);
    if (existing) {
      setSelectedExtras(selectedExtras.filter((e) => e.id !== extraId));
    } else {
      setSelectedExtras([...selectedExtras, { id: extraId, quantity: 1 }]);
    }
  };

  const handleExtraQuantityChange = (extraId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedExtras(selectedExtras.filter((e) => e.id !== extraId));
    } else {
      setSelectedExtras(
        selectedExtras.map((e) => (e.id === extraId ? { ...e, quantity } : e))
      );
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!pickupDate || !dropoffDate) {
      toast.error('Please select pickup and dropoff dates');
      return;
    }

    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }

    if (!pickupLocationId || !dropoffLocationId) {
      toast.error('Please select pickup and dropoff locations');
      return;
    }

    if (!customerData.first_name || !customerData.last_name || !customerData.email || !customerData.phone) {
      toast.error('Please fill in required customer information (name, email, phone)');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Validate manual adjustments
    if ((manualDiscount > 0 || manualFee > 0) && !priceAdjustmentReason.trim()) {
      toast.error('Please provide a reason for price adjustment');
      return;
    }

    setLoading(true);
    try {
      const pickup = new Date(pickupDate!);
      const dropoff = new Date(dropoffDate!);
      const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
      const [dropoffHour, dropoffMinute] = dropoffTime.split(':').map(Number);
      
      pickup.setHours(pickupHour, pickupMinute, 0, 0);
      dropoff.setHours(dropoffHour, dropoffMinute, 0, 0);

      // Prepare notes with manual adjustments
      let finalNotes = notes || '';
      if (manualDiscount > 0 || manualFee > 0) {
        const adjustmentNote = `\n\nPrice Adjustments:\n${
          manualDiscount > 0 ? `- Manual Discount: €${manualDiscount.toFixed(2)}\n` : ''
        }${
          manualFee > 0 ? `- Additional Fee: €${manualFee.toFixed(2)}\n` : ''
        }Reason: ${priceAdjustmentReason}`;
        finalNotes += adjustmentNote;
      }
      
      const bookingData: any = {
        customer: customerData,
        vehicle_id: selectedVehicle.id,
        pickup_location_id: pickupLocationId,
        dropoff_location_id: dropoffLocationId,
        pickup_date: pickup.toISOString(),
        dropoff_date: dropoff.toISOString(),
        extras: selectedExtras,
        notes: finalNotes || undefined,
      };
      
      // Add coupon code if applied
      if (appliedCoupon) {
        bookingData.coupon_code = appliedCoupon.code;
      }

      const result = await createBooking(bookingData);
      
      // Delete draft if exists
      if (draftId) {
        try {
          await deleteDraft(draftId);
        } catch (error) {
          console.error('Failed to delete draft:', error);
        }
      }
      
      toast.success('Booking created successfully!');
      router.push('/admin/bookings');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      if (error.response?.status === 409) {
        setErrorModal({
          title: 'Vehicle No Longer Available',
          message: 'This vehicle was just booked by someone else for the selected dates.',
          actions: [
            {
              label: 'Choose Different Dates',
              onClick: () => {
                setErrorModal(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
              variant: 'primary'
            },
            {
              label: 'Choose Different Vehicle',
              onClick: () => {
                setErrorModal(null);
                setSelectedVehicle(null);
                searchAvailableVehicles();
              },
              variant: 'secondary'
            }
          ]
        });
      } else if (error.response?.status === 400) {
        const validationErrors = error.response.data.errors || [];
        setErrorModal({
          title: 'Invalid Booking Information',
          message: validationErrors.length > 0
            ? validationErrors.map((e: any) => `• ${e.param}: ${e.msg}`).join('\n')
            : error.response.data.error || 'Please check your information and try again.',
          actions: [{ label: 'OK', onClick: () => setErrorModal(null), variant: 'primary' }]
        });
      } else {
        setErrorModal({
          title: 'Booking Failed',
          message: error.response?.data?.error || error.message || 'An unexpected error occurred.',
          actions: [
            {
              label: 'Retry',
              onClick: () => {
                setErrorModal(null);
                handleSubmit();
              },
              variant: 'primary'
            },
            { label: 'Cancel', onClick: () => setErrorModal(null), variant: 'secondary' }
          ]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !vehicles.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Booking</h1>
            {lastSaved && (
              <p className="text-sm text-gray-600 mt-1">
                {isSavingDraft ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving draft...
                  </span>
                ) : (
                  `Last saved: ${lastSaved.toLocaleTimeString()}`
                )}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraftAndExit}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Save Draft & Exit
            </button>
            <button
              onClick={() => router.push('/admin/bookings')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              ← Back to Bookings
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 shadow-sm -mx-6 px-6 py-4 mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                { num: 1, name: 'Dates & Duration', done: pickupDate && dropoffDate && rentalDays > 0 },
                { num: 2, name: 'Select Vehicle', done: !!selectedVehicle },
                { num: 3, name: 'Locations & Extras', done: pickupLocationId && dropoffLocationId },
                { num: 4, name: 'Customer Info', done: customerData.first_name && customerData.email },
                { num: 5, name: 'Review & Submit', done: false }
              ].map((step, idx) => (
                <div key={step.num} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-bold ${
                    step.done 
                      ? 'bg-orange-600 border-orange-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {step.done ? '✓' : step.num}
                  </div>
                  
                  <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
                    step.done ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </span>
                  
                  {idx < 4 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      step.done ? 'bg-orange-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 1: Date Selection */}
        <div ref={step1Ref} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Step 1: Select Rental Dates</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pickup Date & Time */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">Pickup</h3>
              
              {/* Pickup Date */}
              <div ref={pickupDateRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPickupDatePicker(!showPickupDatePicker)}
                  className={`w-full px-4 py-3 rounded-lg text-left focus:ring-2 focus:ring-orange-500 bg-white hover:border-orange-400 transition-colors ${
                    pickupDate 
                      ? 'border border-orange-500 focus:border-orange-500' 
                      : 'border-2 border-gray-300 focus:border-orange-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={pickupDate ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                      {pickupDate ? pickupDate.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Select pickup date'}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </button>
                
                {showPickupDatePicker && (
                  <div className="absolute z-50 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl">
                    <DatePicker
                      selected={pickupDate}
                      onChange={(date: Date | null) => {
                        setPickupDate(date);
                        setShowPickupDatePicker(false);
                        if (dropoffDate && date && dropoffDate <= date) {
                          setDropoffDate(null);
                        }
                      }}
                      minDate={new Date()}
                      inline
                      calendarClassName="custom-calendar"
                    />
                  </div>
                )}
              </div>

              {/* Pickup Time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                
                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {['08:00', '09:00', '10:00', '12:00', '14:00', '17:00', '18:00', '20:00'].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setPickupTime(time)}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                        pickupTime === time 
                          ? 'border-orange-600 bg-orange-50 text-orange-900 font-semibold' 
                          : 'border-gray-300 hover:border-orange-400 text-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                
                {/* Custom Time */}
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-gray-600">Or custom:</span>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      !['08:00', '09:00', '10:00', '12:00', '14:00', '17:00', '18:00', '20:00'].includes(pickupTime)
                        ? 'border border-orange-500 focus:border-orange-500'
                        : 'border-2 border-gray-300 focus:border-orange-500'
                    }`}
                  />
                </div>
              </div>

              {pickupDate && (
                <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-900">
                    <strong className="text-orange-600">Selected:</strong><br />
                    {pickupDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {pickupTime}
                  </p>
                </div>
              )}
            </div>

            {/* Dropoff Date & Time */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">Dropoff</h3>
              
              {/* Dropoff Date */}
              <div ref={dropoffDateRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!pickupDate) {
                      toast.error('Please select pickup date first');
                      return;
                    }
                    setShowDropoffDatePicker(!showDropoffDatePicker);
                  }}
                  disabled={!pickupDate}
                  className={`w-full px-4 py-3 rounded-lg text-left focus:ring-2 focus:ring-orange-500 bg-white transition-colors ${
                    !pickupDate 
                      ? 'border-2 border-gray-200 cursor-not-allowed opacity-50' 
                      : dropoffDate
                      ? 'border border-orange-500 hover:border-orange-400 focus:border-orange-500'
                      : 'border-2 border-gray-300 hover:border-orange-400 focus:border-orange-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={dropoffDate ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                      {dropoffDate ? dropoffDate.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Select dropoff date'}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </button>
                
                {showDropoffDatePicker && pickupDate && (
                  <div className="absolute z-50 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl">
                    <DatePicker
                      selected={dropoffDate}
                      onChange={(date: Date | null) => {
                        setDropoffDate(date);
                        setShowDropoffDatePicker(false);
                      }}
                      minDate={new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000)}
                      inline
                      calendarClassName="custom-calendar"
                    />
                  </div>
                )}
              </div>

              {/* Dropoff Time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                
                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-2">
                  {['08:00', '09:00', '10:00', '12:00', '14:00', '17:00', '18:00', '20:00'].map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setDropoffTime(time)}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                        dropoffTime === time 
                          ? 'border-orange-600 bg-orange-50 text-orange-900 font-semibold' 
                          : 'border-gray-300 hover:border-orange-400 text-gray-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                
                {/* Custom Time */}
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-gray-600">Or custom:</span>
                  <input
                    type="time"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                    className={`px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      !['08:00', '09:00', '10:00', '12:00', '14:00', '17:00', '18:00', '20:00'].includes(dropoffTime)
                        ? 'border border-orange-500 focus:border-orange-500'
                        : 'border-2 border-gray-300 focus:border-orange-500'
                    }`}
                  />
                </div>
              </div>

              {dropoffDate && (
                <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-900">
                    <strong className="text-orange-600">Selected:</strong><br />
                    {dropoffDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {dropoffTime}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rental Duration Summary */}
          {rentalDays > 0 && (
            <div className="mt-6 p-6 bg-white rounded-lg border-2 border-gray-300 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">Rental Duration</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                  </p>
                </div>
                <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* Live Search Status Indicator */}
          {pickupDate && dropoffDate && rentalDays > 0 && (
            <div className="mt-6 p-4 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
              {searchingVehicles ? (
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-orange-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-gray-900 font-medium">Searching available vehicles...</span>
                </div>
              ) : vehicles.length > 0 ? (
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-900 font-medium">
                    Found {vehicles.length} available vehicle{vehicles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-gray-900 font-medium">No vehicles available for these dates</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Vehicle Selection */}
        {vehicles.length > 0 && (
          <div ref={step2Ref} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Step 2: Select Vehicle ({vehicles.length} available)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedVehicle?.id === vehicle.id
                      ? 'border-orange-500 ring-1 ring-orange-400'
                      : 'border-gray-300 hover:border-orange-400'
                  }`}
                >
                  {vehicle.images && vehicle.images[0] && (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-bold text-lg">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">{vehicle.year}</p>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p>• {vehicle.category}</p>
                    <p>• {vehicle.seats} Seats</p>
                    <p>• {vehicle.transmission}</p>
                    <p>• {vehicle.fuel_type}</p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">Daily Rate:</p>
                    <p className="text-2xl font-bold text-orange-600">
                      €{vehicle.base_price_daily}
                    </p>
                    {rentalDays > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Total: €{(vehicle.base_price_daily * rentalDays).toFixed(2)} for {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {vehicle.subunits && vehicle.subunits.length > 0 && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      {vehicle.subunits.length} unit{vehicle.subunits.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Locations & Extras */}
        {selectedVehicle && (
          <div ref={step3Ref} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Step 3: Select Locations & Extras</h2>
            
            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={pickupLocationId}
                  onChange={(e) => setPickupLocationId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select pickup location</option>
                  {allLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dropoff Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={dropoffLocationId}
                  onChange={(e) => setDropoffLocationId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select dropoff location</option>
                  {allLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extras */}
            {allExtras.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Add Extras (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allExtras.map((extra) => {
                    const isSelected = selectedExtras.some((e) => e.id === extra.id);
                    const selectedExtra = selectedExtras.find((e) => e.id === extra.id);
                    
                    return (
                      <div
                        key={extra.id}
                        className={`border rounded-lg p-4 ${
                          isSelected ? 'border-orange-600 bg-orange-50' : 'border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{extra.name}</h4>
                            {extra.description && (
                              <p className="text-sm text-gray-600 mt-1">{extra.description}</p>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleExtraToggle(extra.id)}
                            className="mt-1 ml-2"
                          />
                        </div>
                        <p className="text-orange-600 font-semibold">
                          €{extra.price} / {extra.price_type.replace('_', ' ')}
                        </p>
                        {isSelected && (
                          <div className="mt-3">
                            <label className="block text-sm text-gray-600 mb-1">Quantity:</label>
                            <input
                              type="number"
                              min="1"
                              value={selectedExtra?.quantity || 1}
                              onChange={(e) =>
                                handleExtraQuantityChange(extra.id, parseInt(e.target.value) || 1)
                              }
                              className="w-full px-3 py-1 border border-gray-300 rounded"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Customer Information */}
        {selectedVehicle && pickupLocationId && dropoffLocationId && (
          <div ref={step4Ref} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Step 4: Customer Information</h2>
            
            {/* Customer Search */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Existing Customer (Optional)
              </label>
              <CustomerSearch 
                onSelect={(customer) => {
                  setCustomerData({
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    email: customer.email,
                    phone: customer.phone,
                    date_of_birth: customer.date_of_birth || '',
                    license_number: customer.license_number || '',
                    license_country: customer.license_country || '',
                    license_expiry: customer.license_expiry || '',
                    address: customer.address || '',
                    city: customer.city || '',
                    country: customer.country || ''
                  });
                  toast.success('Customer information loaded');
                }}
              />
              <p className="text-xs text-gray-600 mt-2">
                Or fill in new customer information below
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerData.first_name}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, first_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerData.last_name}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, last_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={customerData.date_of_birth}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, date_of_birth: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  value={customerData.license_number}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, license_number: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Country
                </label>
                <input
                  type="text"
                  value={customerData.license_country}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, license_country: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Expiry
                </label>
                <input
                  type="date"
                  value={customerData.license_expiry}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, license_expiry: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={customerData.address}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, address: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={customerData.city}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={customerData.country}
                  onChange={(e) =>
                    setCustomerData({ ...customerData, country: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Any special requests or notes for this booking..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Price Summary & Submit */}
        {selectedVehicle && pickupLocationId && dropoffLocationId && (
          <div ref={step5Ref} className="bg-white rounded-lg shadow-md p-6 sticky bottom-0 border-2 border-gray-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Booking Summary</h2>
                  <button
                    type="button"
                    onClick={() => setIsSummaryMinimized(!isSummaryMinimized)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isSummaryMinimized ? 'Expand summary' : 'Minimize summary'}
                  >
                    <svg 
                      className={`w-5 h-5 text-gray-600 transition-transform ${isSummaryMinimized ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
                {!isSummaryMinimized && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Vehicle:</span>
                    <span className="font-semibold">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Duration:</span>
                    <span className="font-semibold">{rentalDays} day{rentalDays !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Base Price:</span>
                    <span className="font-semibold">€{basePrice.toFixed(2)}</span>
                  </div>
                  {extrasPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Extras:</span>
                      <span className="font-semibold">€{extrasPrice.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Coupon Code Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coupon Code (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="SUMMER2024"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        type="button"
                        onClick={validateCouponCode}
                        disabled={!couponCode}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-red-600 text-xs mt-1">{couponError}</p>}
                    {appliedCoupon && (
                      <p className="text-orange-600 text-xs mt-1 flex items-center gap-1 font-medium">
                        ✓ Coupon "{appliedCoupon.code}" applied: -
                        {appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}%` 
                          : `€${appliedCoupon.discount_value}`}
                      </p>
                    )}
                  </div>
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-orange-600">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        -€{(appliedCoupon.discount_type === 'percentage' 
                          ? (basePrice + extrasPrice) * (appliedCoupon.discount_value / 100) 
                          : appliedCoupon.discount_value).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {/* Manual Price Adjustments */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowManualAdjustments(!showManualAdjustments)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      {showManualAdjustments ? '▼' : '▶'} Manual Price Adjustments
                    </button>
                    
                    {showManualAdjustments && (
                      <div className="mt-3 space-y-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Discount (€)
                          </label>
                          <input
                            type="number"
                            value={manualDiscount}
                            onChange={(e) => setManualDiscount(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Fee (€)
                          </label>
                          <input
                            type="number"
                            value={manualFee}
                            onChange={(e) => setManualFee(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for Adjustment <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={priceAdjustmentReason}
                            onChange={(e) => setPriceAdjustmentReason(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="e.g., Repeat customer discount"
                            required={manualDiscount > 0 || manualFee > 0}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {manualDiscount > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Manual Discount:</span>
                      <span className="font-semibold">-€{manualDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {manualFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Additional Fee:</span>
                      <span className="font-semibold">+€{manualFee.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t-2 border-gray-300 pt-2 text-xl">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-orange-600">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                )}
              </div>
              <div>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-lg shadow-lg"
                >
                  {loading ? 'Creating Booking...' : 'Create Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Modal */}
        {errorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{errorModal.title}</h3>
              <p className="text-gray-700 mb-6 whitespace-pre-line">{errorModal.message}</p>
              
              <div className="flex gap-3">
                {errorModal.actions?.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold ${
                      action.variant === 'primary'
                        ? 'bg-orange-600 text-white hover:bg-orange-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

