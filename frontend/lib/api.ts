import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  const response = await api.post('/bookings', bookingData);
  return response.data;
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

export default api;

