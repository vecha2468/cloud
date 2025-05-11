// server/routes/restaurants.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const restaurantController = require('../controllers/restaurantController');
const tableController = require('../controllers/tableController');
const { auth, isRestaurantManager, isAdmin, isRestaurantOwner } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, `restaurant-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @route   GET api/restaurants
// @desc    Get all restaurants
// @access  Public
router.get('/', restaurantController.getAllRestaurants);

// @route   GET api/restaurants/search
// @desc    Search restaurants by criteria
// @access  Public
router.get('/search', restaurantController.searchRestaurants);

// @route   GET api/restaurants/:id
// @desc    Get restaurant by ID
// @access  Public
router.get('/:id', restaurantController.getRestaurantById);

// @route   POST api/restaurants
// @desc    Create a new restaurant
// @access  Private (Restaurant Manager)
router.post(
  '/',
  [
    auth,
    isRestaurantManager,
    upload.array('photos', 5), // Allow up to 5 photos
    [
      check('name', 'Name is required').notEmpty(),
      check('cuisine_type', 'Cuisine type is required').notEmpty(),
      check('address_line1', 'Address is required').notEmpty(),
      check('city', 'City is required').notEmpty(),
      check('state', 'State is required').notEmpty(),
      check('zip_code', 'Zip code is required').notEmpty(),
      check('phone', 'Phone number is required').notEmpty()
    ]
  ],
  restaurantController.createRestaurant
);

// @route   PUT api/restaurants/:id
// @desc    Update restaurant
// @access  Private (Restaurant Owner/Admin)
router.put(
  '/:id',
  [
    auth,
    isRestaurantOwner,
    upload.array('photos', 5), // Allow up to 5 photos
    [
      check('name', 'Name is required').optional().notEmpty(),
      check('cuisine_type', 'Cuisine type is required').optional().notEmpty(),
      check('address_line1', 'Address is required').optional().notEmpty(),
      check('city', 'City is required').optional().notEmpty(),
      check('state', 'State is required').optional().notEmpty(),
      check('zip_code', 'Zip code is required').optional().notEmpty(),
      check('phone', 'Phone number is required').optional().notEmpty()
    ]
  ],
  restaurantController.updateRestaurant
);

// @route   DELETE api/restaurants/:id
// @desc    Delete restaurant
// @access  Private (Admin only)
router.delete('/:id', [auth, isAdmin], restaurantController.deleteRestaurant);

// @route   PUT api/restaurants/:id/approve
// @desc    Approve a restaurant
// @access  Private (Admin only)
router.put('/:id/approve', [auth, isAdmin], restaurantController.approveRestaurant);

// @route   GET api/restaurants/manager
// @desc    Get restaurants for current manager
// @access  Private (Restaurant Manager)
router.get('/manager/list', [auth, isRestaurantManager], restaurantController.getRestaurantsByManager);

// @route   GET api/restaurants/pending
// @desc    Get pending restaurant approvals
// @access  Private (Admin only)
router.get('/admin/pending', [auth, isAdmin], restaurantController.getPendingRestaurants);

// @route   GET api/restaurants/:restaurantId/tables
// @desc    Get tables for a specific restaurant
// @access  Private (Restaurant Manager)
router.get(
  '/:restaurantId/tables',
  [auth, isRestaurantManager],
  tableController.getRestaurantTables
);

module.exports = router;
