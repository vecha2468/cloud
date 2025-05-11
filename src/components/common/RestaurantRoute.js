// src/components/common/RestaurantRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import AuthContext from '../../context/AuthContext';

const RestaurantRoute = ({ children }) => {
  const { isAuthenticated, isRestaurantManager, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Allow access to restaurant managers and admins
  return isAuthenticated && (isRestaurantManager || isAdmin) ? 
    children : 
    <Navigate to="/login" />;
};

export default RestaurantRoute;