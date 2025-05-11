// server/routes/admin.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const adminController = require('../controllers/adminController');
const { auth, isAdmin } = require('../middleware/auth');

// All routes in this file require admin privileges
router.use(auth, isAdmin);

// @route   GET api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', adminController.getDashboardStats);

// @route   GET api/admin/users
// @desc    Get all users with filtering
// @access  Private (Admin only)
router.get('/users', adminController.getAllUsers);

// @route   GET api/admin/users/:id
// @desc    Get user details
// @access  Private (Admin only)
router.get('/users/:id', adminController.getUserDetails);

// @route   PUT api/admin/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put(
  '/users/:id/role',
  [
    check('role', 'Role is required').isIn(['customer', 'restaurant_manager', 'admin'])
  ],
  adminController.updateUserRole
);

// @route   GET api/admin/restaurants
// @desc    Get all restaurants with filtering
// @access  Private (Admin only)
router.get('/restaurants', adminController.getAllRestaurants);

// @route   GET api/admin/export
// @desc    Export data (for reports)
// @access  Private (Admin only)
router.get('/export', adminController.exportData);

module.exports = router;