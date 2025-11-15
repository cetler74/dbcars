import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout to prevent hanging
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Vehicles
export const getVehicles = async (filters?: {
  category?: string;
  location?: string;
  available_from?: string;
  available_to?: string;
  min_price?: number;
  max_price?: number;
}) => {
  const response = await api.get('/vehicles', { params: filters });
  return response.data;
};

export const getVehicle = async (id: string) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

export const checkAvailability = async (
  vehicleId: string,
  from: string,
  to: string
) => {
  const response = await api.get(`/vehicles/${vehicleId}/availability`, {
    params: { from, to },
  });
  return response.data;
};

// Locations
export const getLocations = async () => {
  const response = await api.get('/locations');
  return response.data;
};

// Extras
export const getExtras = async () => {
  const response = await api.get('/extras');
  return response.data;
};

// Coupons
export const validateCoupon = async (
  code: string,
  totalAmount?: number,
  rentalDays?: number
) => {
  const response = await api.get(`/coupons/${code}`, {
    params: { total_amount: totalAmount, rental_days: rentalDays },
  });
  return response.data;
};

// Bookings
export const createBooking = async (bookingData: any) => {
  console.log('Sending booking data:', {
    vehicle_id: bookingData.vehicle_id,
    pickup_location_id: bookingData.pickup_location_id,
    dropoff_location_id: bookingData.dropoff_location_id,
    pickup_date: bookingData.pickup_date,
    dropoff_date: bookingData.dropoff_date,
    has_customer: !!bookingData.customer,
    customer_keys: bookingData.customer ? Object.keys(bookingData.customer) : [],
    extras_count: bookingData.extras?.length || 0,
    has_coupon: !!bookingData.coupon_code,
  });
  
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error: any) {
    console.error('API Error in createBooking:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);
    throw error;
  }
};

export const getBooking = async (bookingNumber: string) => {
  const response = await api.get(`/bookings/${bookingNumber}`);
  return response.data;
};

// Auth
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Admin
export const getAdminStatistics = async () => {
  const response = await api.get('/admin/statistics');
  return response.data;
};

export const getAdminBookings = async (filters?: {
  status?: string;
  vehicle_id?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const response = await api.get('/admin/bookings', { params: filters });
  return response.data;
};

export const updateBookingStatus = async (id: string, status: string, notes?: string) => {
  const response = await api.put(`/admin/bookings/${id}`, { status, notes });
  return response.data;
};

export const getAdminVehicles = async () => {
  const response = await api.get('/admin/vehicles');
  return response.data;
};

export const createVehicle = async (vehicleData: any) => {
  const response = await api.post('/admin/vehicles', vehicleData);
  return response.data;
};

export const updateVehicle = async (id: string, vehicleData: any) => {
  const response = await api.put(`/admin/vehicles/${id}`, vehicleData);
  return response.data;
};

export const deleteVehicle = async (id: string) => {
  const response = await api.delete(`/admin/vehicles/${id}`);
  return response.data;
};

export const getAvailability = async (filters?: {
  vehicle_id?: string;
  month?: number;
  year?: number;
}) => {
  const response = await api.get('/admin/availability', { params: filters });
  return response.data;
};

export const getVehicleSubunits = async (vehicleId: string) => {
  const response = await api.get(`/admin/vehicles/${vehicleId}/subunits`);
  return response.data;
};

export const updateSubunitStatus = async (subunitId: string, status: string) => {
  const response = await api.put(`/admin/vehicle-subunits/${subunitId}/status`, { status });
  return response.data;
};

export const createAvailabilityNote = async (noteData: {
  vehicle_id?: string;
  vehicle_subunit_id?: string;
  note_date: string;
  note: string;
  note_type: 'maintenance' | 'blocked' | 'special';
}) => {
  const response = await api.post('/admin/availability-notes', noteData);
  return response.data;
};

export const deleteAvailabilityNote = async (noteId: string) => {
  const response = await api.delete(`/admin/availability-notes/${noteId}`);
  return response.data;
};

export const logDamage = async (damageData: any) => {
  const response = await api.post('/admin/damage-logs', damageData);
  return response.data;
};

// Upload
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(`${API_URL}/upload/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  // Return full URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return `${baseUrl}${response.data.url}`;
};

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await axios.post(`${API_URL}/upload/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  // Return full URLs
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
  return response.data.urls.map((url: string) => `${baseUrl}${url}`);
};

// Customers
export const getAdminCustomers = async (filters?: {
  search?: string;
  blacklisted?: boolean;
}) => {
  const response = await api.get('/admin/customers', { params: filters });
  return response.data;
};

export const getAdminCustomer = async (id: string) => {
  const response = await api.get(`/admin/customers/${id}`);
  return response.data;
};

export const updateCustomerBlacklist = async (
  id: string,
  isBlacklisted: boolean,
  reason?: string
) => {
  const response = await api.put(`/admin/customers/${id}/blacklist`, {
    is_blacklisted: isBlacklisted,
    blacklist_reason: reason,
  });
  return response.data;
};

export const updateCustomer = async (id: string, customerData: any) => {
  const response = await api.put(`/admin/customers/${id}`, customerData);
  return response.data;
};

// Users
export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getAdminUser = async (id: string) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const createUser = async (userData: { email: string; password: string; name: string; role?: string }) => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: { email?: string; name?: string }) => {
  const response = await api.put(`/admin/users/${id}`, userData);
  return response.data;
};

export const updateUserPassword = async (id: string, password: string) => {
  const response = await api.put(`/admin/users/${id}/password`, { password });
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

// Extras (Admin)
export const getAdminExtras = async () => {
  const response = await api.get('/admin/extras');
  return response.data;
};

export const getAdminExtra = async (id: string) => {
  const response = await api.get(`/admin/extras/${id}`);
  return response.data;
};

export const createExtra = async (extraData: {
  name: string;
  description?: string;
  price: number;
  price_type: 'per_rental' | 'per_day' | 'per_week';
  is_active?: boolean;
  cover_image?: string;
}) => {
  const response = await api.post('/admin/extras', extraData);
  return response.data;
};

export const updateExtra = async (
  id: string,
  extraData: {
    name?: string;
    description?: string;
    price?: number;
    price_type?: 'per_rental' | 'per_day' | 'per_week';
    is_active?: boolean;
    cover_image?: string;
  }
) => {
  const response = await api.put(`/admin/extras/${id}`, extraData);
  return response.data;
};

export const deleteExtra = async (id: string) => {
  const response = await api.delete(`/admin/extras/${id}`);
  return response.data;
};

// Blog Posts
export const getBlogPosts = async (publishedOnly: boolean = false) => {
  const response = await api.get('/blog', {
    params: { published_only: publishedOnly },
  });
  return response.data;
};

export const getBlogPost = async (id: string) => {
  const response = await api.get(`/blog/${id}`);
  return response.data;
};

export const createBlogPost = async (postData: {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  is_published?: boolean;
}) => {
  const response = await api.post('/blog', postData);
  return response.data;
};

export const updateBlogPost = async (
  id: string,
  postData: {
    title?: string;
    content?: string;
    excerpt?: string;
    featured_image?: string;
    is_published?: boolean;
  }
) => {
  const response = await api.put(`/blog/${id}`, postData);
  return response.data;
};

export const deleteBlogPost = async (id: string) => {
  const response = await api.delete(`/blog/${id}`);
  return response.data;
};

export default api;

