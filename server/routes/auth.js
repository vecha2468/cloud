// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('first_name', 'First name is required').notEmpty(),
    check('last_name', 'Last name is required').notEmpty(),
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   PUT api/auth/update
// @desc    Update user information
// @access  Private
router.put(
  '/update',
  auth,
  [
    check('first_name', 'First name is required').optional(),
    check('last_name', 'Last name is required').optional(),
    check('phone', 'Phone number is not valid').optional().isMobilePhone()
  ],
  authController.updateUser
);

// @route   PUT api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  auth,
  [
    check('current_password', 'Current password is required').notEmpty(),
    check('new_password', 'New password must be 6 or more characters').isLength({ min: 6 })
  ],
  authController.changePassword
);

module.exports = router;