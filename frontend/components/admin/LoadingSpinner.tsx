'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-2',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div
        className={`
          ${sizeClasses[size]}
          border-gray-200 border-t-orange-600
          rounded-full animate-spin
        `}
      />
      {text && (
        <p className="mt-4 text-sm font-medium text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}

