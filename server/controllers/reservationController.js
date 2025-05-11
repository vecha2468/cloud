// server/controllers/reservationController.js
const { validationResult } = require('express-validator');
const db = require('../config/database');
const emailSender = require('../utils/emailSender');

// Create a new reservation
exports.createReservation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const { restaurant_id, reservation_date, reservation_time, party_size, special_request } = req.body;
  const customer_id = req.user.id;
  
  try {
    // Check if restaurant exists and is approved
    const [restaurants] = await db.query(
      'SELECT * FROM restaurants WHERE id = ? AND is_approved = 1',
      [restaurant_id]
    );
    
    if (restaurants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or not approved'
      });
    }
    
    // Find a suitable table
    // In a real application, we'd have a more complex algorithm for table assignment
    const [availableTables] = await db.query(
      'SELECT * FROM tables WHERE restaurant_id = ? AND capacity >= ? ORDER BY capacity ASC',
      [restaurant_id, party_size]
    );
    
    if (availableTables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No suitable tables available for your party size'
      });
    }
    
    // Check if the table is already booked at the requested time
    const [existingReservations] = await db.query(
      `SELECT * FROM reservations 
       WHERE table_id = ? AND reservation_date = ? AND reservation_time = ? 
       AND status IN ('confirmed', 'pending')`,
      [availableTables[0].id, reservation_date, reservation_time]
    );
    
    if (existingReservations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Requested time slot is not available'
      });
    }
    
    // Create the reservation
    const [result] = await db.query(
      `INSERT INTO reservations (
        customer_id, restaurant_id, table_id, reservation_date, 
        reservation_time, party_size, special_request, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_id, restaurant_id, availableTables[0].id, reservation_date,
        reservation_time, party_size, special_request || null, 'confirmed'
      ]
    );
    
    const reservation_id = result.insertId;
    
    // Get the created reservation
    const [reservations] = await db.query(
      `SELECT r.*, rest.name as restaurant_name, rest.address_line1, rest.address_line2, 
        rest.city, rest.state, rest.zip_code
       FROM reservations r
       JOIN restaurants rest ON r.restaurant_id = rest.id
       WHERE r.id = ?`,
      [reservation_id]
    );
    
    // Get user information for email
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [customer_id]
    );
    
    // Send confirmation email
    try {
      await emailSender.sendReservationConfirmation(
        reservations[0],
        users[0],
        restaurants[0]
      );
    } catch (emailErr) {
      console.error('Error sending email:', emailErr.message);
      // Continue despite email error
    }
    
    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      reservation: reservations[0]
    });
  } catch (err) {
    console.error('Error creating reservation:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user's reservations
exports.getUserReservations = async (req, res) => {
  const customer_id = req.user.id;
  
  try {
    const [reservations] = await db.query(
      `SELECT r.*, rest.name as restaurant_name, 
        (SELECT photo_url FROM restaurant_photos WHERE restaurant_id = rest.id AND is_primary = 1 LIMIT 1) as restaurant_image
       FROM reservations r
       JOIN restaurants rest ON r.restaurant_id = rest.id
       WHERE r.customer_id = ?
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`,
      [customer_id]
    );
    
    res.json({
      success: true,
      reservations
    });
  } catch (err) {
    console.error('Error fetching user reservations:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get restaurant reservations (for restaurant managers)
exports.getRestaurantReservations = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  try {
    // Check if the user is the restaurant manager or an admin
    if (req.user.role !== 'admin') {
      const [restaurants] = await db.query(
        'SELECT * FROM restaurants WHERE id = ? AND manager_id = ?',
        [id, user_id]
      );
      
      if (restaurants.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these reservations'
        });
      }
    }
    
    // Get date filter from query params
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    // Get reservations for the restaurant
    const [reservations] = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email, u.phone
       FROM reservations r
       JOIN users u ON r.customer_id = u.id
       WHERE r.restaurant_id = ? AND r.reservation_date = ?
       ORDER BY r.reservation_time ASC`,
      [id, date]
    );
    
    res.json({
      success: true,
      reservations
    });
  } catch (err) {
    console.error('Error fetching restaurant reservations:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update reservation status
exports.updateReservation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const { id } = req.params;
  const { status, special_request } = req.body;
  const user_id = req.user.id;
  
  try {
    // Get the reservation
    const [reservations] = await db.query(
      `SELECT r.*, rest.manager_id, rest.name as restaurant_name
       FROM reservations r
       JOIN restaurants rest ON r.restaurant_id = rest.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }
    
    const reservation = reservations[0];
    
    // Check if the user is authorized to update this reservation
    if (req.user.role !== 'admin' && 
        user_id !== reservation.customer_id && 
        user_id !== reservation.manager_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reservation'
      });
    }
    
    // Prepare update fields
    const updateFields = [];
    const queryParams = [];
    
    if (status) {
      updateFields.push('status = ?');
      queryParams.push(status);
    }
    
    if (special_request !== undefined) {
      updateFields.push('special_request = ?');
      queryParams.push(special_request);
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
    
    // Update the reservation
    await db.query(
      `UPDATE reservations SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      queryParams
    );
    
    // Get the updated reservation
    const [updatedReservations] = await db.query(
      'SELECT * FROM reservations WHERE id = ?',
      [id]
    );
    
    const updatedReservation = updatedReservations[0];
    
    // If status changed to 'cancelled', send notification email
    if (status === 'cancelled') {
      // Get user information for email
      const [users] = await db.query(
        'SELECT * FROM users WHERE id = ?',
        [reservation.customer_id]
      );
      
      // Get restaurant information
      const [restaurants] = await db.query(
        'SELECT * FROM restaurants WHERE id = ?',
        [reservation.restaurant_id]
      );
      
      // Send cancellation email
      try {
        await emailSender.sendCancellationNotification(
          updatedReservation,
          users[0],
          restaurants[0]
        );
      } catch (emailErr) {
        console.error('Error sending cancellation email:', emailErr.message);
        // Continue despite email error
      }
    }
    
    res.json({
      success: true,
      message: 'Reservation updated successfully',
      reservation: updatedReservation
    });
  } catch (err) {
    console.error('Error updating reservation:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Cancel reservation (shorthand for status update)
exports.cancelReservation = async (req, res) => {
  req.body = { status: 'cancelled' };
  return this.updateReservation(req, res);
};

// Check availability for a restaurant
exports.checkAvailability = async (req, res) => {
  const { restaurant_id, date, time, party_size } = req.query;
  
  // Validate parameters
  if (!restaurant_id || !date || !time || !party_size) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters'
    });
  }
  
  try {
    // Check if restaurant exists and is approved
    const [restaurants] = await db.query(
      'SELECT * FROM restaurants WHERE id = ? AND is_approved = 1',
      [restaurant_id]
    );
    
    if (restaurants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or not approved'
      });
    }
    
    // Get all tables for the restaurant
    const [tables] = await db.query(
      'SELECT * FROM tables WHERE restaurant_id = ? AND capacity >= ? ORDER BY capacity ASC',
      [restaurant_id, party_size]
    );
    
    if (tables.length === 0) {
      return res.json({
        success: true,
        available: false,
        message: 'No tables available for this party size'
      });
    }
    
    // Check for existing reservations at this time
    const tableIds = tables.map(table => table.id);
    
    const [existingReservations] = await db.query(
      `SELECT * FROM reservations 
       WHERE table_id IN (?) AND reservation_date = ? AND reservation_time = ? 
       AND status IN ('confirmed', 'pending')`,
      [tableIds, date, time]
    );
    
    // Count how many tables are available
    const bookedTableIds = existingReservations.map(res => res.table_id);
    const availableTables = tables.filter(table => !bookedTableIds.includes(table.id));
    
    // Find alternative time slots if nothing is available
    let alternativeSlots = [];
    if (availableTables.length === 0) {
      // Get the operating hours for the day
      const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
      
      const [hours] = await db.query(
        'SELECT * FROM operating_hours WHERE restaurant_id = ? AND day_of_week = ?',
        [restaurant_id, dayOfWeek]
      );
      
      if (hours.length > 0) {
        const opening = hours[0].opening_time;
        const closing = hours[0].closing_time;
        
        // Generate time slots in 30-minute increments
        const requestedTime = time;
        const slots = [];
        
        // Add slots 2 hours before and after the requested time
        const requestedHour = parseInt(requestedTime.split(':')[0]);
        const requestedMinute = parseInt(requestedTime.split(':')[1]);
        
        for (let i = -4; i <= 4; i++) {
          // Skip the requested time since we know it's not available
          if (i === 0) continue;
          
          // Calculate new time (30-minute increments)
          let newHour = requestedHour;
          let newMinute = requestedMinute + (i * 30);
          
          // Adjust hour if needed
          while (newMinute >= 60) {
            newHour++;
            newMinute -= 60;
          }
          while (newMinute < 0) {
            newHour--;
            newMinute += 60;
          }
          
          // Format the time
          const newTime = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
          
          // Check if time is within operating hours
          if (newTime >= opening && newTime <= closing) {
            // Check if this time slot is available
            const [reservations] = await db.query(
              `SELECT * FROM reservations 
               WHERE table_id IN (?) AND reservation_date = ? AND reservation_time = ? 
               AND status IN ('confirmed', 'pending')`,
              [tableIds, date, newTime]
            );
            
            const bookedTables = reservations.map(res => res.table_id);
            const availableForSlot = tables.filter(table => !bookedTables.includes(table.id));
            
            if (availableForSlot.length > 0) {
              slots.push(newTime);
            }
          }
        }
        
        alternativeSlots = slots;
      }
    }
    
    res.json({
      success: true,
      available: availableTables.length > 0,
      available_tables: availableTables.length,
      alternative_slots: alternativeSlots
    });
  } catch (err) {
    console.error('Error checking availability:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get reservation statistics for dashboard
exports.getReservationStats = async (req, res) => {
  // Only admin and restaurant managers can access stats
  if (req.user.role !== 'admin' && req.user.role !== 'restaurant_manager') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access statistics'
    });
  }
  
  try {
    let stats = {};
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // For admin, get stats across all restaurants
    if (req.user.role === 'admin') {
      // Total reservations in the last 30 days
      const [totalResult] = await db.query(
        `SELECT COUNT(*) as total FROM reservations 
         WHERE reservation_date BETWEEN ? AND ?`,
        [thirtyDaysAgoStr, today]
      );
      
      // Reservations by status
      const [statusResult] = await db.query(
        `SELECT status, COUNT(*) as count FROM reservations 
         WHERE reservation_date BETWEEN ? AND ? 
         GROUP BY status`,
        [thirtyDaysAgoStr, today]
      );
      
      // Reservations by day
      const [dailyResult] = await db.query(
        `SELECT reservation_date, COUNT(*) as count FROM reservations 
         WHERE reservation_date BETWEEN ? AND ? 
         GROUP BY reservation_date 
         ORDER BY reservation_date`,
        [thirtyDaysAgoStr, today]
      );
      
      // Most popular restaurants
      const [popularResult] = await db.query(
        `SELECT r.restaurant_id, rest.name, COUNT(*) as count 
         FROM reservations r
         JOIN restaurants rest ON r.restaurant_id = rest.id
         WHERE r.reservation_date BETWEEN ? AND ? 
         GROUP BY r.restaurant_id 
         ORDER BY count DESC 
         LIMIT 5`,
        [thirtyDaysAgoStr, today]
      );
      
      stats = {
        total_reservations: totalResult[0].total,
        by_status: statusResult,
        daily_reservations: dailyResult,
        popular_restaurants: popularResult
      };
    } 
    // For restaurant manager, get stats for their restaurants
    else {
      // Get manager's restaurants
      const [restaurants] = await db.query(
        'SELECT id FROM restaurants WHERE manager_id = ?',
        [req.user.id]
      );
      
      if (restaurants.length === 0) {
        return res.json({
          success: true,
          stats: {
            total_reservations: 0,
            by_status: [],
            daily_reservations: [],
            by_table: []
          }
        });
      }
      
      const restaurantIds = restaurants.map(r => r.id);
      
      // Total reservations in the last 30 days
      const [totalResult] = await db.query(
        `SELECT COUNT(*) as total FROM reservations 
         WHERE restaurant_id IN (?) AND reservation_date BETWEEN ? AND ?`,
        [restaurantIds, thirtyDaysAgoStr, today]
      );
      
      // Reservations by status
      const [statusResult] = await db.query(
        `SELECT status, COUNT(*) as count FROM reservations 
         WHERE restaurant_id IN (?) AND reservation_date BETWEEN ? AND ? 
         GROUP BY status`,
        [restaurantIds, thirtyDaysAgoStr, today]
      );
      
      // Reservations by day
      const [dailyResult] = await db.query(
        `SELECT reservation_date, COUNT(*) as count FROM reservations 
         WHERE restaurant_id IN (?) AND reservation_date BETWEEN ? AND ? 
         GROUP BY reservation_date 
         ORDER BY reservation_date`,
        [restaurantIds, thirtyDaysAgoStr, today]
      );
      
      // Reservations by table
      const [tableResult] = await db.query(
        `SELECT r.restaurant_id, r.table_id, t.table_number, COUNT(*) as count 
         FROM reservations r
         JOIN tables t ON r.table_id = t.id
         WHERE r.restaurant_id IN (?) AND r.reservation_date BETWEEN ? AND ? 
         GROUP BY r.restaurant_id, r.table_id 
         ORDER BY count DESC`,
        [restaurantIds, thirtyDaysAgoStr, today]
      );
      
      stats = {
        total_reservations: totalResult[0].total,
        by_status: statusResult,
        daily_reservations: dailyResult,
        by_table: tableResult
      };
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('Error fetching reservation stats:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};