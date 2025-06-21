const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    profile: user.getPublicProfile()
  });
}));

// @desc    Update current user's profile
// @route   PUT /api/profiles/me
// @access  Private
router.put('/me', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please include a valid email')
], asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const fieldsToUpdate = {};
  if (req.body.name) fieldsToUpdate.name = req.body.name;
  if (req.body.email) fieldsToUpdate.email = req.body.email;

  // Check if email is already taken by another user
  if (req.body.email) {
    const existingUser = await User.findOne({ 
      email: req.body.email, 
      _id: { $ne: req.user.id } 
    });
    
    if (existingUser) {
      return next(new ErrorResponse('Email is already taken', 400));
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    profile: user.getPublicProfile()
  });
}));

// @desc    Get profile statistics
// @route   GET /api/profiles/me/stats
// @access  Private
router.get('/me/stats', protect, asyncHandler(async (req, res) => {
  const taskStats = await Task.getUserTaskStats(req.user.id);
  
  // Get overdue tasks count
  const overdueTasks = await Task.countDocuments({
    user: req.user.id,
    deadline: { $lt: new Date() },
    status: { $ne: 'Completed' }
  });

  // Get tasks due this week
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  
  const tasksThisWeek = await Task.countDocuments({
    user: req.user.id,
    deadline: { 
      $gte: new Date(), 
      $lte: oneWeekFromNow 
    },
    status: { $ne: 'Completed' }
  });

  // Get recent activity (tasks completed in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentCompletions = await Task.countDocuments({
    user: req.user.id,
    status: 'Completed',
    completedAt: { $gte: sevenDaysAgo }
  });

  res.status(200).json({
    success: true,
    stats: {
      ...taskStats,
      overdue: overdueTasks,
      dueThisWeek: tasksThisWeek,
      recentCompletions
    }
  });
}));

// @desc    Delete user profile (deactivate account)
// @route   DELETE /api/profiles/me
// @access  Private
router.delete('/me', protect, asyncHandler(async (req, res) => {
  // Instead of deleting, we deactivate the account
  await User.findByIdAndUpdate(req.user.id, { isActive: false });

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

// Admin routes

// @desc    Get all user profiles (Admin only)
// @route   GET /api/profiles
// @access  Private/Admin
router.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .skip(startIndex)
    .limit(limit)
    .sort({ createdAt: -1 });

  // Pagination result
  const pagination = {};
  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination,
    profiles: users.map(user => user.getPublicProfile())
  });
}));

// @desc    Get single user profile (Admin only)
// @route   GET /api/profiles/:id
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    profile: user.getPublicProfile()
  });
}));

// @desc    Update user profile (Admin only)
// @route   PUT /api/profiles/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please include a valid email'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const fieldsToUpdate = {};
  if (req.body.name) fieldsToUpdate.name = req.body.name;
  if (req.body.email) fieldsToUpdate.email = req.body.email;
  if (req.body.role) fieldsToUpdate.role = req.body.role;
  if (req.body.isActive !== undefined) fieldsToUpdate.isActive = req.body.isActive;

  // Check if email is already taken by another user
  if (req.body.email) {
    const existingUser = await User.findOne({ 
      email: req.body.email, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingUser) {
      return next(new ErrorResponse('Email is already taken', 400));
    }
  }

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    profile: user.getPublicProfile()
  });
}));

module.exports = router;