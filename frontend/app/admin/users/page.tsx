'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getAdminUsers,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
} from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Users,
  Mail,
  User,
  Shield,
  Calendar,
  Lock,
  X,
  Save,
  KeyRound
} from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'admin',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        if (!menuRefs.current[openMenuId]?.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          email: formData.email,
          name: formData.name,
        });
        toast.success('User updated successfully');
      } else {
        await createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
        });
        toast.success('User created successfully');
      }
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error saving user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
    });
    setShowForm(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error deleting user');
    }
  };

  const handleChangePassword = async () => {
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await updateUserPassword(editingUser.id, formData.password);
      setShowPasswordModal(false);
      setFormData({ ...formData, password: '' });
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error updating password');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'admin',
    });
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingUser(null);
    resetForm();
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600 text-lg">Manage admin users and their permissions</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            resetForm();
          }}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <LoadingSpinner size="md" text="Loading users..." />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <EmptyState
            icon={Users}
            title="No users found"
            description="No admin users have been created yet."
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Role
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
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded-full">
                          <User className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm inline-flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(user.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="relative" ref={(el) => (menuRefs.current[user.id] = el)}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === user.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
                            <button
                              onClick={() => handleEdit(user)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(user.id);
                                setOpenMenuId(null);
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
            {users.map((user) => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative" ref={(el) => (menuRefs.current[user.id] = el)}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === user.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(user.id);
                            setOpenMenuId(null);
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
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="px-3 py-1 text-xs font-semibold rounded-full border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-sm">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button 
                  onClick={closeModal} 
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password * (min 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white appearance-none"
                      disabled={editingUser !== null}
                    >
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {editingUser ? 'Update' : 'Create'} User
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>

                {editingUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(true);
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <KeyRound className="w-5 h-5" />
                    Change Password
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setShowPasswordModal(false);
              setFormData({ ...formData, password: '' });
            }}
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setFormData({ ...formData, password: '' });
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password * (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setFormData({ ...formData, password: '' });
                    }}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
