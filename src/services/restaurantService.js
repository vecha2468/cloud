// src/services/restaurantService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with an error status
    return {
      success: false,
      message: error.response.data.message || 'An error occurred',
      errors: error.response.data.errors
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      success: false,
      message: 'No response from server. Please check your internet connection.'
    };
  } else {
    // Something happened in setting up the request
    return {
      success: false,
      message: error.message || 'An unknown error occurred'
    };
  }
};

// Get all restaurants
export const getAllRestaurants = async () => {
  try {
    const response = await axios.get(`${API_URL}/restaurants`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Search restaurants by criteria
export const searchRestaurants = async (params) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/search`, { params });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get restaurant by ID
export const getRestaurantById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new restaurant (for restaurant managers)
export const createRestaurant = async (formData, token) => { // Rename argument for clarity
  try {
    // Directly use the formData object passed from the component
    // No need to create a new FormData or loop/append fields here
    const response = await axios.post(`${API_URL}/restaurants`, formData, {
      headers: {
        'x-auth-token': token
        // 'Content-Type': 'multipart/form-data' // Axios sets this automatically for FormData
      }
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update restaurant (for restaurant managers)
export const updateRestaurant = async (id, formData, token) => { // Rename argument for clarity
  try {
    // Directly use the formData object passed from the component
    // No need to create a new FormData or loop/append fields here
    const response = await axios.put(`${API_URL}/restaurants/${id}`, formData, {
      headers: {
        'x-auth-token': token
        // 'Content-Type': 'multipart/form-data' // Axios sets this automatically for FormData
      }
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete restaurant (for admins)
export const deleteRestaurant = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/restaurants/${id}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get restaurant reviews
export const getRestaurantReviews = async (restaurantId) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/restaurant/${restaurantId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get restaurant manager's restaurants
export const getManagerRestaurants = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/manager/list`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Check restaurant availability
export const checkAvailability = async (restaurantId, date, time, partySize) => {
  try {
    const response = await axios.get(`${API_URL}/reservations/availability`, {
      params: {
        restaurant_id: restaurantId,
        date,
        time, 
        party_size: partySize
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};


// --- Table Functions ---

// Get tables for a specific restaurant
export const getRestaurantTables = async (restaurantId, token) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/${restaurantId}/tables`, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data; // Expect { success: true, tables: [...] }
  } catch (error) {
    return handleApiError(error);
  }
};

// Create a new table for a restaurant
export const createRestaurantTable = async (tableData, token) => {
  // tableData should include { restaurant_id, table_number, capacity }
  try {
    const response = await axios.post(`${API_URL}/tables`, tableData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json' // Sending JSON data
      }
    });
    return response.data; // Expect { success: true, message: '...', table: {...} }
  } catch (error) {
    return handleApiError(error);
  }
};

// Update an existing table
export const updateRestaurantTable = async (tableId, tableData, token) => {
  // tableData should include { table_number, capacity }
  try {
    const response = await axios.put(`${API_URL}/tables/${tableId}`, tableData, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json' // Sending JSON data
      }
    });
    return response.data; // Expect { success: true, message: '...', table: {...} }
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a table
export const deleteRestaurantTable = async (tableId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/tables/${tableId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data; // Expect { success: true, message: '...' }
  } catch (error) {
    return handleApiError(error);
  }
};

export default {
  getAllRestaurants,
  searchRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantReviews,
  getManagerRestaurants,
  checkAvailability,
  getRestaurantTables,
  createRestaurantTable,
  updateRestaurantTable,
  deleteRestaurantTable
};
