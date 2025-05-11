// server/routes/tables.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const tableController = require('../controllers/tableController');
const { auth, isRestaurantManager } = require('../middleware/auth'); // Assuming isRestaurantManager checks the role

// Middleware: Apply auth and manager check to all routes in this file
router.use(auth, isRestaurantManager);

// @route   POST api/tables
// @desc    Create a new table
// @access  Private (Restaurant Manager)
router.post(
  '/',
  [
    check('restaurant_id', 'Restaurant ID is required').isInt(),
    check('table_number', 'Table number is required').notEmpty().isString(),
    check('capacity', 'Capacity must be a number between 1 and 20').isInt({ min: 1, max: 20 }) // Adjust max as needed
  ],
  tableController.createTable
);

// @route   PUT api/tables/:id
// @desc    Update a table
// @access  Private (Restaurant Manager)
router.put(
  '/:id',
  [
    check('table_number', 'Table number is required').notEmpty().isString(),
    check('capacity', 'Capacity must be a number between 1 and 20').isInt({ min: 1, max: 20 }) // Adjust max as needed
  ],
  tableController.updateTable
);

// @route   DELETE api/tables/:id
// @desc    Delete a table
// @access  Private (Restaurant Manager)
router.delete('/:id', tableController.deleteTable);

module.exports = router;
