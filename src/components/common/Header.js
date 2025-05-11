// src/components/common/Header.js
import React, { useState, useContext } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Container,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  Restaurant, 
  Logout,
  Dashboard,
  Settings,
  EventAvailable,
  Person,
  AdminPanelSettings
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Header = () => {
  const { currentUser, isAuthenticated, isAdmin, isRestaurantManager, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // State for user menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // State for mobile drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Handle user menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle user menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  // Toggle drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Render drawer content based on user role
  const drawerContent = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      {isAuthenticated ? (
        <>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2 }}>
              {currentUser.first_name.charAt(0)}
            </Avatar>
            <Typography variant="subtitle1">
              {currentUser.first_name} {currentUser.last_name}
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon>
                <Restaurant />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            
            <ListItem button component={Link} to="/search">
              <ListItemIcon>
                <Restaurant />
              </ListItemIcon>
              <ListItemText primary="Find Restaurants" />
            </ListItem>
            
            {isAuthenticated && (
              <ListItem button component={Link} to="/reservations">
                <ListItemIcon>
                  <EventAvailable />
                </ListItemIcon>
                <ListItemText primary="My Reservations" />
              </ListItem>
            )}
            
            {isAuthenticated && (
              <ListItem button component={Link} to="/profile">
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItem>
            )}
            
            {isRestaurantManager && (
              <ListItem button component={Link} to="/restaurant-dashboard">
                <ListItemIcon>
                  <Dashboard />
                </ListItemIcon>
                <ListItemText primary="Restaurant Dashboard" />
              </ListItem>
            )}
            
            {isAdmin && (
              <ListItem button component={Link} to="/admin-dashboard">
                <ListItemIcon>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText primary="Admin Dashboard" />
              </ListItem>
            )}
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      ) : (
        <List>
          <ListItem button component={Link} to="/">
            <ListItemIcon>
              <Restaurant />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          
          <ListItem button component={Link} to="/search">
            <ListItemIcon>
              <Restaurant />
            </ListItemIcon>
            <ListItemText primary="Find Restaurants" />
          </ListItem>
          
          <ListItem button component={Link} to="/login">
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText primary="Login" />
          </ListItem>
          
          <ListItem button component={Link} to="/register">
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText primary="Register" />
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <AppBar position="sticky" className="app-header">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Mobile menu button */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo/App name */}
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: 'flex',
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            DineEase
          </Typography>
          
          {/* Desktop navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
              component={Link}
              to="/"
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Home
            </Button>
            <Button
              component={Link}
              to="/search"
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Find Restaurants
            </Button>
            
            {isRestaurantManager && (
              <Button
                component={Link}
                to="/restaurant-dashboard"
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Restaurant Dashboard
              </Button>
            )}
            
            {isAdmin && (
              <Button
                component={Link}
                to="/admin-dashboard"
                sx={{ my: 2, color: 'white', display: 'block' }}
              >
                Admin Dashboard
              </Button>
            )}
          </Box>
          
          {/* User menu (desktop) */}
          <Box sx={{ flexGrow: 0, display: { xs: 'none', md: 'flex' } }}>
            {isAuthenticated ? (
              <>
                <IconButton
                  onClick={handleMenuOpen}
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={open}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                    <Person fontSize="small" sx={{ mr: 1 }} /> Profile
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/reservations'); }}>
                    <EventAvailable fontSize="small" sx={{ mr: 1 }} /> My Reservations
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/login">Login</Button>
                <Button color="inherit" component={Link} to="/register">Register</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
      
      {/* Mobile drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent()}
      </Drawer>
    </AppBar>
  );
};

export default Header;