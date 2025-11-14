'use client';

import { useState } from 'react';

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
      'Security deposits vary by vehicle category: Luxury vehicles: €1,000, Super luxury: €2,500, Exotic/Supercars: €5,000. The deposit is held on your credit card and released 7-14 days after return.',
  },
  {
    question: 'Can I drive to other countries?',
    answer:
      'No, our vehicles must remain within Morocco. Cross-border travel to Spain, Algeria, or other countries is not permitted and will void insurance coverage.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Frequently Asked Questions
      </h1>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold">{faq.question}</span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

