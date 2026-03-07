import 'dotenv/config';
import { connectDB } from './database/mongodb';
import app from './app';
const PORT = process.env.PORT || 5000;

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
