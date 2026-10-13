const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/user'); // used by seedAdminUser

// Load env vars
dotenv.config();

// Warn loudly if JWT_SECRET is missing — fallback 'secret' is insecure in production
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET is not set in .env. Using insecure fallback value.');
}

// Connect to database
connectDB();

const app = express();

// CORS configuration for local development and production deployments
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://quickbill-restaurant-pos.vercel.app',
  'https://quick-bill-restaurant-pos-frontend.vercel.app'
];

const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server) or same-origin
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');

    // Allow in development mode or if wildcard is explicitly set
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Match configured origins, Vercel deployments, or Render domains
    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.endsWith('.vercel.app') ||
      normalizedOrigin.endsWith('.onrender.com');

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`⚠️ [CORS] Blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
};

// Mount CORS before body parser to handle all requests including OPTIONS preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json());

// Seed admin user
const seedAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            console.log('Admin user not found, creating one...');
            await User.create({
                username: process.env.ADMIN_USERNAME || 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin',
                role: 'admin'
            });
            console.log('Admin user created with default credentials (admin/admin).');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

// Wait for DB connection before seeding
mongoose.connection.once('open', () => {
    seedAdminUser();
});




// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler — must come AFTER all routes
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global error handler — catches errors passed via next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});