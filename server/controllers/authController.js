// server/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

// Register new user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, first_name, last_name, phone } = req.body;

  try {
    // Check if user already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (email, password, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, phone || null]
    );

    // Get the inserted user
    const [user] = await db.query(
      'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?',
      [result.insertId]
    );

    // Create JWT payload
    const payload = {
      user: {
        id: user[0].id,
        email: user[0].email,
        role: user[0].role
      }
    };

    // Sign and return JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token,
          user: user[0]
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// User login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    // Sign and return JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        
        // Remove password from user object
        const { password, ...userWithoutPassword } = user;
        
        res.json({
          success: true,
          token,
          user: userWithoutPassword
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user information
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { first_name, last_name, phone } = req.body;
  const userId = req.user.id;

  try {
    // Build update fields
    const updateFields = [];
    const queryParams = [];

    if (first_name) {
      updateFields.push('first_name = ?');
      queryParams.push(first_name);
    }
    
    if (last_name) {
      updateFields.push('last_name = ?');
      queryParams.push(last_name);
    }
    
    if (phone) {
      updateFields.push('phone = ?');
      queryParams.push(phone);
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Add user ID to params
    queryParams.push(userId);

    // Update user
    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );

    // Get updated user
    const [users] = await db.query(
      'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: users[0]
    });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  try {
    // Get user with password
    const [users] = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(current_password, users[0].password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};