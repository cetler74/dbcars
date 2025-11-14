'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <nav className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl md:text-3xl font-bold text-black hover:text-gray-700 transition-colors">
            DB Luxury Cars
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-black hover:text-gray-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-black hover:text-gray-600 transition-colors font-medium"
            >
              About us
            </Link>
            <Link
              href="/cars"
              className="text-black hover:text-gray-600 transition-colors font-medium"
            >
              Our Cars
            </Link>
            <Link
              href="/blog"
              className="text-black hover:text-gray-600 transition-colors font-medium"
            >
              Blog
            </Link>
            <Link
              href="/faq"
              className="text-black hover:text-gray-600 transition-colors font-medium"
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="text-black hover:text-gray-600 transition-colors font-medium"
            >
              Contacts
            </Link>
            <Link
              href="/admin"
              className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4 pb-4">
            <Link
              href="/"
              className="block text-black hover:text-gray-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block text-black hover:text-gray-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About us
            </Link>
            <Link
              href="/cars"
              className="block text-black hover:text-gray-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Our Cars
            </Link>
            <Link
              href="/blog"
              className="block text-black hover:text-gray-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/faq"
              className="block text-black hover:text-gray-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/contact"
              className="block text-black hover:text-gray-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contacts
            </Link>
            <Link
              href="/admin"
              className="block bg-black text-white px-4 py-2 rounded-md text-center font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

