import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import vehiclesRoutes from './routes/vehicles';
import bookingsRoutes from './routes/bookings';
import locationsRoutes from './routes/locations';
import extrasRoutes from './routes/extras';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import blogRoutes from './routes/blog';
import couponsRoutes from './routes/coupons';
import draftsRoutes from './routes/drafts';
import contactRoutes from './routes/contact';
import invoiceRoutes from './routes/invoices';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/extras', extrasRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/auth', authRoutes);
// Register more specific admin routes first
app.use('/api/admin/drafts', draftsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/invoices', invoiceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'DB Luxury Cars API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      vehicles: '/api/vehicles',
      bookings: '/api/bookings',
      locations: '/api/locations',
      extras: '/api/extras',
      auth: '/api/auth',
      admin: '/api/admin',
      blog: '/api/blog'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Car Rental API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

