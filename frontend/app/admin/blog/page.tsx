'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  getBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadImage,
} from '@/lib/api';

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

  const loadPosts = async () => {
    try {
      const data = await getBlogPosts(false); // Get all posts, not just published
      setPosts(data);
    } catch (error) {
      console.error('Error loading blog posts:', error);
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
    setCoverImageKey((prev) => prev + 1); // Reset file input
    setHeroImageKey((prev) => prev + 1); // Reset file input
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCoverImage(true);
    try {
      const imageUrl = await uploadImage(file);
      setFormData((prev) => ({ ...prev, cover_image: imageUrl, featured_image: imageUrl }));
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Error uploading cover image');
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
    } catch (error) {
      console.error('Error uploading hero image:', error);
      alert('Error uploading hero image');
    } finally {
      setUploadingHeroImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPost) {
        await updateBlogPost(editingPost.id, formData);
      } else {
        await createBlogPost(formData);
      }
      handleCloseModal();
      loadPosts();
    } catch (error: unknown) {
      console.error('Error saving blog post:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(errorMessage || 'Error saving blog post');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      await deleteBlogPost(id);
      loadPosts();
    } catch (error: unknown) {
      console.error('Error deleting blog post:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(errorMessage || 'Error deleting blog post');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await updateBlogPost(post.id, {
        is_published: !post.is_published,
      });
      loadPosts();
    } catch (error: unknown) {
      console.error('Error updating post status:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      alert(errorMessage || 'Error updating post status');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p>Loading blog posts...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          + New Post
        </button>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No blog posts yet. Create your first post!
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr 
                  key={post.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOpenModal(post)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                    {post.excerpt && (
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {post.excerpt}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className={`${
                        post.is_published ? 'text-orange-600' : 'text-green-600'
                      } hover:underline`}
                    >
                      {post.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(post)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal - Full Screen */}
      {showModal && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="min-h-screen">
            {/* Header - Sticky */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
              <h2 className="text-3xl font-bold">
                {editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-8 max-w-5xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                    required
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                    placeholder="Short description of the post..."
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    Cover Image <span className="text-gray-500 text-sm font-normal">(Displayed on blog listing page)</span>
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      key={coverImageKey}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={uploadingCoverImage}
                    />
                    {uploadingCoverImage && (
                      <span className="text-base text-gray-600 font-medium">Uploading...</span>
                    )}
                  </div>
                  {formData.cover_image && (
                    <div className="mt-4">
                      <img
                        src={formData.cover_image}
                        alt="Cover"
                        className="max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    Hero Image <span className="text-gray-500 text-sm font-normal">(Displayed on individual blog post hero section)</span>
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      key={heroImageKey}
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={uploadingHeroImage}
                    />
                    {uploadingHeroImage && (
                      <span className="text-base text-gray-600 font-medium">Uploading...</span>
                    )}
                  </div>
                  {formData.hero_image && (
                    <div className="mt-4">
                      <img
                        src={formData.hero_image}
                        alt="Hero"
                        className="max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <label className="block text-base font-semibold text-gray-900 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={20}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-base"
                    required
                    placeholder="Write your blog post content here..."
                  />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
                    <label htmlFor="is_published" className="ml-3 block text-base font-semibold text-gray-900">
                      Publish immediately
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-base font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-base font-semibold shadow-md"
                  >
                    {editingPost ? 'Update Post' : 'Create Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

