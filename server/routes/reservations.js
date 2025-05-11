// server/routes/reservations.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const reservationController = require('../controllers/reservationController');
const { auth, isRestaurantManager, isAdmin } = require('../middleware/auth');

// @route   POST api/reservations
// @desc    Create a new reservation
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('restaurant_id', 'Restaurant ID is required').isNumeric(),
      check('reservation_date', 'Valid reservation date is required').isDate(),
      check('reservation_time', 'Valid reservation time is required').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
      check('party_size', 'Party size must be a number').isNumeric()
    ]
  ],
  reservationController.createReservation
);

// @route   GET api/reservations/user
// @desc    Get user's reservations
// @access  Private
router.get('/user', auth, reservationController.getUserReservations);

// @route   GET api/reservations/restaurant/:id
// @desc    Get restaurant's reservations
// @access  Private (Restaurant Manager/Admin)
router.get(
  '/restaurant/:id',
  [auth],
  reservationController.getRestaurantReservations
);

// @route   PUT api/reservations/:id
// @desc    Update reservation status
// @access  Private (Owner/Manager/Admin)
router.put(
  '/:id',
  [
    auth,
    [
      check('status', 'Status must be valid').optional()
        .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    ]
  ],
  reservationController.updateReservation
);

// @route   DELETE api/reservations/:id
// @desc    Cancel reservation
// @access  Private (Owner/Admin)
router.delete('/:id', auth, reservationController.cancelReservation);

// @route   GET api/reservations/availability
// @desc    Check availability for a restaurant
// @access  Public
router.get('/availability', reservationController.checkAvailability);

// @route   GET api/reservations/stats
// @desc    Get reservation statistics
// @access  Private (Manager/Admin)
router.get(
  '/stats',
  [auth],
  reservationController.getReservationStats
);

module.exports = router;