// src/services/authService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Handle errors consistently
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
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
    // Something happened in setting up the request that triggered an Error
    return {
      success: false,
      message: error.message || 'An unknown error occurred'
    };
  }
};

// Register a new user
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Login user
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get current user profile
export const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update user profile
export const updateUser = async (userData, token) => {
  try {
    const response = await axios.put(`${API_URL}/auth/update`, userData, {
      headers: {
        'x-auth-token': token
      }
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Change user password
export const changePassword = async (passwordData, token) => {
  try {
    const response = await axios.put(`${API_URL}/auth/change-password`, passwordData, {
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
  register,
  login,
  getCurrentUser,
  updateUser,
  changePassword
};