// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Store io in app for use in routes
app.set('io', io);

// Routes
const authRoutes = require('./routes/auth-new');
const usersRoutes = require('./routes/users').default;
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const postsRoutes = require('./routes/posts');
const connectionsRoutes = require('./routes/connections');
const chatsRoutes = require('./routes/chats');
const eventsRoutes = require('./routes/events').default;
const internshipsRoutes = require('./routes/internships').default;
const startupsRoutes = require('./routes/startups').default;
const challengesRoutes = require('./routes/challenges').default;
const activityRoutes = require('./routes/activity').default;
const recommendationsRoutes = require('./routes/recommendations').default;
const notificationsRoutes = require('./routes/notifications').default;
const alumniRoutes = require('./routes/alumni');
const opportunitiesRoutes = require('./routes/opportunities');
const uploadRoutes = require('./routes/upload');

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/internships', internshipsRoutes);
app.use('/api/startups', startupsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/opportunities', opportunitiesRoutes);
app.use('/api/upload', uploadRoutes);

// Socket.IO Handler for Real-Time Features
io.on('connection', (socket) => {
  console.log(`[SOCKET.IO] User connected: ${socket.id}`);

  // Join user room
  socket.on('join-user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`[SOCKET.IO] User ${userId} joined room user_${userId}`);
  });

  // Leave user room
  socket.on('leave-user', (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`[SOCKET.IO] User ${userId} left room user_${userId}`);
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    const { chatId, message } = data;
    io.to(`chat_${chatId}`).emit('new-message', message);
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    socket.broadcast.to(`chat_${chatId}`).emit('user-typing', { status: 'online' });
  });

  // Real-time notifications
  socket.on('subscribe-notifications', (userId) => {
    socket.join(`notifications_${userId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[SOCKET.IO] User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start server
const start = async () => {
  const port = Number(process.env.PORT || 4000);
  const env = process.env.NODE_ENV || 'development';
  
  console.log(`[SERVER] Starting in ${env} mode...`);
  console.log(`[SERVER] Backend working directory: ${process.cwd()}`);
  console.log(`[SERVER] CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

  // Connect to MongoDB with retry logic
  const connectWithRetry = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.warn('[DATABASE] Warning: MONGODB_URI is not configured');
      return;
    }

    try {
      console.log('[DATABASE] Connecting to MongoDB...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('[DATABASE] ✓ MongoDB connected (Atlas)');
      
      const { initializeAlumniFromCSV, watchCSVForChanges } = require('./utils/csvManager');
      await initializeAlumniFromCSV();
      watchCSVForChanges();
    } catch (err) {
      console.warn('[DATABASE] ⚠️  Atlas connection failed. Trying local MongoDB...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/alumni', { serverSelectionTimeoutMS: 2000 });
        console.log('[DATABASE] ✓ MongoDB connected (Local)');
        
        const { initializeAlumniFromCSV, watchCSVForChanges } = require('./utils/csvManager');
        await initializeAlumniFromCSV();
        watchCSVForChanges();
      } catch (localErr) {
        console.error('[DATABASE] ✗ Failed to connect to both Atlas and Local MongoDB.');
        console.log('\n⚠️  WARNING: Server is running WITHOUT a database connection.');
        console.log('💡 Tip: Whitelist IP 152.58.63.229 in MongoDB Atlas.');
        
        // Retry connection every 30 seconds in background
        setTimeout(connectWithRetry, 30000);
      }
    }
  };

  await connectWithRetry();

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${port} is already in use. Please stop the other process and try again.`);
      process.exit(1);
    } else {
      console.error('[FATAL] Server error:', error);
      process.exit(1);
    }
  });

  // Start listening
  server.listen(port, () => {
    console.log(`[SERVER] ✓ Backend listening on http://localhost:${port}`);
    console.log(`[SERVER] Socket.IO listening on ws://localhost:${port}`);
  });
};

start().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});

module.exports = { app, io };
