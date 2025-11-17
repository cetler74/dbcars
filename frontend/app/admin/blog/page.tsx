'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadImage,
} from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  FileText,
  Plus,
  Image as ImageIcon,
  Calendar,
  Save,
  X,
  Type,
  AlignLeft,
  ImageIcon as ImageIconAlt
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  cover_image?: string;
  hero_image?: string;
  is_published: boolean;
  created_at: string;
  updated_at?: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    featured_image: '',
    cover_image: '',
    hero_image: '',
    is_published: false,
  });
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [coverImageKey, setCoverImageKey] = useState(0);
  const [heroImageKey, setHeroImageKey] = useState(0);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = document.querySelector(`[data-menu-id="${openMenuId}"]`);
        const buttonElement = buttonRefs.current[openMenuId] || buttonRefs.current[`mobile-${openMenuId}`];
        
        if (menuElement && !menuElement.contains(event.target as Node) &&
            buttonElement && !buttonElement.contains(event.target as Node)) {
          setOpenMenuId(null);
          setMenuPosition(null);
        }
      }
    };

    const handleScroll = () => {
      if (openMenuId) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openMenuId]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getBlogPosts(false);
      setPosts(data);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Error loading blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featured_image: post.featured_image || '',
        cover_image: post.cover_image || post.featured_image || '',
        hero_image: post.hero_image || '',
        is_published: post.is_published || false,
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        featured_image: '',
        cover_image: '',
        hero_image: '',
        is_published: false,
      });
    }
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      featured_image: '',
      cover_image: '',
      hero_image: '',
      is_published: false,
    });
    setCoverImageKey((prev) => prev + 1);
    setHeroImageKey((prev) => prev + 1);
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCoverImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, cover_image: imageUrl, featured_image: imageUrl }));
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error('Error uploading cover image');
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHeroImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, hero_image: imageUrl }));
      toast.success('Hero image uploaded successfully');
    } catch (error) {
      console.error('Error uploading hero image:', error);
      toast.error('Error uploading hero image');
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await updateBlogPost(editingPost.id, formData);
        toast.success('Blog post updated successfully');
      } else {
        await createBlogPost(formData);
        toast.success('Blog post created successfully');
      }
      handleCloseModal();
      loadPosts();
    } catch (error: unknown) {
      console.error('Error saving blog post:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(errorMessage || 'Error saving blog post');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      await deleteBlogPost(id);
      toast.success('Blog post deleted successfully');
      loadPosts();
    } catch (error: unknown) {
      console.error('Error deleting blog post:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(errorMessage || 'Error deleting blog post');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await updateBlogPost(post.id, {
        is_published: !post.is_published,
      });
      toast.success(post.is_published ? 'Blog post unpublished' : 'Blog post published');
      loadPosts();
    } catch (error: unknown) {
      console.error('Error updating post status:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      toast.error(errorMessage || 'Error updating post status');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog Posts</h1>
          <p className="text-gray-600 text-lg">Manage and publish blog posts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading blog posts..." />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={FileText}
            title="No blog posts found"
            description="No blog posts have been created yet."
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Cover Photo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="relative">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(post.cover_image || post.featured_image) ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={post.cover_image || post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <FileText className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          {post.excerpt && (
                            <div className="text-sm text-gray-500 truncate max-w-md mt-1">
                              {post.excerpt}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.is_published ? (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 shadow-sm inline-flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          Published
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 text-gray-700 shadow-sm inline-flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(post.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap relative" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" ref={(el) => (menuRefs.current[post.id] = el)}>
                        <button
                          ref={(el) => (buttonRefs.current[post.id] = el)}
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              left: rect.right - 176, // 176px = w-44 (11rem)
                            });
                            setOpenMenuId(openMenuId === post.id ? null : post.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === post.id && menuPosition && (
                          <div 
                            data-menu-id={post.id}
                            className="fixed w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] py-1"
                            style={{
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                            }}
                          >
                            <button
                              onClick={() => {
                                handleTogglePublish(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                post.is_published ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {post.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                handleOpenModal(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(post.id);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {(post.cover_image || post.featured_image) ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                      <img
                        src={post.cover_image || post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{post.title}</h3>
                        {post.excerpt && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.excerpt}</p>
                        )}
                      </div>
                      <div className="relative" ref={(el) => (menuRefs.current[post.id] = el)}>
                        <button
                          ref={(el) => (buttonRefs.current[`mobile-${post.id}`] = el)}
                          onClick={(e) => {
                            const button = e.currentTarget;
                            const rect = button.getBoundingClientRect();
                            setMenuPosition({
                              top: rect.bottom + 4,
                              left: rect.right - 176, // 176px = w-44 (11rem)
                            });
                            setOpenMenuId(openMenuId === post.id ? null : post.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === post.id && menuPosition && (
                          <div 
                            className="fixed w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] py-1"
                            style={{
                              top: `${menuPosition.top}px`,
                              left: `${menuPosition.left}px`,
                            }}
                          >
                            <button
                              onClick={() => {
                                handleTogglePublish(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                post.is_published ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {post.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  Publish
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                handleOpenModal(post);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(post.id);
                                setOpenMenuId(null);
                                setMenuPosition(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {post.is_published ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 shadow-sm inline-flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Published
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 text-gray-700 shadow-sm inline-flex items-center gap-1.5">
                        <EyeOff className="w-3.5 h-3.5" />
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header - Sticky */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-50">
              <h2 className="text-3xl font-bold text-gray-900">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-8 max-w-5xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                      placeholder="Short description of the post..."
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cover Image <span className="text-gray-500 text-xs font-normal">(Displayed on blog listing page)</span>
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        key={coverImageKey}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverImageUpload}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        disabled={uploadingCoverImage}
                      />
                    </div>
                    {uploadingCoverImage && (
                      <span className="text-sm text-gray-600 font-medium">Uploading...</span>
                    )}
                  </div>
                  {formData.cover_image && (
                    <div className="mt-4">
                      <img
                        src={formData.cover_image}
                        alt="Cover"
                        className="max-w-md h-48 object-cover rounded-xl border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hero Image <span className="text-gray-500 text-xs font-normal">(Displayed on individual blog post hero section)</span>
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        key={heroImageKey}
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        disabled={uploadingHeroImage}
                      />
                    </div>
                    {uploadingHeroImage && (
                      <span className="text-sm text-gray-600 font-medium">Uploading...</span>
                    )}
                  </div>
                  {formData.hero_image && (
                    <div className="mt-4">
                      <img
                        src={formData.hero_image}
                        alt="Hero"
                        className="max-w-md h-48 object-cover rounded-xl border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Content *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={20}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-sm resize-none"
                      required
                      placeholder="Write your blog post content here..."
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_published"
                      checked={formData.is_published}
                      onChange={(e) =>
                        setFormData({ ...formData, is_published: e.target.checked })
                      }
                      className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_published" className="ml-3 block text-sm font-semibold text-gray-900">
                      Publish immediately
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {editingPost ? 'Update Post' : 'Create Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
