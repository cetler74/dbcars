'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getVehicles, getLocations } from '@/lib/api';
import VehicleCard from '@/components/VehicleCard';
import ReviewCarousel from '@/components/ReviewCarousel';

// Car brand logos configuration
// Supports multiple image formats: .png, .jpg, .jpeg, .svg, .webp
const carBrands = [
  { name: 'Bugatti', logo: '/logos/bugatti.png' },
  { name: 'Pagani', logo: '/logos/pagani.png' },
  { name: 'Koenigsegg', logo: '/logos/koenigsegg.png' },
  { name: 'McLaren', logo: '/logos/mclaren.png' },
  { name: 'Rolls-Royce', logo: '/logos/rolls-royce.png' },
  { name: 'Lamborghini', logo: '/logos/lamborghini.png' },
  { name: 'Ferrari', logo: '/logos/ferrari.png' },
  { name: 'Mercedes-Benz', logo: '/logos/mercedes-benz.png' },
  { name: 'Aston Martin', logo: '/logos/aston-martin.png' },
];

// Helper function to try multiple image formats
function getLogoPath(baseName: string): string {
  const formats = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  // Default to .png, but the component will try to load it
  return `/logos/${baseName}.png`;
}

// Brand Logo Component with fallback to text
function BrandLogo({ brand, isMercedes }: { brand: { name: string; logo: string }; isMercedes?: boolean }) {
  const [showImage, setShowImage] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Try multiple image formats
    const formats = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const basePath = brand.logo.replace(/\.(png|jpg|jpeg|svg|webp)$/i, '');
    
    let formatIndex = 0;
    
    const tryLoadImage = () => {
      if (formatIndex >= formats.length) {
        setShowImage(false);
        return;
      }
      
      const testPath = `${basePath}${formats[formatIndex]}`;
      const img = new window.Image();
      
      img.onload = () => {
        setImageSrc(testPath);
        setShowImage(true);
      };
      
      img.onerror = () => {
        formatIndex++;
        tryLoadImage();
      };
      
      img.src = testPath;
    };
    
    tryLoadImage();
  }, [brand.logo]);

  return (
    <div className={`flex items-center justify-center h-24 md:h-32 w-48 md:w-56 opacity-80 hover:opacity-100 transition-opacity flex-shrink-0 ${isMercedes ? '-mr-2 md:-mr-3' : ''}`}>
      {showImage && imageSrc ? (
        <div className="relative w-full h-full max-w-full">
          <img
            ref={imgRef}
            src={imageSrc}
            alt={brand.name}
            className="object-contain w-full h-full"
            onError={() => setShowImage(false)}
          />
        </div>
      ) : (
        <span className="text-white text-lg md:text-xl font-semibold tracking-wider text-center whitespace-nowrap">
          {brand.name.toUpperCase()}
        </span>
      )}
    </div>
  );
}

const faqs = [
  {
    question: 'What documents do I need to rent?',
    answer:
      'You need a valid driver\'s license (held for at least 2 years), International Driving Permit (for non-Moroccan licenses), passport, and a major credit card in the driver\'s name.',
  },
  {
    question: 'What is the minimum age to rent?',
    answer:
      'The minimum age is 25 years old for all luxury vehicles. Some exotic supercars may require drivers to be 30+ with additional experience.',
  },
  {
    question: 'Do you offer delivery service?',
    answer:
      'Yes, we provide complimentary delivery within Casablanca, Marrakech, Rabat, and Fez city centers. Airport delivery is available for an additional fee of €50-150 depending on location.',
  },
  {
    question: 'What is included in the rental price?',
    answer:
      'All rentals include comprehensive insurance, 24/7 roadside assistance, GPS navigation, and basic cleaning. Fuel and any traffic violations are the customer\'s responsibility.',
  },
  {
    question: 'How much is the security deposit?',
    answer:
      'Security deposits vary by vehicle category:\n\n• Luxury vehicles: €1,000\n• Super luxury: €2,500\n• Exotic/Supercars: €5,000\n\nThe deposit is held on your credit card and released 7-14 days after return.',
  },
  {
    question: 'Can I drive to other countries?',
    answer:
      'No, our vehicles must remain within Morocco. Cross-border travel to Spain, Algeria, or other countries is not permitted and will void insurance coverage.',
  },
];

