'use client';

import { useState } from 'react';
import Image from 'next/image';
import Toast from '@/components/Toast';
import { submitContactForm } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'success' | 'info' } | null>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });

      // Reset form
      setFormData({ name: '', email: '', message: '' });
      setErrors({});

      setToast({
        message: 'Thank you for your message! We will get back to you soon.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to send message. Please try again later.';
      setToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Get in touch with DB Luxury Cars for premium car rental services in Morocco
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white">
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
              {/* Left Column - Contact Information */}
              <div className="space-y-8">
                <div>
                  <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-gray-500 mb-4">
                    Get in Touch
                  </p>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-6">
                    We&apos;re here to help
                  </h2>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-8">
                    Whether you have questions about our luxury vehicles, need assistance with a booking,
                    or want to discuss a custom rental package, our team is ready to assist you.
                  </p>
                </div>

                {/* Contact Information Cards */}
                <div className="space-y-4">
                  {/* Address Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Guéliz Marrakesh<br />
                          Morocco 40000
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                        <a
                          href="tel:+212524123456"
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          +212 524 123456
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Email Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                        <a
                          href="mailto:info@dbluxurycars.com"
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          info@dbluxurycars.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div>
                <div className="glass-form-container">
                  <form onSubmit={handleSubmit} className="glass-form-box p-6 md:p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                        Send us a Message
                      </h2>
                      <p className="text-gray-300 text-sm md:text-base">
                        Fill out the form below and we&apos;ll get back to you as soon as possible.
                      </p>
                    </div>

                    {/* Name Field */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:ring-2 ${
                          errors.name
                            ? 'focus:ring-red-500 bg-red-900/20'
                            : 'focus:ring-orange-500 bg-[#3a3a3a]'
                        } text-white placeholder-gray-400 transition-all`}
                        placeholder="Your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:ring-2 ${
                          errors.email
                            ? 'focus:ring-red-500 bg-red-900/20'
                            : 'focus:ring-orange-500 bg-[#3a3a3a]'
                        } text-white placeholder-gray-400 transition-all`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                      )}
                    </div>

                    {/* Message Field */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className={`w-full px-4 py-3.5 text-base border-none rounded-xl focus:outline-none focus:ring-2 resize-none ${
                          errors.message
                            ? 'focus:ring-red-500 bg-red-900/20'
                            : 'focus:ring-orange-500 bg-[#3a3a3a]'
                        } text-white placeholder-gray-400 transition-all`}
                        placeholder="Tell us how we can help you..."
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-400">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300"
                      style={{
                        boxShadow: 'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.boxShadow =
                            'inset 0px 3px 6px rgba(255, 255, 255, 0.6), inset 0px -3px 6px rgba(0, 0, 0, 0.8), 0px 0px 8px rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.boxShadow =
                            'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)';
                        }
                      }}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
