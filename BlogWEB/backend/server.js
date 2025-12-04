import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import testCleanupRoutes from './routes/test-cleanup.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);

// Test cleanup route (only available in non-production environments)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testCleanupRoutes);
  console.log('🧪 Test cleanup endpoint enabled: DELETE /api/test/cleanup');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BlogWEB Backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
