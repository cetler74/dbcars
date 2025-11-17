'use client';

import dynamic from 'next/dynamic';
import 'react-datepicker/dist/react-datepicker.css';

// Lazy load DatePicker to reduce initial bundle size
const DatePicker = dynamic(
  () => import('react-datepicker').then((mod) => mod.default as any),
  {
    ssr: false,
    loading: () => (
      <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 animate-pulse">
        Loading...
      </div>
    ),
  }
) as any;

export default DatePicker;

