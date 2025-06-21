const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');

const router = express.Router();

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private
router.get('/', protect, [
  query('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed'),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  query('overdue')
    .optional()
    .isBoolean()
    .withMessage('Overdue must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  // Build filter object
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.priority) filters.priority = req.query.priority;
  if (req.query.overdue === 'true') filters.overdue = true;

  // Get total count for pagination
  const query = { user: req.user.id };
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.overdue) {
    query.deadline = { $lt: new Date() };
    query.status = { $ne: 'Completed' };
  }

  const total = await Task.countDocuments(query);

  // Get tasks with pagination
  const tasks = await Task.find(query)
    .skip(startIndex)
    .limit(limit)
    .sort({ deadline: 1, createdAt: -1 })
    .populate('user', 'name email');

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
    count: tasks.length,
    total,
    pagination,
    tasks
  });
}));

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('user', 'name email');

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  res.status(200).json({
    success: true,
    task
  });
}));

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and must be less than 1000 characters'),
  body('deadline')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid deadline date'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters')
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

  // Check if deadline is in the future
  if (new Date(req.body.deadline) <= new Date()) {
    return next(new ErrorResponse('Deadline must be in the future', 400));
  }

  req.body.user = req.user.id;

  const task = await Task.create(req.body);
  
  // Populate user info before sending response
  await task.populate('user', 'name email');

  res.status(201).json({
    success: true,
    task
  });
}));

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('deadline')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid deadline date'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters')
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

  let task = await Task.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check if deadline is in the future (only if updating deadline)
  if (req.body.deadline && new Date(req.body.deadline) <= new Date()) {
    return next(new ErrorResponse('Deadline must be in the future', 400));
  }

  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('user', 'name email');

  res.status(200).json({
    success: true,
    task
  });
}));

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  const task = await Task.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  await Task.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
}));

// @desc    Get task statistics for logged in user
// @route   GET /api/tasks/stats
// @access  Private
router.get('/stats/overview', protect, asyncHandler(async (req, res) => {
  const stats = await Task.getUserTaskStats(req.user.id);
  
  // Get overdue tasks
  const overdueTasks = await Task.countDocuments({
    user: req.user.id,
    deadline: { $lt: new Date() },
    status: { $ne: 'Completed' }
  });

  // Get tasks due this week
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  
  const dueThisWeek = await Task.countDocuments({
    user: req.user.id,
    deadline: { 
      $gte: new Date(), 
      $lte: oneWeekFromNow 
    },
    status: { $ne: 'Completed' }
  });

  // Get completion rate for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const tasksLast30Days = await Task.countDocuments({
    user: req.user.id,
    createdAt: { $gte: thirtyDaysAgo }
  });

  const completedLast30Days = await Task.countDocuments({
    user: req.user.id,
    status: 'Completed',
    completedAt: { $gte: thirtyDaysAgo }
  });

  const completionRate = tasksLast30Days > 0 
    ? Math.round((completedLast30Days / tasksLast30Days) * 100) 
    : 0;

  res.status(200).json({
    success: true,
    stats: {
      ...stats,
      overdue: overdueTasks,
      dueThisWeek,
      completionRate
    }
  });
}));

// @desc    Bulk update task status
// @route   PATCH /api/tasks/bulk/status
// @access  Private
router.patch('/bulk/status', protect, [
  body('taskIds')
    .isArray({ min: 1 })
    .withMessage('taskIds must be a non-empty array'),
  body('taskIds.*')
    .isMongoId()
    .withMessage('Each taskId must be a valid MongoDB ObjectId'),
  body('status')
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed')
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

  const { taskIds, status } = req.body;

  // Verify all tasks belong to the user
  const tasks = await Task.find({
    _id: { $in: taskIds },
    user: req.user.id
  });

  if (tasks.length !== taskIds.length) {
    return next(new ErrorResponse('Some tasks not found or do not belong to user', 404));
  }

  // Update all tasks
  const result = await Task.updateMany(
    {
      _id: { $in: taskIds },
      user: req.user.id
    },
    { 
      status,
      ...(status === 'Completed' && { completedAt: new Date() }),
      ...(status !== 'Completed' && { completedAt: null })
    }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} tasks updated successfully`,
    modifiedCount: result.modifiedCount
  });
}));

// Admin routes

// @desc    Get all tasks (Admin only)
// @route   GET /api/tasks/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), [
  query('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage('Status must be Pending, In Progress, or Completed'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.status) query.status = req.query.status;

  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .skip(startIndex)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('user', 'name email');

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
    count: tasks.length,
    total,
    pagination,
    tasks
  });
}));

module.exports = router;