const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a problem title'],
    trim: true
  },
  url: {
    type: String,
    default: '#'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const RoadmapSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a sheet/roadmap title'],
    trim: true
  },
  problems: [ProblemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to guarantee sheet titles are unique *per user*
RoadmapSchema.index({ user: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('Roadmap', RoadmapSchema);
