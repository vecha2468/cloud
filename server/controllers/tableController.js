// server/controllers/tableController.js
const { validationResult } = require('express-validator');
const db = require('../config/database');

// Helper function to check if the user owns the restaurant associated with the table
const checkTableOwnership = async (tableId, userId) => {
  const [tables] = await db.query(
    `SELECT t.id, r.manager_id 
     FROM tables t 
     JOIN restaurants r ON t.restaurant_id = r.id 
     WHERE t.id = ?`,
    [tableId]
  );
  if (tables.length === 0) {
    return { owned: false, exists: false, message: 'Table not found' };
  }
  if (tables[0].manager_id !== userId) {
    return { owned: false, exists: true, message: 'User does not own the restaurant associated with this table' };
  }
  return { owned: true, exists: true };
};

// Helper function to check if the user owns the restaurant before adding a table
const checkRestaurantOwnership = async (restaurantId, userId) => {
    const [restaurants] = await db.query(
      'SELECT manager_id FROM restaurants WHERE id = ?',
      [restaurantId]
    );
    if (restaurants.length === 0) {
        return { owned: false, exists: false, message: 'Restaurant not found' };
    }
    if (restaurants[0].manager_id !== userId) {
        return { owned: false, exists: true, message: 'User does not own this restaurant' };
    }
    return { owned: true, exists: true };
};


// @desc    Get tables for a specific restaurant
// @route   GET /api/restaurants/:restaurantId/tables
// @access  Private (Restaurant Manager)
exports.getRestaurantTables = async (req, res) => {
  const { restaurantId } = req.params;
  const managerId = req.user.id;

  try {
    // Verify ownership of the restaurant first
    const ownershipCheck = await checkRestaurantOwnership(restaurantId, managerId);
    if (!ownershipCheck.exists) {
        return res.status(404).json({ success: false, message: ownershipCheck.message });
    }
    if (!ownershipCheck.owned) {
        return res.status(403).json({ success: false, message: ownershipCheck.message });
    }

    const [tables] = await db.query(
      'SELECT * FROM tables WHERE restaurant_id = ? ORDER BY table_number',
      [restaurantId]
    );
    res.json({ success: true, tables });
  } catch (err) {
    console.error('Error fetching tables:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new table for a restaurant
// @route   POST /api/tables
// @access  Private (Restaurant Manager)
exports.createTable = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { restaurant_id, table_number, capacity } = req.body;
  const managerId = req.user.id;

  try {
    // Check if the user owns the restaurant they are adding a table to
    const ownershipCheck = await checkRestaurantOwnership(restaurant_id, managerId);
    if (!ownershipCheck.exists) {
        return res.status(404).json({ success: false, message: ownershipCheck.message });
    }
    if (!ownershipCheck.owned) {
        return res.status(403).json({ success: false, message: ownershipCheck.message });
    }

    // Insert the new table
    const [result] = await db.query(
      'INSERT INTO tables (restaurant_id, table_number, capacity) VALUES (?, ?, ?)',
      [restaurant_id, table_number, capacity]
    );

    const [newTable] = await db.query('SELECT * FROM tables WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, message: 'Table created successfully', table: newTable[0] });
  } catch (err) {
    console.error('Error creating table:', err.message);
    // Handle potential duplicate table_number for the same restaurant if needed
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Table number already exists for this restaurant.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update an existing table
// @route   PUT /api/tables/:id
// @access  Private (Restaurant Manager)
exports.updateTable = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { table_number, capacity } = req.body;
  const managerId = req.user.id;

  try {
    // Check ownership
    const ownershipCheck = await checkTableOwnership(id, managerId);
    if (!ownershipCheck.exists) {
        return res.status(404).json({ success: false, message: ownershipCheck.message });
    }
    if (!ownershipCheck.owned) {
        return res.status(403).json({ success: false, message: ownershipCheck.message });
    }

    // Perform update
    await db.query(
      'UPDATE tables SET table_number = ?, capacity = ? WHERE id = ?',
      [table_number, capacity, id]
    );

    const [updatedTable] = await db.query('SELECT * FROM tables WHERE id = ?', [id]);

    res.json({ success: true, message: 'Table updated successfully', table: updatedTable[0] });
  } catch (err) {
    console.error('Error updating table:', err.message);
     if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Table number already exists for this restaurant.' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a table
// @route   DELETE /api/tables/:id
// @access  Private (Restaurant Manager)
exports.deleteTable = async (req, res) => {
  const { id } = req.params;
  const managerId = req.user.id;

  try {
    // Check ownership
    const ownershipCheck = await checkTableOwnership(id, managerId);
     if (!ownershipCheck.exists) {
        return res.status(404).json({ success: false, message: ownershipCheck.message });
    }
    if (!ownershipCheck.owned) {
        return res.status(403).json({ success: false, message: ownershipCheck.message });
    }

    // Perform delete
    const [result] = await db.query('DELETE FROM tables WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
        // This case should ideally be caught by checkTableOwnership, but as a fallback
        return res.status(404).json({ success: false, message: 'Table not found or already deleted' });
    }

    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (err) {
    console.error('Error deleting table:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
