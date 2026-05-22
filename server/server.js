const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

// Load environment configurations
dotenv.config();

// Connect to MongoDB Atlas Database
connectDB();

const app = express();

// Middlewares
app.use(express.json());

// Professional CORS configuration (Allows frontend to communicate securely)
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://nishulmehta24.github.io'], // fits your github username!
  credentials: true
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// LeetCode CORS Proxy Route (Public, bypasses browser CORS restrictions)
app.get('/api/leetcode-proxy/:handle', async (req, res) => {
  const { handle } = req.params;
  try {
    const [profileRes, solvedRes, contestRes] = await Promise.all([
      fetch(`https://alfa-leetcode-api.onrender.com/${handle}`),
      fetch(`https://alfa-leetcode-api.onrender.com/${handle}/solved`),
      fetch(`https://alfa-leetcode-api.onrender.com/${handle}/contest`)
    ]);

    if (!profileRes.ok || !solvedRes.ok) {
      return res.status(404).json({ success: false, error: 'LeetCode profile data not found' });
    }

    const profileData = await profileRes.json();
    const solvedData = await solvedRes.json();
    
    let contestData = {};
    if (contestRes.ok) {
      try {
        contestData = await contestRes.json();
      } catch (e) {
        console.warn('Contest data parse failed on backend:', e);
      }
    }

    res.json({
      success: true,
      profileData,
      solvedData,
      contestData
    });
  } catch (error) {
    console.error('LeetCode proxy server-side error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LeetCode Calendar Proxy (for real heatmap data)
app.get('/api/leetcode-calendar/:handle', async (req, res) => {
  const { handle } = req.params;
  try {
    const calRes = await fetch(`https://alfa-leetcode-api.onrender.com/${handle}/calendar`);
    if (!calRes.ok) {
      return res.status(404).json({ success: false, error: 'LeetCode calendar not found' });
    }
    const calData = await calRes.json();
    res.json({ success: true, calendar: calData });
  } catch (error) {
    console.error('LeetCode calendar proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GitHub Events Proxy (for real heatmap contribution data)
app.get('/api/github-events/:handle', async (req, res) => {
  const { handle } = req.params;
  try {
    // GitHub Events API returns last 90 days, up to 300 events across 3 pages
    const pages = await Promise.all([
      fetch(`https://api.github.com/users/${handle}/events?per_page=100&page=1`),
      fetch(`https://api.github.com/users/${handle}/events?per_page=100&page=2`),
      fetch(`https://api.github.com/users/${handle}/events?per_page=100&page=3`)
    ]);

    let allEvents = [];
    for (const page of pages) {
      if (page.ok) {
        const data = await page.json();
        if (Array.isArray(data)) allEvents = allEvents.concat(data);
      }
    }

    // Group events by date
    const eventsByDate = {};
    allEvents.forEach(event => {
      const date = event.created_at ? event.created_at.split('T')[0] : null;
      if (date) {
        eventsByDate[date] = (eventsByDate[date] || 0) + 1;
      }
    });

    res.json({ success: true, events: eventsByDate });
  } catch (error) {
    console.error('GitHub events proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CodeChef Profile Proxy (CodeChef has no public CORS-friendly API)
app.get('/api/codechef-proxy/:handle', async (req, res) => {
  const { handle } = req.params;
  try {
    const profileRes = await fetch(`https://codechef-api.vercel.app/handle/${handle}`);
    if (!profileRes.ok) {
      return res.status(404).json({ success: false, error: 'CodeChef profile not found' });
    }
    const data = await profileRes.json();
    res.json({ success: true, data });
  } catch (error) {
    console.error('CodeChef proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Public Health Check Status Endpoint (Pinged by Frontend Settings)
app.get('/api/status', (req, res) => {
  const dbState = require('mongoose').connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  
  res.json({
    success: true,
    status: 'OK',
    message: 'DevPulse Core Server Online',
    database: dbStatus,
    timestamp: new Date()
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('DevPulse API Server is running. Access /api/status for system health.');
});

// Custom 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Endpoint route not found' });
});

// Start Server listening
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`📡 DevPulse Express Server running on port ${PORT}`);
});
