'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getVehicles, getLocations } from '@/lib/api';

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
  const [searchForm, setSearchForm] = useState({
    pickup_location_id: '',
    dropoff_location_id: '',
    pickup_date: null as Date | null,
    dropoff_date: null as Date | null,
  });

  useEffect(() => {
    loadInitialData();
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
        getVehicles(),
        getLocations(),
      ]);
      setVehicles(vehiclesData.slice(0, 12));
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="w-full bg-white">
      {/* Hero Section with Video Background and Search Form */}
      <section className="relative w-full h-[85vh] min-h-[700px] overflow-hidden bg-black">
        {/* Video Background */}
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover z-0"
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
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0" />
        )}
        <div className="absolute inset-0 bg-black/40 z-10" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 z-20 flex items-center px-4 md:px-8 lg:px-12">
          <div className="container mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Side - Title */}
              <div className="text-white">
                <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 tracking-tight">
                  Explore Fleet
                </h2>
              </div>

              {/* Right Side - Search Form Overlay */}
              <div className="w-full">
                <form
                  onSubmit={handleSearchSubmit}
                  className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-6 md:p-8"
                >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Pick-up Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pick-up Location
                  </label>
                  <select
                    value={searchForm.pickup_location_id}
                    onChange={(e) =>
                      setSearchForm((prev) => ({
                        ...prev,
                        pickup_location_id: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} - {loc.city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Drop-off Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Drop-off Location
                  </label>
                  <select
                    value={searchForm.dropoff_location_id}
                    onChange={(e) =>
                      setSearchForm((prev) => ({
                        ...prev,
                        dropoff_location_id: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} - {loc.city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pick-up Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pick-up Date
                  </label>
                  <DatePicker
                    selected={searchForm.pickup_date}
                    onChange={(date: Date | null) =>
                      setSearchForm((prev) => ({ ...prev, pickup_date: date }))
                    }
                    minDate={new Date()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900"
                    dateFormat="MMM dd, yyyy"
                    placeholderText="Select date"
                  />
                </div>

                {/* Drop-off Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Drop-off Date
                  </label>
                  <DatePicker
                    selected={searchForm.dropoff_date}
                    onChange={(date: Date | null) =>
                      setSearchForm((prev) => ({ ...prev, dropoff_date: date }))
                    }
                    minDate={searchForm.pickup_date || new Date()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent bg-white text-gray-900"
                    dateFormat="MMM dd, yyyy"
                    placeholderText="Select date"
                  />
                </div>
              </div>

                  {/* Search Button */}
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="w-full bg-black text-white px-8 py-4 rounded-md font-semibold text-lg hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Search Cars
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative bg-black text-white py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Morocco&apos;s Ultimate Driving Experience<br />
              <span className="text-gray-300">Premium cars</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 text-gray-300 leading-relaxed max-w-3xl">
              Experience Morocco&apos;s breathtaking landscapes and vibrant culture from behind the wheel of the world&apos;s most prestigious vehicles. From the bustling streets of Casablanca to the majestic Atlas Mountains, discover luxury redefined.
            </p>
            <Link
              href="/cars"
              className="inline-block bg-white text-black px-10 py-4 rounded-md font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              EXPLORE FLEET
            </Link>
          </div>
        </div>
      </section>

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
  );
}
