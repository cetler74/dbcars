export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
              About Us
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Your trusted partner for luxury car rentals in Morocco
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl space-y-6 text-gray-700">
        <p className="text-lg">
          DB Luxury Cars is Morocco&apos;s premier luxury car rental service, offering an
          unparalleled selection of premium vehicles for discerning clients.
        </p>
        <p>
          With locations across Morocco&apos;s most beautiful cities, we provide access to the
          world&apos;s most prestigious automotive brands. From luxury sedans to exotic supercars,
          our fleet is meticulously maintained and ready to elevate your journey.
        </p>
        <p>
          Our commitment to excellence extends beyond our vehicles. We offer personalized service,
          comprehensive insurance coverage, and 24/7 roadside assistance to ensure your peace of
          mind throughout your rental experience.
        </p>
        <p>
          Whether you&apos;re exploring the vibrant streets of Casablanca, the historic medinas of
          Marrakech, or the scenic routes of the Atlas Mountains, DB Luxury Cars is your trusted
          partner for an unforgettable driving experience.
        </p>
      </div>
      </div>
    </>
  );
}

