import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">DB Luxury Cars</h3>
            <p className="text-gray-400 mb-4">
              Morocco&apos;s Ultimate Driving Experience. Premium luxury vehicles for your journey.
            </p>
            <div className="text-gray-400">
              <p>Guéliz Marrakesh</p>
              <p>Morocco 40000</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/cars" className="text-gray-400 hover:text-white transition-colors">
                  Our Cars
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy & Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/cancellation" className="text-gray-400 hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Our Newsletter</h4>
            <p className="text-gray-400 mb-4">
              Be the first to know about our latest luxury vehicles, exclusive offers, and travel insights.
            </p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-3 rounded-md bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 border border-gray-800"
              />
              <button
                type="submit"
                className="bg-white text-black px-4 py-3 rounded-md hover:bg-gray-100 transition-colors font-semibold"
              >
                Sign Up
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p className="mb-2">Created and powered by <strong className="text-gray-300">Uptnable.</strong></p>
          <p>Copyright © 2025. All rights reserved to DB Luxury Cars Morocco</p>
        </div>
      </div>
    </footer>
  );
}

