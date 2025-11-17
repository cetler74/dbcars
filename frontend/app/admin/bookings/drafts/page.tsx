'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDrafts, deleteDraft } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Draft {
  id: string;
  customer_name: string | null;
  vehicle_name: string | null;
  total_price: number | null;
  created_at: string;
  updated_at: string;
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const data = await getDrafts();
      setDrafts(data);
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueDraft = (draftId: string) => {
    router.push(`/admin/bookings/new?draft=${draftId}`);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return;
    }

    try {
      await deleteDraft(draftId);
      toast.success('Draft deleted');
      loadDrafts();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Booking Drafts</h1>
            <p className="text-gray-600 mt-2">Resume or delete saved booking drafts</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin/bookings')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              ← Back to Bookings
            </button>
            <button
              onClick={() => router.push('/admin/bookings/new')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </button>
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Drafts</h2>
            <p className="text-gray-600 mb-6">
              You don't have any saved booking drafts yet.
            </p>
            <button
              onClick={() => router.push('/admin/bookings/new')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Booking
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {draft.customer_name || 'Unnamed Customer'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {draft.vehicle_name || 'No vehicle selected'}
                      </p>
                    </div>
                    {draft.total_price && (
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          €{draft.total_price.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Created: {formatDate(draft.created_at)}</span>
                    </div>
                    {draft.updated_at !== draft.created_at && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Updated: {formatDate(draft.updated_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleContinueDraft(draft.id)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete draft"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

