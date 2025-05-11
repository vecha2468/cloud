// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

// API services
import { login, register, getCurrentUser, updateUser } from '../services/authService';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp < Date.now() / 1000;
    } catch (error) {
      return true;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        
        try {
          const response = await getCurrentUser(storedToken);
          if (response.success) {
            setCurrentUser(response.user);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          handleLogout();
        }
      } else if (storedToken) {
        // Token exists but is expired
        handleLogout();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Handle user login
  const handleLogin = async (credentials) => {
    setLoading(true);
    
    try {
      const response = await login(credentials);
      
      if (response.success) {
        setToken(response.token);
        setCurrentUser(response.user);
        localStorage.setItem('token', response.token);
        toast.success('Login successful!');
        
        // Redirect based on user role
        if (response.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (response.user.role === 'restaurant_manager') {
          navigate('/restaurant-dashboard');
        } else {
          navigate('/');
        }
        
        return { success: true };
      } else {
        toast.error(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred during login');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle user registration
  const handleRegister = async (userData) => {
    setLoading(true);
    
    try {
      const response = await register(userData);
      
      if (response.success) {
        setToken(response.token);
        setCurrentUser(response.user);
        localStorage.setItem('token', response.token);
        toast.success('Registration successful!');
        navigate('/');
        return { success: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred during registration');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('token');
    toast.info('You have been logged out');
    navigate('/login');
  };

  // Update user profile
  const handleUpdateProfile = async (userData) => {
    setLoading(true);
    
    try {
      const response = await updateUser(userData, token);
      
      if (response.success) {
        setCurrentUser(response.user);
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to update profile');
        return { success: false, message: response.message };
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred during profile update');
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    currentUser,
    token,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    isAuthenticated: !!token && !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isRestaurantManager: currentUser?.role === 'restaurant_manager',
    isCustomer: currentUser?.role === 'customer'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
