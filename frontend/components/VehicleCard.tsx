import Link from 'next/link';
import Image from 'next/image';

interface VehicleCardProps {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    category: string;
    base_price_daily: number;
    images?: string[];
    description?: string;
  };
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Link
      href={`/cars/${vehicle.id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow block"
    >
      {vehicle.images && vehicle.images.length > 0 ? (
        <div className="relative w-full h-64">
          <Image
            src={vehicle.images[0]}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No Image</span>
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">
            {vehicle.make} {vehicle.model}
          </h3>
          <span className="text-sm text-gray-500 capitalize">{vehicle.category}</span>
        </div>
        <p className="text-gray-600 mb-4">{vehicle.year}</p>
        {vehicle.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {vehicle.description}
          </p>
        )}
        <p className="text-2xl font-bold text-gray-900">
          €{Number(vehicle.base_price_daily || 0).toFixed(2)}/day
        </p>
      </div>
    </Link>
  );
}

