'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { login } from '@/lib/api';

// Google Icon Component
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// Glass Input Wrapper Component
const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-700 bg-white/5 backdrop-blur-sm transition-colors focus-within:border-orange-400/70 focus-within:bg-orange-500/10">
    {children}
  </div>
);

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set body styles when component mounts
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    
    // Store original styles
    const originalBodyMargin = body.style.margin;
    const originalBodyPadding = body.style.padding;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlMargin = html.style.margin;
    const originalHtmlPadding = html.style.padding;
    const originalHtmlOverflow = html.style.overflow;
    
    // Apply new styles
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.height = '100vh';
    html.style.margin = '0';
    html.style.padding = '0';
    html.style.overflow = 'hidden';
    html.style.height = '100%';
    
    return () => {
      // Restore original styles
      body.style.margin = originalBodyMargin;
      body.style.padding = originalBodyPadding;
      body.style.overflow = originalBodyOverflow;
      body.style.height = '';
      html.style.margin = originalHtmlMargin;
      html.style.padding = originalHtmlPadding;
      html.style.overflow = originalHtmlOverflow;
      html.style.height = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Google sign-in functionality can be added here
    alert('Google sign-in coming soon');
  };

  const handleResetPassword = () => {
    // Password reset functionality can be added here
    alert('Password reset coming soon');
  };

  // Hero image - luxury car
  const heroImageSrc = '/herocars.jpg';

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="admin-login-page fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="admin-login-page fixed inset-0 h-screen w-screen font-sans overflow-hidden relative z-50 bg-black"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        minWidth: '100vw',
      }}
    >
      {/* Background Image - Full Page */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: `url(${heroImageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
          height: '100%',
          minWidth: '100%',
          minHeight: '100%',
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
      </div>

      {/* Company Logo - Top Center */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50">
        <Image
          src="/logodb.png"
          alt="Company Logo"
          width={180}
          height={90}
          className="h-auto"
          unoptimized
          priority
        />
      </div>

      {/* Left column: sign-in form with transparent overlay */}
      <section className="absolute inset-0 flex items-center justify-center p-8 z-20">
        <div className="w-full max-w-md">
          {/* Semi-transparent black overlay for form area */}
          <div className="bg-black/75 backdrop-blur-sm rounded-2xl p-8">
            <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              <span className="font-light text-white tracking-tighter">Welcome</span>
            </h1>
            <p className="animate-element animate-delay-200 text-gray-400">
              Access your account and manage your bookings.
            </p>

            {error && (
              <div className="animate-element animate-delay-250 bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-800">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-gray-300 mb-2 block">Email Address</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder-gray-500"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder-gray-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span className="text-white">Keep me signed in</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleResetPassword();
                  }}
                  className="hover:underline text-orange-400 transition-colors"
                >
                  Reset password
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-orange-600 py-4 font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