const blogPosts = [
  {
    id: 1,
    title: 'From Desert Dunes to Mountain Peaks',
    excerpt: 'Discover the perfect routes for your luxury adventure across Morocco\'s diverse landscapes.',
    image: '/blog-1.jpg',
    date: '2025-01-15',
  },
  {
    id: 2,
    title: 'Navigating Morocco\'s Roads',
    excerpt: 'Morocco has always been a land of contrasts – where ancient traditions meet modern sophistication, where golden sand dunes touch snow-capped...',
    image: '/blog-2.jpg',
    date: '2025-01-10',
  },
  {
    id: 3,
    title: 'Experience Morocco\'s Magic',
    excerpt: 'Morocco has always been a land of contrasts – where ancient traditions meet modern sophistication, where golden sand dunes touch snow-capped...',
    image: '/blog-3.jpg',
    date: '2025-01-05',
  },
  {
    id: 4,
    title: 'The Art of Luxury',
    excerpt: 'Morocco\'s diverse landscapes demand more than just any vehicle – they call for the perfect marriage of luxury, performance, and practicality....',
    image: '/blog-4.jpg',
    date: '2025-01-01',
  },
];

export default function Home() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [videoError, setVideoError] = useState(false);
  const [showReturnLocation, setShowReturnLocation] = useState(false);
  const [searchForm, setSearchForm] = useState({
    pickup_location_id: '',
    dropoff_location_id: '',
    pickup_date: null as Date | null,
    dropoff_date: null as Date | null,
  });

  // Save to localStorage whenever search form changes
  useEffect(() => {
    if (searchForm.pickup_location_id || searchForm.pickup_date || searchForm.dropoff_date) {
      const searchData = {
        pickup_location_id: searchForm.pickup_location_id,
        pickup_date: searchForm.pickup_date ? searchForm.pickup_date.toISOString() : null,
        dropoff_date: searchForm.dropoff_date ? searchForm.dropoff_date.toISOString() : null,
        dropoff_location_id: searchForm.dropoff_location_id || null,
      };
      localStorage.setItem('carSearchData', JSON.stringify(searchData));
    }
  }, [searchForm.pickup_location_id, searchForm.pickup_date, searchForm.dropoff_date, searchForm.dropoff_location_id]);

  useEffect(() => {
    // Load data asynchronously without blocking render
    loadInitialData().catch(err => {
      console.error('Failed to load initial data:', err);
    });
  }, []);

  useEffect(() => {
    // Ensure video plays
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
        setVideoError(true);
      });
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const [vehiclesData, locationsData] = await Promise.all([
        getVehicles().catch(err => {
          console.error('Error loading vehicles:', err);
          return [];
        }),
        getLocations().catch(err => {
          console.error('Error loading locations:', err);
          return [];
        }),
      ]);
      setVehicles(vehiclesData.slice(0, 12));
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays to prevent hanging
      setVehicles([]);
      setLocations([]);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage for persistence across pages
    if (searchForm.pickup_location_id || searchForm.pickup_date || searchForm.dropoff_date) {
      const searchData = {
        pickup_location_id: searchForm.pickup_location_id,
        pickup_date: searchForm.pickup_date ? searchForm.pickup_date.toISOString() : null,
        dropoff_date: searchForm.dropoff_date ? searchForm.dropoff_date.toISOString() : null,
        dropoff_location_id: searchForm.dropoff_location_id || null,
      };
      localStorage.setItem('carSearchData', JSON.stringify(searchData));
    }
    
    const params = new URLSearchParams();
    
    if (searchForm.pickup_location_id) {
      params.append('location', searchForm.pickup_location_id);
    }
    if (searchForm.pickup_date) {
      params.append('available_from', searchForm.pickup_date.toISOString().split('T')[0]);
    }
    if (searchForm.dropoff_date) {
      params.append('available_to', searchForm.dropoff_date.toISOString().split('T')[0]);
    }
    
    router.push(`/cars?${params.toString()}`);
  };

  return (
    <>
      {/* Hero Section with Video Background and Search Form - Separate from logo section */}
      <div className="relative w-full" style={{ marginTop: '-120px', paddingTop: '120px' }}>
        {/* Hero Section - Reduced size, extends behind header */}
        <section className="relative w-full overflow-hidden bg-black" style={{ marginTop: '-120px', paddingTop: '120px', height: '88vh', minHeight: '700px' }}>
        {/* Video Background - Extends behind header */}
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-0"
            style={{ top: '-320px', height: 'calc(100% + 420px)' }}
            onError={(e) => {
              const video = e.target as HTMLVideoElement;
              console.error('Video error:', {
                error: video.error,
                networkState: video.networkState,
                readyState: video.readyState,
                src: video.currentSrc || video.src,
              });
              setVideoError(true);
            }}
            onLoadedData={() => {
              // Video loaded successfully, try to play
              if (videoRef.current) {
                videoRef.current.play().catch((error) => {
                  console.error('Error playing video after load:', error);
                });
              }
            }}
          >
            <source src="/WhatsApp Video 2025-11-14 at 18.55.53.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {/* Fallback gradient background if video doesn't load */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0" style={{ top: '-320px', height: 'calc(100% + 420px)' }} />
        )}
        <div className="absolute inset-0 bg-black/40 z-10" style={{ top: '-320px', height: 'calc(100% + 420px)' }} />
        
        {/* Content Overlay - Positioned to be visible below header */}
        <div className="absolute inset-0 z-20 flex items-center px-4 md:px-8 lg:px-12" style={{ top: '80px', height: 'calc(100% - 80px)' }}>
          <div className="container mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Side - Title */}
              <div className="text-white">
                <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-none">
                  The Award-Winning Choice
                </h2>
              </div>

              {/* Right Side - Search Form Overlay */}
              <div className="w-full">
                <div className="glass-form-container">
                  <form
                    onSubmit={handleSearchSubmit}
                    className="glass-form-box p-6 md:p-8 space-y-5"
                  >
                    {/* Content wrapper */}
                    <div className="relative z-10">
                  {/* Location Section */}
                  <div>
                    <label className="block text-sm font-semibold text-white mb-1.5 uppercase tracking-wide">
                      Location
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <select
                        value={searchForm.pickup_location_id}
                        onChange={(e) =>
                          setSearchForm((prev) => ({
                            ...prev,
                            pickup_location_id: e.target.value,
                          }))
                        }
                        className="w-full pl-12 pr-32 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                      >
                        <option value="">Select pickup location</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} - {loc.city}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowReturnLocation(!showReturnLocation)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-orange-400 hover:text-orange-300 font-medium underline"
                      >
                        + Different return
                      </button>
                    </div>
                    {showReturnLocation && (
                      <div className="mt-3">
                        <select
                          value={searchForm.dropoff_location_id}
                          onChange={(e) =>
                            setSearchForm((prev) => ({
                              ...prev,
                              dropoff_location_id: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                        >
                          <option value="">Select return location</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} - {loc.city}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Date Section */}
                  <div className="mt-5">
                    <label className="block text-sm font-semibold text-white mb-1 uppercase tracking-wide">
                      Dates
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Pick-up Date */}
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <DatePicker
                          selected={searchForm.pickup_date}
                          onChange={(date: Date | null) =>
                            setSearchForm((prev) => ({ ...prev, pickup_date: date }))
                          }
                          minDate={new Date()}
                          className="w-full pl-12 pr-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                          dateFormat="MMM dd, yyyy"
                          placeholderText="Pickup date"
                          withPortal
                        />
                      </div>

                      {/* Return Date */}
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 z-10">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <DatePicker
                          selected={searchForm.dropoff_date}
                          onChange={(date: Date | null) =>
                            setSearchForm((prev) => ({ ...prev, dropoff_date: date }))
                          }
                          minDate={searchForm.pickup_date || new Date()}
                          className="w-full pl-12 pr-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:border focus:border-white bg-[#3a3a3a] text-white font-medium transition-all"
                          dateFormat="MMM dd, yyyy"
                          placeholderText="Return date"
                          withPortal
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      className="text-sm text-white/70 hover:text-white font-medium underline transition-colors"
                    >
                      Apply business rate
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300"
                      style={{
                        boxShadow: 'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0px 3px 6px rgba(255, 255, 255, 0.6), inset 0px -3px 6px rgba(0, 0, 0, 0.8), 0px 0px 8px rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)';
                      }}
                    >
                      Show Vehicles
                    </button>
                  </div>
                  </div>
                </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>

      {/* Car Brands Marquee Section - Separate section - 15vh */}
      <section className="relative bg-black h-[15vh] overflow-hidden border-t border-gray-800">
        <div className="relative w-full h-full flex items-center">
          {/* Scrolling Logos Container */}
          <div className="flex animate-scroll">
            {/* First set of logos */}
            <div className="flex items-center px-8 flex-shrink-0" style={{ gap: '0.5rem' }}>
              {carBrands.map((brand, index) => (
                <BrandLogo key={`brand-1-${index}`} brand={brand} isMercedes={brand.name === 'Mercedes-Benz'} />
              ))}
            </div>
            {/* Duplicate set for seamless loop */}
            <div className="flex items-center px-8 flex-shrink-0" style={{ gap: '0.5rem' }}>
              {carBrands.map((brand, index) => (
                <BrandLogo key={`brand-2-${index}`} brand={brand} isMercedes={brand.name === 'Mercedes-Benz'} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search by Category Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-black">
            Search by Category
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto text-lg">
            Explore our premium vehicle collection by category
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 max-w-[90rem] mx-auto scale-105 md:scale-115">
            {/* Luxury Sedans */}
            <Link
              href="/cars?category=luxury-sedans"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/luxury-sedans.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center group-hover:opacity-0 transition-opacity duration-300">Luxury Sedans</h3>
                <p className="text-sm text-gray-200 text-center mt-2 group-hover:opacity-0 transition-opacity duration-300">Premium Comfort</p>
              </div>
            </Link>

            {/* Sports Cars */}
            <Link
              href="/cars?category=sports-cars"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/sports-cars.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center group-hover:opacity-0 transition-opacity duration-300">Sports Cars</h3>
                <p className="text-sm text-gray-200 text-center mt-2 group-hover:opacity-0 transition-opacity duration-300">High Performance</p>
              </div>
            </Link>

            {/* SUVs */}
            <Link
              href="/cars?category=suvs"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/suvs.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center group-hover:opacity-0 transition-opacity duration-300">SUVs</h3>
                <p className="text-sm text-gray-200 text-center mt-2 group-hover:opacity-0 transition-opacity duration-300">Spacious & Powerful</p>
              </div>
            </Link>

            {/* Supercars */}
            <Link
              href="/cars?category=supercars"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/supercars.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center group-hover:opacity-0 transition-opacity duration-300">Supercars</h3>
                <p className="text-sm text-gray-200 text-center mt-2 group-hover:opacity-0 transition-opacity duration-300">Ultimate Performance</p>
              </div>
            </Link>

            {/* Economic */}
            <Link
              href="/cars?category=economic"
              className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{
                backgroundImage: 'url("/category-images/economic.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-all duration-300"></div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 text-white relative z-10">
                <h3 className="text-lg md:text-xl font-bold text-center group-hover:opacity-0 transition-opacity duration-300">Economic</h3>
                <p className="text-sm text-gray-200 text-center mt-2 group-hover:opacity-0 transition-opacity duration-300">Affordable & Efficient</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-24" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side: Text Content */}
            <div className="flex-1">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
                Who we are
              </h2>
              <p className="text-white text-base md:text-lg leading-relaxed mb-8">
                International Car® is a rent a car company based in Portugal. With over 20 years of experience, our main goal is to provide the best possible car rental experience for our customers. Whether behind the wheel of our vehicles or through the personalized, clear and transparent service we offer, we do so with utmost joy and satisfaction.
              </p>
              <Link
                href="/about"
                className="inline-block bg-white text-black px-6 py-2.5 rounded-md font-semibold text-sm md:text-base hover:bg-gray-100 transition-all duration-300 no-underline shadow-sm hover:shadow-md"
                style={{ color: 'black' }}
              >
                COMPANY
              </Link>
            </div>
            
            {/* Right Side: Car Image */}
            <div className="flex-1 flex justify-end">
              <div className="relative w-full max-w-lg h-auto">
                <Image
                  src="/mercedes-c-class.png"
                  alt="Mercedes-Benz C-Class Estate"
                  width={800}
                  height={600}
                  className="object-contain w-full h-auto"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <div className="bg-white py-12"></div>
      <ReviewCarousel />

      {/* Rest of content */}
      <div className="w-full bg-white">
      {/* Discover Morocco's Hidden Gems */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 text-black">
            Discover Morocco&apos;s Hidden Gems
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto text-lg">
            Premium luxury experiences across Morocco&apos;s most stunning destinations.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 max-w-5xl mx-auto">
            <span className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black">Luxury</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black">Style</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black">Comfort</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black">Elegance</span>
            <span className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black">Prestige</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 text-black">
            Have Questions? Check our Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-4xl mx-auto text-lg">
            Everything you need to know about renting luxury vehicles in Morocco. From booking procedures to driving requirements and insurance coverage.
          </p>
          
          <div className="max-w-5xl mx-auto space-y-6 mb-12">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl md:text-2xl font-semibold mb-4 text-black">
                  {index + 1}. {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/faq"
              className="inline-block bg-black text-white px-10 py-4 rounded-md font-semibold text-lg hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              VIEW MORE
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6 text-black">
            Discover the World in Style<br />
            <span className="text-gray-700">Luxury Travel Insights & Tips</span>
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-4xl mx-auto text-lg">
            From scenic drives to exclusive destinations, our blog brings you inspiration, tips, and stories to elevate every journey in true DB Luxury Cars fashion.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href="/blog"
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 block border border-gray-200 group"
              >
                <div className="relative w-full h-56 bg-gray-200 overflow-hidden">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                      <span className="text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3 text-black line-clamp-2 group-hover:text-gray-700 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-500">
                      Published on DB Luxury Cars Morocco Blog
                    </span>
                    <span className="text-black hover:text-gray-700 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
