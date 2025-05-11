// src/services/reviewService.js
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

// Get reviews for a restaurant
export const getRestaurantReviews = async (restaurantId) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/restaurant/${restaurantId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Submit a new review
export const submitReview = async (reviewData, token) => {
  try {
    const response = await axios.post(`${API_URL}/reviews`, reviewData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update an existing review
export const updateReview = async (reviewId, reviewData, token) => {
  try {
    const response = await axios.put(`${API_URL}/reviews/${reviewId}`, reviewData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete a review
export const deleteReview = async (reviewId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/reviews/${reviewId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get user's reviews
export const getUserReviews = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/user`, {
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
  getRestaurantReviews,
  submitReview,
  updateReview,
  deleteReview,
  getUserReviews
};