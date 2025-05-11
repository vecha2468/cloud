// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Layout Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Customer Pages
import Home from './pages/customer/Home';
import Search from './pages/customer/Search';
import RestaurantDetails from './pages/customer/RestaurantDetails';
import UserReservations from './pages/customer/UserReservations';
import UserProfile from './pages/customer/UserProfile';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Restaurant Manager Pages
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantForm from './pages/restaurant/RestaurantForm';
import RestaurantSettings from './pages/restaurant/Settings';
import ReservationDetail from './pages/restaurant/ReservationDetail';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminRestaurants from './pages/admin/Restaurants';
import AdminUsers from './pages/admin/Users';

// Routes
import PrivateRoute from './components/common/PrivateRoute';
import RestaurantRoute from './components/common/RestaurantRoute';
import AdminRoute from './components/common/AdminRoute';

// Theme definition
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
});

function App() {
  console.log('App component is rendering');
  
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<Search />} />
              <Route path="/restaurant/:id" element={<RestaurantDetails />} />
              
              {/* Protected Customer Routes */}
              <Route 
                path="/reservations" 
                element={
                  <PrivateRoute>
                    <UserReservations />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                } 
              />
              
              {/* Restaurant Manager Routes */}
              <Route 
                path="/restaurant-dashboard" 
                element={
                  <RestaurantRoute>
                    <RestaurantDashboard />
                  </RestaurantRoute>
                } 
              />
              <Route 
                path="/restaurant-form" 
                element={
                  <RestaurantRoute>
                    <RestaurantForm />
                  </RestaurantRoute>
                } 
              />
              <Route 
                path="/restaurant-form/:id" 
                element={
                  <RestaurantRoute>
                    <RestaurantForm />
                  </RestaurantRoute>
                } 
              />
              <Route 
                path="/restaurant-settings" 
                element={
                  <RestaurantRoute>
                    <RestaurantSettings />
                  </RestaurantRoute>
                } 
              />
              <Route 
                path="/reservations/:id" 
                element={
                  <RestaurantRoute>
                    <ReservationDetail />
                  </RestaurantRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin-restaurants" 
                element={
                  <AdminRoute>
                    <AdminRestaurants />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin-users" 
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } 
              />
              
              {/* 404 Catch-all */}
              <Route path="*" element={<div>Page not found</div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;