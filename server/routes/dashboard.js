const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { protect } = require('../middleware/auth');

// @desc    Sync user platform handles and custom roadmaps to MongoDB
// @route   POST /api/dashboard/sync
// @access  Private
router.post('/sync', protect, async (req, res) => {
  const { handles, sheets } = req.body;

  try {
    // 1. Update user handles
    if (handles) {
      await User.findByIdAndUpdate(req.user._id, { handles });
    }

    // 2. Sync sheets (Roadmap checklists)
    if (sheets && typeof sheets === 'object') {
      const sheetKeys = Object.keys(sheets);
      
      for (const title of sheetKeys) {
        const problems = sheets[title];
        
        // Upsert sheet (insert or update based on compound index: user + title)
        await Roadmap.findOneAndUpdate(
          { user: req.user._id, title },
          { 
            problems, 
            updatedAt: Date.now() 
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ success: true, message: 'Dashboard details synchronized successfully with MongoDB Atlas cloud database!' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Fetch user's synced handles and roadmaps from MongoDB
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const roadmaps = await Roadmap.find({ user: req.user._id });

    // Format sheets back to { "SDE Starter Kit": [problems...], ... }
    const sheets = {};
    roadmaps.forEach(r => {
      sheets[r.title] = r.problems.map(p => ({
        id: p._id,
        title: p.title,
        url: p.url,
        difficulty: p.difficulty,
        completed: p.completed
      }));
    });

    res.json({
      success: true,
      handles: user.handles,
      sheets
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
