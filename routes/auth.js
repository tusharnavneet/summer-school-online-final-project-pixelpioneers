
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = `uploads/users/${req.user.id}/`;
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'));
  }
});

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Normalize email and check for existing user
    const normalizedEmail = email.toLowerCase().trim();
    //findOne return null if no doc found
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    // Create new user - password will be hashed by pre-save hook
    const newUser = new User({ 
      name: name.trim(),
      email: normalizedEmail,
      password,
      progress: [] // Initialize empty progress array
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: { 
        id: newUser._id,
        email: newUser.email, 
        name: newUser.name, 
        profilePic: newUser.profilePicUrl 
      }
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  //destructuring the users request
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  try {
    // Normalize email and find user
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { 
        id: user._id,
        email: user.email, 
        name: user.name, 
        profilePic: user.profilePicUrl 
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ 
      message: 'Server error during authentication',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// Profile Route
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { ...user.toObject(), profilePic: user.profilePicUrl } });
  } catch (err) {
    console.error('Profile Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Profile Route
router.put('/profile', authMiddleware, upload.single('profilePic'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.file) {
      user.profilePic = req.file.filename;
    }

    if (req.body.name) {
      const newName = req.body.name.trim();
      if (newName.length < 2 || newName.length > 50) {
        return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
      }
      user.name = newName;
    }

    await user.save();

    res.json({ user: { ...user.toObject(), profilePic: user.profilePicUrl } });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Password Route
router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user progress
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('testProgress overallStats')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If no progress exists, return empty structure
    if (!user.testProgress || user.testProgress.length === 0) {
      return res.json({
        success: true,
        data: {
          testProgress: [],
          overallStats: {
            totalTestsTaken: 0,
            averageScore: 0,
            bestScore: 0
          }
        }
      });
    }

    // Calculate stats if not already calculated
    if (!user.overallStats || user.overallStats.totalTestsTaken !== user.testProgress.length) {
      const stats = calculateStats(user.testProgress);
      await User.findByIdAndUpdate(req.user.id, { overallStats: stats });
      user.overallStats = stats;
    }

    res.json({
      success: true,
      data: {
        testProgress: user.testProgress.map(test => ({
          testType: test.testType,
          testId: test.testId,
          score: test.score,
          totalMarks: test.totalMarks,
          accuracy: test.accuracy,
          dateTaken: test.dateTaken,
          timeSpent: test.details?.timeSpent || 0,
          correctAnswers: test.details?.correctAnswers || 0,
          attempted: test.details?.attempted || 0
        })),
        overallStats: user.overallStats
      }
    });

  } catch (err) {
    console.error('Progress Fetch Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Helper function to calculate statistics
function calculateStats(testProgress) {
  const totalTestsTaken = testProgress.length;
  let totalScore = 0;
  let bestScore = 0;

  testProgress.forEach(test => {
    const percentage = (test.score / test.totalMarks) * 100;
    totalScore += percentage;
    if (percentage > bestScore) {
      bestScore = percentage;
    }
  });

  return {
    totalTestsTaken,
    averageScore: totalTestsTaken > 0 ? totalScore / totalTestsTaken : 0,
    bestScore
  };
}

// Save progress
router.post('/progress/save', authMiddleware, async (req, res) => {
  try {
    const { testType, testId, score, totalMarks, details } = req.body;

    // Validate input
    if (!testType || !testId || score === undefined || totalMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: testType, testId, score, totalMarks'
      });
    }

    if (typeof score !== 'number' || typeof totalMarks !== 'number' || totalMarks <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid score or totalMarks values'
      });
    }

    const accuracy = (score / totalMarks) * 100;
    const progressEntry = {
      testType,
      testId,
      score,
      totalMarks,
      accuracy,
      dateTaken: new Date(),
      details: {
        correctAnswers: details?.correctAnswers || 0,
        attempted: details?.attempted || 0,
        timeSpent: details?.timeSpent || 0
      }
    };

    // Update user progress and stats
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { testProgress: progressEntry },
        $inc: { 'overallStats.totalTestsTaken': 1 }
      },
      { new: true }
    ).select('testProgress overallStats');

    // Recalculate stats
    const stats = calculateStats(user.testProgress);
    await User.findByIdAndUpdate(req.user.id, { overallStats: stats });

    res.status(201).json({
      success: true,
      message: 'Progress saved successfully',
      data: {
        test: progressEntry,
        overallStats: stats
      }
    });

  } catch (err) {
    console.error('Progress Save Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get leaderboard
router.get('/leaderboard', authMiddleware, async (req, res) => {
  try {
    const leaderboard = await User.find({ 'overallStats.totalTestsTaken': { $gt: 0 } })
      .select('name email profilePic overallStats')
      .sort({ 
        'overallStats.averageScore': -1,
        'overallStats.bestScore': -1,
        'overallStats.totalTestsTaken': -1
      })
      .limit(100)
      .lean();

    const currentUserId = req.user.id;
    const baseUrl = req.protocol + '://' + req.get('host');

    const processedLeaderboard = leaderboard.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      overallStats: {
        totalTestsTaken: user.overallStats?.totalTestsTaken || 0,
        averageScore: user.overallStats?.averageScore || 0,
        bestScore: user.overallStats?.bestScore || 0
      },
      isCurrentUser: user._id.toString() === currentUserId.toString()
    }));

    res.json({
      success: true,
      data: processedLeaderboard
    });
  } catch (err) {
    console.error('Leaderboard Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;



