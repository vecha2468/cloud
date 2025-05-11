// server/controllers/adminController.js
const db = require('../config/database');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get the date for 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Get total counts
    const [userCounts] = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) AS total_customers,
        SUM(CASE WHEN role = 'restaurant_manager' THEN 1 ELSE 0 END) AS total_managers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS total_admins
      FROM users
    `);
    
    const [restaurantCounts] = await db.query(`
      SELECT 
        COUNT(*) AS total_restaurants,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) AS approved_restaurants,
        SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) AS pending_restaurants
      FROM restaurants
    `);
    
    const [reservationCounts] = await db.query(`
      SELECT 
        COUNT(*) AS total_reservations,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_reservations,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_reservations,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_reservations,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_reservations
      FROM reservations
    `);
    
    const [reviewCounts] = await db.query(`
      SELECT COUNT(*) AS total_reviews, AVG(rating) AS average_rating
      FROM reviews
    `);
    
    // Get recent activity
    const [recentUsers] = await db.query(`
      SELECT id, email, first_name, last_name, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    const [recentReservations] = await db.query(`
      SELECT r.id, r.status, r.reservation_date, r.reservation_time, 
        r.party_size, r.created_at, 
        u.first_name, u.last_name, 
        rest.name as restaurant_name
      FROM reservations r
      JOIN users u ON r.customer_id = u.id
      JOIN restaurants rest ON r.restaurant_id = rest.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    
    const [recentReviews] = await db.query(`
      SELECT r.id, r.rating, r.comment, r.created_at,
        u.first_name, u.last_name,
        rest.name as restaurant_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      JOIN restaurants rest ON r.restaurant_id = rest.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    
    // Get reservation trend (last 30 days)
    const [reservationTrend] = await db.query(`
      SELECT reservation_date, COUNT(*) as count
      FROM reservations
      WHERE reservation_date >= ?
      GROUP BY reservation_date
      ORDER BY reservation_date
    `, [thirtyDaysAgoStr]);
    
    // Compile all statistics
    const stats = {
      counts: {
        users: userCounts[0],
        restaurants: restaurantCounts[0],
        reservations: reservationCounts[0],
        reviews: reviewCounts[0]
      },
      recent: {
        users: recentUsers,
        reservations: recentReservations,
        reviews: recentReviews
      },
      trends: {
        reservations: reservationTrend
      }
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all users with filtering
exports.getAllUsers = async (req, res) => {
  const { role, search, sort_by, sort_dir } = req.query;
  
  try {
    let query = `
      SELECT id, email, first_name, last_name, phone, role, created_at
      FROM users
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add role filter
    if (role) {
      query += ` AND role = ?`;
      queryParams.push(role);
    }
    
    // Add search filter
    if (search) {
      query += ` AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add sorting
    const validSortColumns = ['email', 'first_name', 'last_name', 'role', 'created_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_dir === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    
    // Execute query
    const [users] = await db.query(query, queryParams);
    
    res.json({
      success: true,
      users
    });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user details
exports.getUserDetails = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get user information
    const [users] = await db.query(
      'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = users[0];
    
    // Get additional data based on role
    if (user.role === 'customer') {
      // Get customer's reservations
      const [reservations] = await db.query(`
        SELECT r.id, r.status, r.reservation_date, r.reservation_time, 
          r.party_size, r.created_at, 
          rest.name as restaurant_name
        FROM reservations r
        JOIN restaurants rest ON r.restaurant_id = rest.id
        WHERE r.customer_id = ?
        ORDER BY r.reservation_date DESC, r.reservation_time DESC
        LIMIT 10
      `, [id]);
      
      // Get customer's reviews
      const [reviews] = await db.query(`
        SELECT r.id, r.rating, r.comment, r.created_at,
          rest.name as restaurant_name
        FROM reviews r
        JOIN restaurants rest ON r.restaurant_id = rest.id
        WHERE r.customer_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10
      `, [id]);
      
      user.reservations = reservations;
      user.reviews = reviews;
    } 
    else if (user.role === 'restaurant_manager') {
      // Get manager's restaurants
      const [restaurants] = await db.query(`
        SELECT id, name, cuisine_type, city, state, is_approved, created_at,
          (SELECT COUNT(*) FROM reservations WHERE restaurant_id = restaurants.id) as reservation_count
        FROM restaurants
        WHERE manager_id = ?
        ORDER BY name
      `, [id]);
      
      user.restaurants = restaurants;
    }
    
    res.json({
      success: true,
      user
    });
  } catch (err) {
    console.error('Error fetching user details:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  // Validate role
  const validRoles = ['customer', 'restaurant_manager', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role'
    });
  }
  
  try {
    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user role
    await db.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );
    
    res.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (err) {
    console.error('Error updating user role:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all restaurants with filtering (for admin)
exports.getAllRestaurants = async (req, res) => {
  const { status, cuisine, search, sort_by, sort_dir } = req.query;
  
  try {
    let query = `
      SELECT r.*, 
        u.first_name as manager_first_name, 
        u.last_name as manager_last_name,
        (SELECT COUNT(*) FROM reviews WHERE restaurant_id = r.id) as reviews_count,
        (SELECT AVG(rating) FROM reviews WHERE restaurant_id = r.id) as average_rating,
        (SELECT photo_url FROM restaurant_photos WHERE restaurant_id = r.id AND is_primary = 1 LIMIT 1) as primary_photo
      FROM restaurants r
      JOIN users u ON r.manager_id = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Add approval status filter
    if (status === 'approved') {
      query += ` AND r.is_approved = 1`;
    } else if (status === 'pending') {
      query += ` AND r.is_approved = 0`;
    }
    
    // Add cuisine filter
    if (cuisine) {
      query += ` AND r.cuisine_type = ?`;
      queryParams.push(cuisine);
    }
    
    // Add search filter
    if (search) {
      query += ` AND (r.name LIKE ? OR r.city LIKE ? OR r.cuisine_type LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Add sorting
    const validSortColumns = ['name', 'cuisine_type', 'city', 'created_at', 'is_approved'];
    const sortColumn = validSortColumns.includes(sort_by) ? `r.${sort_by}` : 'r.created_at';
    const sortDirection = sort_dir === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortDirection}`;
    
    // Execute query
    const [restaurants] = await db.query(query, queryParams);
    
    res.json({
      success: true,
      restaurants
    });
  } catch (err) {
    console.error('Error fetching restaurants:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export data (for reports)
exports.exportData = async (req, res) => {
  const { type, from_date, to_date } = req.query;
  
  // Validate date range
  if (!from_date || !to_date) {
    return res.status(400).json({
      success: false,
      message: 'Date range is required'
    });
  }
  
  try {
    let data = [];
    
    // Export reservations data
    if (type === 'reservations') {
      const [reservations] = await db.query(`
        SELECT 
          r.id, r.status, r.reservation_date, r.reservation_time, 
          r.party_size, r.special_request, r.created_at,
          u.first_name, u.last_name, u.email,
          rest.name as restaurant_name, rest.cuisine_type,
          rest.city, rest.state
        FROM reservations r
        JOIN users u ON r.customer_id = u.id
        JOIN restaurants rest ON r.restaurant_id = rest.id
        WHERE r.reservation_date BETWEEN ? AND ?
        ORDER BY r.reservation_date, r.reservation_time
      `, [from_date, to_date]);
      
      data = reservations;
    }
    // Export restaurants data
    else if (type === 'restaurants') {
      const [restaurants] = await db.query(`
        SELECT 
          r.id, r.name, r.cuisine_type, 
          r.address_line1, r.city, r.state, r.zip_code,
          r.is_approved, r.created_at,
          u.first_name as manager_first_name, u.last_name as manager_last_name,
          (SELECT COUNT(*) FROM reviews WHERE restaurant_id = r.id) as reviews_count,
          (SELECT AVG(rating) FROM reviews WHERE restaurant_id = r.id) as average_rating,
          (SELECT COUNT(*) FROM reservations WHERE restaurant_id = r.id AND reservation_date BETWEEN ? AND ?) as reservation_count
        FROM restaurants r
        JOIN users u ON r.manager_id = u.id
        ORDER BY r.name
      `, [from_date, to_date]);
      
      data = restaurants;
    }
    // Export reviews data
    else if (type === 'reviews') {
      const [reviews] = await db.query(`
        SELECT 
          r.id, r.rating, r.comment, r.created_at,
          u.first_name, u.last_name,
          rest.name as restaurant_name, rest.cuisine_type
        FROM reviews r
        JOIN users u ON r.customer_id = u.id
        JOIN restaurants rest ON r.restaurant_id = rest.id
        WHERE r.created_at BETWEEN ? AND ?
        ORDER BY r.created_at DESC
      `, [from_date, to_date]);
      
      data = reviews;
    }
    // Export users data
    else if (type === 'users') {
      const [users] = await db.query(`
        SELECT 
          id, email, first_name, last_name, phone, role, created_at
        FROM users
        WHERE created_at BETWEEN ? AND ?
        ORDER BY created_at DESC
      `, [from_date, to_date]);
      
      data = users;
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'Invalid export type'
      });
    }
    
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Error exporting data:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};