// src/services/adminService.js
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

// Get dashboard statistics
export const getDashboardStats = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get all users (with filtering)
export const getAllUsers = async (params, token) => {
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      params,
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get user details
export const getUserDetails = async (userId, token) => {
  try {
    const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update user role
export const updateUserRole = async (userId, role, token) => {
  try {
    const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, 
      { role },
      {
        headers: {
          'x-auth-token': token
        }
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get all restaurants (with filtering)
export const getAllRestaurants = async (params, token) => {
  try {
    const response = await axios.get(`${API_URL}/admin/restaurants`, {
      params,
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get pending restaurant approvals
export const getPendingRestaurants = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/admin/pending`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Approve restaurant
export const approveRestaurant = async (restaurantId, token) => {
  try {
    const response = await axios.put(`${API_URL}/restaurants/${restaurantId}/approve`, 
      {},
      {
        headers: {
          'x-auth-token': token
        }
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Export data for reports
export const exportData = async (params, token) => {
  try {
    const response = await axios.get(`${API_URL}/admin/export`, {
      params,
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteRestaurant = async (restaurantId, token) => {
    try {
      const response = await axios.delete(`${API_URL}/restaurants/${restaurantId}`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  };

export default {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  getAllRestaurants,
  getPendingRestaurants,
  approveRestaurant,
  exportData,
  deleteRestaurant
};