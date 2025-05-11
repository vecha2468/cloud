// server/routes/reviews.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const reviewController = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

// @route   GET api/reviews/restaurant/:id
// @desc    Get reviews for a restaurant
// @access  Public
router.get('/restaurant/:id', reviewController.getReviewsByRestaurant);

// @route   POST api/reviews
// @desc    Create a new review
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('restaurant_id', 'Restaurant ID is required').isNumeric(),
      check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
      check('comment', 'Comment is required').notEmpty()
    ]
  ],
  reviewController.createReview
);

// @route   PUT api/reviews/:id
// @desc    Update a review
// @access  Private (Owner/Admin)
router.put(
  '/:id',
  [
    auth,
    [
      check('rating', 'Rating must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
      check('comment', 'Comment is required').optional().notEmpty()
    ]
  ],
  reviewController.updateReview
);

// @route   DELETE api/reviews/:id
// @desc    Delete a review
// @access  Private (Owner/Restaurant Manager/Admin)
router.delete('/:id', auth, reviewController.deleteReview);

// @route   GET api/reviews/user
// @desc    Get reviews by user
// @access  Private
router.get('/user', auth, reviewController.getReviewsByUser);

module.exports = router;