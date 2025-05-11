// src/services/reservationService.js
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

// Create a new reservation
export const createReservation = async (reservationData, token) => {
  try {
    const response = await axios.post(`${API_URL}/reservations`, reservationData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get user's reservations
export const getUserReservations = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/reservations/user`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get restaurant's reservations (for restaurant managers)
export const getRestaurantReservations = async (restaurantId, date, token) => {
  try {
    const response = await axios.get(`${API_URL}/reservations/restaurant/${restaurantId}`, {
      params: { date },
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update reservation status
export const updateReservation = async (reservationId, updateData, token) => {
  try {
    const response = await axios.put(`${API_URL}/reservations/${reservationId}`, updateData, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Cancel reservation
export const cancelReservation = async (reservationId, token) => {
  try {
    const response = await axios.delete(`${API_URL}/reservations/${reservationId}`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Check availability for a restaurant
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

// Get reservation statistics (for restaurant managers or admins)
export const getReservationStats = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/reservations/stats`, {
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
  createReservation,
  getUserReservations,
  getRestaurantReservations,
  updateReservation,
  cancelReservation,
  checkAvailability,
  getReservationStats
};