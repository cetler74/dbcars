'use client';

import { useEffect, useState } from 'react';
import { getBlogPosts } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await getBlogPosts(true); // Only get published posts
      console.log('Blog posts loaded:', data);
      console.log('First post cover_image:', data[0]?.cover_image);
      console.log('First post featured_image:', data[0]?.featured_image);
      setPosts(data);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        {/* Hero Section */}
        <section className="relative w-full h-[40vh] min-h-[300px] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
                Blog
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
                Discover the world in style - Luxury travel insights & tips
              </p>
            </div>
          </div>
        </section>

        {/* Loading State */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[40vh] min-h-[300px] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
              Blog
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Discover the world in style - Luxury travel insights & tips
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">

      {posts.length === 0 ? (
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-600 text-center">
            No blog posts available yet. Check back soon for travel tips, vehicle spotlights, and
            destination guides.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {(() => {
                // Prioritize cover_image, fallback to featured_image
                const coverImg = post.cover_image && typeof post.cover_image === 'string' && post.cover_image.trim() !== '';
                const featuredImg = post.featured_image && typeof post.featured_image === 'string' && post.featured_image.trim() !== '';
                const imageUrl = coverImg ? post.cover_image : (featuredImg ? post.featured_image : null);
                
                if (!imageUrl) {
                  console.log('No image URL for post:', post.id, 'cover_image:', post.cover_image, 'featured_image:', post.featured_image);
                  return null;
                }
                
                const fullImageUrl = getImageUrl(imageUrl);
                
                if (!fullImageUrl) {
                  console.log('Failed to construct image URL for:', imageUrl);
                  return null;
                }
                
                console.log('Rendering image for post:', post.id, 'URL:', fullImageUrl);
                
                return (
                  <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                    <Image
                      src={fullImageUrl}
                      alt={post.title || 'Blog post image'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                      onError={(e) => {
                        console.error('Image failed to load:', fullImageUrl, 'Original URL:', imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', fullImageUrl);
                      }}
                    />
                  </div>
                );
              })()}
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2 group-hover:text-gray-600 transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatDate(post.created_at)}</span>
                  <span className="text-blue-600 group-hover:text-blue-800">Read more →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
