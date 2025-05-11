// src/components/common/AdminRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import AuthContext from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Only allow access to admins
  return isAuthenticated && isAdmin ? 
    children : 
    <Navigate to="/login" />;
};

export default AdminRoute;