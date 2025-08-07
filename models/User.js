const mongoose = require('mongoose');
const validator = require('validator');
const path = require('path');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  profilePic: {
    type: String,
    default: function() {
      // Generate a default avatar based on user's name
      const colors = ['FFAD08', 'EDD382', 'FC7A57', '41BBD9', '5C6784'];
      const initial = this.name ? this.name.charAt(0).toUpperCase() : 'U';
      const color = colors[Math.floor(Math.random() * colors.length)];
      return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=128`;
    },
    validate: {
      validator: function(v) {
        // Allow default avatar URL pattern or validate uploaded images
        if (v.startsWith('https://ui-avatars.com/api/')) return true;
        const ext = path.extname(v).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      },
      message: 'Profile picture must be a valid image file (jpg, jpeg, png, gif) or default avatar'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  testProgress: [{
    testType: { type: String, required: true },
    testId: { type: String, required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    dateTaken: { type: Date, default: Date.now },
    details: {
      correctAnswers: Number,
      attempted: Number,
      timeSpent: Number
    }
  }],
  overallStats: {
    totalTestsTaken: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for profile picture URL
userSchema.virtual('profilePicUrl').get(function() {
  // For default avatars, return as-is
  if (this.profilePic.startsWith('https://')) {
    return this.profilePic;
  }
  // For uploaded files, return the proper path
  return `/uploads/users/${this._id}/${this.profilePic}`;
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Update overall stats when test progress is updated
userSchema.methods.updateOverallStats = async function() {
  if (this.testProgress.length > 0) {
    const totalTests = this.testProgress.length;
    const totalScore = this.testProgress.reduce((sum, test) => sum + test.score, 0);
    const bestScore = Math.max(...this.testProgress.map(test => test.score));
    
    this.overallStats = {
      totalTestsTaken: totalTests,
      averageScore: totalScore / totalTests,
      bestScore: bestScore
    };
    
    await this.save();
  }
};

module.exports = mongoose.model('User', userSchema);
