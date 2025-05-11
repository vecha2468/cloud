// server/controllers/reviewController.js
const { validationResult } = require('express-validator');
const db = require('../config/database');

// Get reviews for a restaurant
exports.getReviewsByRestaurant = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if restaurant exists
    const [restaurants] = await db.query(
      'SELECT * FROM restaurants WHERE id = ?',
      [id]
    );
    
    if (restaurants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Get reviews with user information
    const [reviews] = await db.query(`
      SELECT r.*, u.first_name, u.last_name 
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.restaurant_id = ?
      ORDER BY r.created_at DESC
    `, [id]);
    
    // Calculate rating summary
    const [ratingSummary] = await db.query(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews
      WHERE restaurant_id = ?
    `, [id]);
    
    res.json({
      success: true,
      reviews,
      summary: ratingSummary[0]
    });
  } catch (err) {
    console.error('Error fetching reviews:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const { restaurant_id, rating, comment } = req.body;
  const customer_id = req.user.id;
  
  try {
    // Check if restaurant exists
    const [restaurants] = await db.query(
      'SELECT * FROM restaurants WHERE id = ?',
      [restaurant_id]
    );
    
    if (restaurants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Check if user has already reviewed this restaurant
    const [existingReviews] = await db.query(
      'SELECT * FROM reviews WHERE restaurant_id = ? AND customer_id = ?',
      [restaurant_id, customer_id]
    );
    
    if (existingReviews.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this restaurant'
      });
    }
    
    // Check if the user has dined at the restaurant (has a completed reservation)
    const [reservations] = await db.query(
      `SELECT * FROM reservations 
       WHERE restaurant_id = ? AND customer_id = ? AND status = 'completed'`,
      [restaurant_id, customer_id]
    );
    
    // Note: We're allowing reviews without completed reservations for testing purposes
    // In a real application, you might want to require this
    /*
    if (reservations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You can only review restaurants you have dined at'
      });
    }
    */
    
    // Create the review
    const [result] = await db.query(
      'INSERT INTO reviews (restaurant_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)',
      [restaurant_id, customer_id, rating, comment]
    );
    
    // Get the created review
    const [reviews] = await db.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: reviews[0]
    });
  } catch (err) {
    console.error('Error creating review:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const { id } = req.params;
  const { rating, comment } = req.body;
  const customer_id = req.user.id;
  
  try {
    // Check if review exists and belongs to the user
    const [reviews] = await db.query(
      'SELECT * FROM reviews WHERE id = ?',
      [id]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const review = reviews[0];
    
    // Only the review author or admin can update it
    if (review.customer_id !== customer_id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }
    
    // Prepare update fields
    const updateFields = [];
    const queryParams = [];
    
    if (rating) {
      updateFields.push('rating = ?');
      queryParams.push(rating);
    }
    
    if (comment !== undefined) {
      updateFields.push('comment = ?');
      queryParams.push(comment);
    }
    
    // Only proceed if there are fields to update
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    // Add id to params
    queryParams.push(id);
    
    // Update the review
    await db.query(
      `UPDATE reviews SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      queryParams
    );
    
    // Get the updated review
    const [updatedReviews] = await db.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReviews[0]
    });
  } catch (err) {
    console.error('Error updating review:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    // Check if review exists
    const [reviews] = await db.query(
      'SELECT * FROM reviews WHERE id = ?',
      [id]
    );
    
    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const review = reviews[0];
    
    // Only the review author, restaurant manager, or admin can delete it
    if (review.customer_id !== user_id && req.user.role !== 'admin') {
      // Check if user is the restaurant manager
      const [restaurants] = await db.query(
        'SELECT * FROM restaurants WHERE id = ? AND manager_id = ?',
        [review.restaurant_id, user_id]
      );
      
      if (restaurants.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this review'
        });
      }
    }
    
    // Delete the review
    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting review:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get reviews by user
exports.getReviewsByUser = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    const [reviews] = await db.query(`
      SELECT r.*, rest.name as restaurant_name 
      FROM reviews r
      JOIN restaurants rest ON r.restaurant_id = rest.id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `, [user_id]);
    
    res.json({
      success: true,
      reviews
    });
  } catch (err) {
    console.error('Error fetching user reviews:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};