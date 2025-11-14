import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vehiclesRoutes from './routes/vehicles';
import bookingsRoutes from './routes/bookings';
import locationsRoutes from './routes/locations';
import extrasRoutes from './routes/extras';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/extras', extrasRoutes);
app.use('/api/coupons', require('./routes/coupons').default);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Car Rental API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

