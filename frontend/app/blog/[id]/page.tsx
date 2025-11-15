'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBlogPost } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await getBlogPost(postId);
      setPost(data);
    } catch (error) {
      console.error('Error loading blog post:', error);
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading blog post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600">Blog post not found</p>
        <Link href="/blog" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      {post.hero_image ? (
        <section className="relative w-full h-[50vh] min-h-[400px] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={getImageUrl(post.hero_image) || ''}
              alt={post.title}
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
                {post.title}
              </h1>
              <div className="text-lg md:text-xl text-gray-300">
                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative w-full h-[40vh] min-h-[300px] bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
                {post.title}
              </h1>
              <div className="text-lg md:text-xl text-gray-300">
                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Link
          href="/blog"
          className="text-blue-600 hover:text-blue-800 mb-6 inline-block flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Blog
        </Link>

        <article className="max-w-4xl mx-auto w-full">
          {!post.hero_image && (
            <>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 break-words">{post.title}</h1>
              <div className="text-gray-600 mb-8">
                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
              </div>
            </>
          )}

        {post.excerpt && (
          <p className="text-xl text-gray-700 mb-8 font-medium italic break-words">{post.excerpt}</p>
        )}

        <div
          className="prose prose-lg max-w-none break-words w-full"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
        />

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all posts
          </Link>
        </div>
      </article>
      </div>
    </>
  );
}

