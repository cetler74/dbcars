'use client';

import Image from 'next/image';

export default function CancellationPolicyPage() {
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
              Cancellation Policy
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Understanding our cancellation and refund procedures
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
              <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                At DB Luxury Cars, we understand that plans can change. This Cancellation Policy outlines the terms and conditions for canceling your vehicle rental reservation and the refunds that may apply.
              </p>
              <p className="text-gray-700 leading-relaxed">
                All cancellation requests must be made in writing via email or through our online booking system. Cancellations are effective from the date and time we receive your written request.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Standard Cancellation Policy</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Cancellation Timeframes and Refunds</h3>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">More than 48 Hours Before Pickup</h4>
                    <p className="text-gray-700 mb-2">
                      <strong>Refund:</strong> Full refund minus a 5% processing fee
                    </p>
                    <p className="text-sm text-gray-600">
                      You will receive 95% of your payment back. Processing fees cover administrative and payment processing costs.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">24-48 Hours Before Pickup</h4>
                    <p className="text-gray-700 mb-2">
                      <strong>Refund:</strong> 50% of the total rental amount
                    </p>
                    <p className="text-sm text-gray-600">
                      Due to the short notice, we can only refund half of your payment as we may have difficulty re-renting the vehicle.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Less than 24 Hours Before Pickup</h4>
                    <p className="text-gray-700 mb-2">
                      <strong>Refund:</strong> No refund
                    </p>
                    <p className="text-sm text-gray-600">
                      Cancellations made within 24 hours of the scheduled pickup time are not eligible for a refund, as we are unable to re-rent the vehicle on such short notice.
                    </p>
                  </div>

                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">No-Show (Failure to Pick Up)</h4>
                    <p className="text-gray-700 mb-2">
                      <strong>Refund:</strong> No refund
                    </p>
                    <p className="text-sm text-gray-600">
                      If you fail to pick up the vehicle at the scheduled time without prior notice, no refund will be provided.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">3. Special Circumstances</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3.1 Medical Emergencies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In case of a documented medical emergency preventing travel, we may offer a full refund or credit for future use, subject to verification. Please contact us as soon as possible with supporting documentation (medical certificate, hospital records, etc.).
              </p>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3.2 Flight Cancellations or Delays</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If your flight is canceled or significantly delayed due to circumstances beyond your control (weather, airline issues, etc.), we will work with you to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Modify your pickup time (subject to availability)</li>
                <li>Provide a credit for future use</li>
                <li>Offer a partial refund on a case-by-case basis</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Please provide documentation of the flight cancellation or delay when requesting a modification or refund.
              </p>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">3.3 Natural Disasters or Force Majeure</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In the event of natural disasters, pandemics, government restrictions, or other force majeure events that prevent travel, we will:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Offer a full refund or credit for future use</li>
                <li>Work with you to reschedule your rental</li>
                <li>Provide flexible options based on the circumstances</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">4. Early Return Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you return the vehicle earlier than the scheduled return date:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>No refund will be provided for unused rental days</li>
                <li>The rental period is charged based on the original booking dates</li>
                <li>Early returns do not qualify for partial refunds unless agreed upon in writing at the time of return</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                However, if you need to return early due to an emergency, please contact us, and we will review your situation on a case-by-case basis.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Modification of Bookings</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Instead of canceling, you may be able to modify your booking:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Date Changes:</strong> Free of charge if requested more than 48 hours before pickup (subject to availability)</li>
                <li><strong>Vehicle Changes:</strong> Subject to availability and price differences</li>
                <li><strong>Location Changes:</strong> May be possible, subject to availability and additional fees</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Contact us to discuss modification options before canceling your booking.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Refund Processing</h2>
              
              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">6.1 Processing Time</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Refunds will be processed within 7-14 business days from the date of cancellation approval. The actual time for the refund to appear in your account depends on your bank or credit card company's processing time.
              </p>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">6.2 Refund Method</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Refunds will be issued to the original payment method used for the booking:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Credit card refunds: Processed to the same card</li>
                <li>Bank transfer refunds: Processed to the original bank account</li>
                <li>Cash payments: Refunds may be issued via bank transfer or check</li>
              </ul>

              <h3 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">6.3 Currency</h3>
              <p className="text-gray-700 leading-relaxed">
                Refunds will be issued in the same currency as the original payment. Exchange rates and fees may apply if your bank processes the refund in a different currency.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Non-Refundable Items</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following items are non-refundable, regardless of cancellation timing:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Processing fees (if applicable)</li>
                <li>Insurance premiums (if purchased separately)</li>
                <li>Pre-purchased extras or add-ons that have been activated</li>
                <li>Special event or holiday surcharges</li>
                <li>Third-party booking platform fees (if booked through a third party)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Group Bookings and Special Events</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For group bookings (multiple vehicles) or special event rentals, different cancellation terms may apply. These will be clearly stated in your booking confirmation. Generally:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Group bookings may require a longer cancellation notice period (7-14 days)</li>
                <li>Special event bookings may have stricter cancellation policies</li>
                <li>Custom packages may have unique terms outlined in your agreement</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">9. How to Cancel</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                To cancel your booking, please use one of the following methods:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Online:</strong> Log into your account and cancel through the booking management system</li>
                <li><strong>Email:</strong> Send a cancellation request to bookings@dbluxurycars.com with your booking reference number</li>
                <li><strong>Phone:</strong> Call us at +212 XXX XXX XXX during business hours</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Please include your booking reference number and the reason for cancellation in your request.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Travel Insurance</h2>
              <p className="text-gray-700 leading-relaxed">
                We strongly recommend purchasing travel insurance that covers trip cancellations. This can provide additional protection beyond our cancellation policy, especially for unforeseen circumstances such as illness, family emergencies, or travel disruptions.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">11. Disputes and Appeals</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you believe your cancellation should qualify for a different refund amount due to special circumstances, please contact us with:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>A detailed explanation of your situation</li>
                <li>Supporting documentation (medical certificates, flight confirmations, etc.)</li>
                <li>Your booking reference number</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We will review your case and respond within 5-7 business days. All decisions are made at our discretion based on the circumstances and documentation provided.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For questions about cancellations or to request a cancellation, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>DB Luxury Cars</strong></p>
                <p className="text-gray-700 mb-2">Guéliz Marrakesh, Morocco 40000</p>
                <p className="text-gray-700 mb-2">Email: bookings@dbluxurycars.com</p>
                <p className="text-gray-700 mb-2">Phone: +212 XXX XXX XXX</p>
                <p className="text-gray-700 text-sm mt-4">
                  <strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM (GMT+1)
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

