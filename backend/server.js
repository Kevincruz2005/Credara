require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS — allow frontend dev server and production URL
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://*.ondigitalocean.app'
  ],
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true })); // Twilio webhook sends form data

// Static file serving (PDFs, evidence photos/videos)
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'Credara', version: '3' });
});

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/voice',      require('./routes/voice'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/references', require('./routes/references'));
app.use('/api/documents',  require('./routes/documents'));
app.use('/api/verify',     require('./routes/verify'));
app.use('/api/fraud',      require('./routes/fraud'));
app.use('/api/evidence',   require('./routes/evidence'));

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Credara] Server running on port ${PORT}`);
  console.log(`[Credara] Health check: http://localhost:${PORT}/api/health`);
});
