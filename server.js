require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files
//

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gate_test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
app.use('/api/auth', authRoutes);

// Save Test Progress Route
app.post('/api/progress/save', require('./middleware/auth'), async (req, res) => {
  const { testType, testId, score, totalMarks, accuracy, correctAnswers, attempted, timeSpent } = req.body;

  if (!testType || !testId || score === undefined || totalMarks === undefined || accuracy === undefined) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.testProgress.push({
      testType,
      testId,
      score,
      totalMarks,
      accuracy,
      dateTaken: new Date(),
      details: {
        correctAnswers,
        attempted,
        timeSpent,
      },
    });

    user.overallStats.totalTestsTaken += 1;
    user.overallStats.bestScore = Math.max(user.overallStats.bestScore, (score / totalMarks) * 100);
    const totalScorePercent = user.testProgress.reduce((sum, test) => sum + (test.score / test.totalMarks * 100), 0);
    user.overallStats.averageScore = totalScorePercent / user.testProgress.length;

    await user.save();

    res.status(200).json({ message: 'Progress saved successfully' });
  } catch (err) {
    console.error('Save Progress Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Test Progress Route
app.get('/api/progress', require('./middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('testProgress overallStats');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      testProgress: user.testProgress,
      overallStats: user.overallStats,
    });
  } catch (err) {
    console.error('Get Progress Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});