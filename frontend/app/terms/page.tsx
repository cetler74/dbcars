'use client';

import Image from 'next/image';

export default function TermsConditionsPage() {
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
              Terms & Conditions
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              The terms and conditions governing your use of our services
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-12 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing or using the services of DB Luxury Cars ("we," "our," or "us"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access or use our services.
              </p>
              <p className="text-gray-700 leading-relaxed">
                These terms apply to all users of our website, mobile applications, and rental services. We reserve the right to modify these terms at any time, and such modifications will be effective immediately upon posting.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Rental Agreement</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">2.1 Eligibility</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To rent a vehicle from DB Luxury Cars, you must:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Be at least 21 years old (25 years old for certain luxury and supercar vehicles)</li>
                <li>Hold a valid driver's license for at least 2 years</li>
                <li>Provide a valid credit card in your name</li>
                <li>Meet our insurance and credit requirements</li>
                <li>Present valid identification (passport or national ID)</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">2.2 Booking and Payment</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>All bookings are subject to availability and confirmation</li>
                <li>A deposit is required at the time of booking</li>
                <li>Full payment is due before vehicle pickup</li>
                <li>We accept major credit cards and bank transfers</li>
                <li>Prices are subject to change without notice until booking is confirmed</li>
                <li>Additional fees may apply for extras, insurance, and damages</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">2.3 Rental Period</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The minimum rental period is 24 hours. Rental periods are calculated on a 24-hour basis. Late returns may incur additional charges.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">3. Vehicle Use and Restrictions</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3.1 Permitted Use</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The vehicle may only be used for personal or business purposes within Morocco. The vehicle must be driven only by authorized drivers listed on the rental agreement.
              </p>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3.2 Prohibited Uses</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following uses are strictly prohibited:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Driving under the influence of alcohol or drugs</li>
                <li>Racing, speed contests, or off-road driving (unless vehicle is specifically designed for off-road)</li>
                <li>Transporting illegal substances or contraband</li>
                <li>Using the vehicle for commercial passenger transport (taxi, ride-sharing)</li>
                <li>Towing or pushing other vehicles</li>
                <li>Driving outside of Morocco without prior written authorization</li>
                <li>Subleasing or transferring the vehicle to another person</li>
                <li>Using the vehicle for any illegal purpose</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">4. Insurance and Liability</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">4.1 Insurance Coverage</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                All rentals include basic third-party liability insurance as required by Moroccan law. Additional coverage options are available for purchase, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Collision Damage Waiver (CDW)</li>
                <li>Theft Protection (TP)</li>
                <li>Personal Accident Insurance (PAI)</li>
                <li>Full Coverage Insurance</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">4.2 Liability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The renter is responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>All damages to the vehicle, regardless of fault</li>
                <li>Loss or theft of the vehicle</li>
                <li>Loss or damage to vehicle accessories and equipment</li>
                <li>Traffic fines and violations incurred during the rental period</li>
                <li>Costs associated with vehicle recovery if abandoned</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Vehicle Condition and Inspection</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Before taking possession of the vehicle, you must inspect it for any existing damage and report it immediately. A vehicle condition report will be completed at pickup and return. You are responsible for returning the vehicle in the same condition, except for normal wear and tear.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Fuel Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                Vehicles are provided with a full tank of fuel and must be returned with a full tank. If the vehicle is returned with less fuel, you will be charged for the missing fuel plus a refueling service fee. We reserve the right to charge for fuel based on current market rates.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Breakdowns and Accidents</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">7.1 Breakdowns</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In case of a mechanical breakdown, contact us immediately. We will arrange for roadside assistance or a replacement vehicle, subject to availability. You are not responsible for mechanical failures due to manufacturing defects or normal wear.
              </p>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">7.2 Accidents</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In case of an accident:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Do not admit fault or liability</li>
                <li>Contact the police immediately</li>
                <li>Contact us as soon as possible</li>
                <li>Obtain names, addresses, and insurance details of all parties involved</li>
                <li>Take photographs of the scene and damage</li>
                <li>Complete an accident report form</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Cancellation and Refunds</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Please refer to our Cancellation Policy for detailed information about cancellations and refunds. Generally:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Cancellations made more than 48 hours before pickup: Full refund minus processing fees</li>
                <li>Cancellations made 24-48 hours before pickup: 50% refund</li>
                <li>Cancellations made less than 24 hours before pickup: No refund</li>
                <li>No-shows: No refund</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Security Deposit</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                A security deposit is required at the time of pickup. The deposit amount varies based on the vehicle category and will be held on your credit card. The deposit will be released within 7-14 business days after vehicle return, provided:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>The vehicle is returned in good condition</li>
                <li>No traffic fines or violations are pending</li>
                <li>No additional charges are due</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Late Returns and Extensions</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Late returns may result in additional charges. If you wish to extend your rental, contact us at least 24 hours before the scheduled return time. Extensions are subject to vehicle availability and approval.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">11. Prohibited Drivers</h2>
              <p className="text-gray-700 leading-relaxed">
                The following individuals are prohibited from driving our vehicles:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Persons under the minimum age requirement</li>
                <li>Persons without a valid driver's license</li>
                <li>Persons with suspended or revoked licenses</li>
                <li>Persons under the influence of alcohol or drugs</li>
                <li>Persons with certain medical conditions that may impair driving</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">12. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content on our website, including text, graphics, logos, images, and software, is the property of DB Luxury Cars or its content suppliers and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our written permission.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">13. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To the maximum extent permitted by law, DB Luxury Cars shall not be liable for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Personal injury or property damage not caused by our negligence</li>
                <li>Delays or cancellations due to circumstances beyond our control</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms and Conditions are governed by the laws of Morocco. Any disputes arising from these terms or our services shall be subject to the exclusive jurisdiction of the courts of Marrakesh, Morocco.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions about these Terms and Conditions, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>DB Luxury Cars</strong></p>
                <p className="text-gray-700 mb-2">Guéliz Marrakesh, Morocco 40000</p>
                <p className="text-gray-700 mb-2">Email: info@dbluxurycars.com</p>
                <p className="text-gray-700">Phone: +212 XXX XXX XXX</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

