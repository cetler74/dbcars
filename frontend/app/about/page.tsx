'use client';

import Image from 'next/image';

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-about.jpg"
            alt="Luxury cars on scenic road"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
              About Us
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              The signature standard in luxury car rentals across Morocco
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white">
        {/* Section 1 – Brand story (two containers: left text, right photo) */}
        <section className="pt-10 md:pt-14 lg:pt-18 pb-2 md:pb-3 lg:pb-4 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-12 flex flex-col md:flex-row items-center gap-10 lg:gap-14">
            {/* Left container: text only */}
            <div className="w-full md:w-1/2 space-y-6">
              <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-gray-500">
                DB Luxury Cars · Morocco
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900">
                Ultra‑luxury mobility for Morocco&apos;s most remarkable journeys.
              </h2>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                Based in Morocco, DB Luxury Cars curates a hand‑picked fleet of luxury sedans, SUVs,
                and supercars for guests who expect precision, discretion, and effortless service
                from the moment they land.
              </p>
            </div>

            {/* Right container: photo only */}
            <div className="w-full md:w-1/2 relative h-64 md:h-72 lg:h-[340px] rounded-3xl overflow-hidden">
              <Image
                src="/hero-cars.jpg"
                alt="Luxury cars driving through Morocco"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
          </div>
        </section>


        {/* Section 2 – Cinematic fleet strip (full-width, no band background) */}
        <section className="pt-1 pb-10 md:pt-2 md:pb-11">
          <div className="container mx-auto px-4 md:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="relative h-52 md:h-64 rounded-3xl overflow-hidden">
              <Image
                src="/category-images/luxury-sedans.png"
                alt="Luxury sedan in Morocco"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gray-200">City lights</p>
                <p className="text-sm md:text-base font-medium text-white">
                  Discreet arrivals for boardrooms, rooftop dinners, and late‑night flights.
                </p>
              </div>
            </div>
            <div className="relative h-52 md:h-64 rounded-3xl overflow-hidden">
              <Image
                src="/category-images/suvs.png"
                alt="Luxury SUV in Morocco"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gray-200">Coast & desert</p>
                <p className="text-sm md:text-base font-medium text-white">
                  SUVs and 4x4s tailored for Morocco&apos;s coastal roads and desert escapes.
                </p>
              </div>
            </div>
            <div className="relative h-52 md:h-64 rounded-3xl overflow-hidden">
              <Image
                src="/category-images/supercars.png"
                alt="Supercar in Morocco"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gray-200">Signature drives</p>
                <p className="text-sm md:text-base font-medium text-white">
                  Statement supercars reserved for the moments that need to be unforgettable.
                </p>
              </div>
            </div>
          </div>
        </section>


      </main>
    </>
  );
}

