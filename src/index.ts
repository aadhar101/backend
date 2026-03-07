import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { connectDB } from './database/mongodb';
import routes from './routes/index';
import { errorHandler, notFound } from './middleware';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

// Dynamic CORS to allow any localhost port (Flutter Web) + optional CLIENT_URL
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      // Allow localhost (any port) or environment-specified client
      const allowedOrigins = [
        process.env.CLIENT_URL, // e.g., 'http://localhost:3000'
      ].filter(Boolean);

      if (origin.startsWith('http://localhost') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Static Files (uploaded images) ──────────────────────────────────────────

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1', routes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 Hotel Booking API running at http://localhost:${PORT}`);
    console.log(`📚 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log('\n📌 Available endpoints:');
    console.log('  POST   /api/v1/auth/register');
    console.log('  POST   /api/v1/auth/login');
    console.log('  GET    /api/v1/hotels');
    console.log('  GET    /api/v1/hotels/featured');
    console.log('  GET    /api/v1/hotels/:id');
    console.log('  GET    /api/v1/hotels/:hotelId/rooms/available?checkIn=&checkOut=&adults=');
    console.log('  POST   /api/v1/bookings');
    console.log('  GET    /api/v1/bookings/my');
    console.log('  GET    /api/v1/admin/dashboard');
    console.log('  GET    /api/v1/admin/stats\n');
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;