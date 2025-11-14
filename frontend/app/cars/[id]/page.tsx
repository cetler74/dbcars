'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVehicle, checkAvailability } from '@/lib/api';
import Image from 'next/image';
import BookingForm from '@/components/BookingForm';

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  const loadVehicle = async () => {
    try {
      const data = await getVehicle(vehicleId);
      setVehicle(data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      router.push('/cars');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading vehicle details...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Vehicle not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="mb-6 text-gray-600 hover:text-gray-900"
      >
        ← Back to Cars
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vehicle Images */}
        <div>
          {vehicle.images && vehicle.images.length > 0 ? (
            <div className="space-y-4">
              <div className="relative w-full h-96 rounded-lg overflow-hidden">
                <Image
                  src={vehicle.images[0]}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                />
              </div>
              {vehicle.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {vehicle.images.slice(1, 5).map((image: string, index: number) => (
                    <div key={index} className="relative w-full h-24 rounded overflow-hidden">
                      <Image
                        src={image}
                        alt={`${vehicle.make} ${vehicle.model} ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No Image Available</span>
            </div>
          )}
        </div>

        {/* Vehicle Details */}
        <div>
          <h1 className="text-4xl font-bold mb-4">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="text-2xl text-gray-600 mb-6">{vehicle.year}</p>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-3xl font-bold text-gray-900">
                €{Number(vehicle.base_price_daily || 0).toFixed(2)}
              </span>
              <span className="text-gray-600">per day</span>
            </div>
            {vehicle.base_price_weekly && (
              <p className="text-gray-600">
                Weekly: €{Number(vehicle.base_price_weekly || 0).toFixed(2)}
              </p>
            )}
            {vehicle.base_price_monthly && (
              <p className="text-gray-600">
                Monthly: €{Number(vehicle.base_price_monthly || 0).toFixed(2)}
              </p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Category:</span>
                <span className="ml-2 font-medium capitalize">{vehicle.category}</span>
              </div>
              <div>
                <span className="text-gray-600">Seats:</span>
                <span className="ml-2 font-medium">{vehicle.seats}</span>
              </div>
              <div>
                <span className="text-gray-600">Transmission:</span>
                <span className="ml-2 font-medium capitalize">{vehicle.transmission}</span>
              </div>
              <div>
                <span className="text-gray-600">Fuel Type:</span>
                <span className="ml-2 font-medium capitalize">{vehicle.fuel_type}</span>
              </div>
              <div>
                <span className="text-gray-600">Minimum Age:</span>
                <span className="ml-2 font-medium">{vehicle.minimum_age} years</span>
              </div>
              <div>
                <span className="text-gray-600">Min Rental:</span>
                <span className="ml-2 font-medium">{vehicle.minimum_rental_days} day(s)</span>
              </div>
            </div>
          </div>

          {vehicle.features && vehicle.features.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <ul className="grid grid-cols-2 gap-2">
                {vehicle.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <span className="mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {vehicle.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
            </div>
          )}

          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="w-full bg-gray-900 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            {showBookingForm ? 'Hide Booking Form' : 'Book Now'}
          </button>
        </div>
      </div>

      {/* Booking Form */}
      {showBookingForm && (
        <div className="mt-12">
          <BookingForm vehicle={vehicle} />
        </div>
      )}
    </div>
  );
}

