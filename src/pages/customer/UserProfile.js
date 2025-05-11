// src/pages/customer/UserProfile.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  TextField, 
  Divider, 
  Card, 
  CardContent, 
  CircularProgress,
  InputAdornment,
  IconButton,
  Avatar,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, Edit } from '@mui/icons-material';
import AuthContext from '../../context/AuthContext';
import { changePassword } from '../../services/authService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, token } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Profile update form
  const profileFormik = useFormik({
    initialValues: {
      first_name: currentUser?.first_name || '',
      last_name: currentUser?.last_name || '',
      phone: currentUser?.phone || ''
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required('First name is required'),
      last_name: Yup.string().required('Last name is required'),
      phone: Yup.string().matches(
        /^(\+\d{1,3})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/,
        'Phone number is not valid'
      ).optional()
    }),
    onSubmit: async (values) => {
      setError(null);
      const result = await updateProfile(values);
      
      if (result.success) {
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        setError(result.message || 'Failed to update profile');
        toast.error(result.message || 'Failed to update profile');
      }
    }
  });
  
  // Password change form
  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      new_password: '',
      confirm_password: ''
    },
    validationSchema: Yup.object({
      current_password: Yup.string().required('Current password is required'),
      new_password: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
      confirm_password: Yup.string().oneOf([Yup.ref('new_password'), null], 'Passwords must match').required('Confirm your password')
    }),
    onSubmit: async (values) => {
      setError(null);
      try {
        const passwordData = {
          current_password: values.current_password,
          new_password: values.new_password
        };
        
        const response = await changePassword(passwordData, token);
        
        if (response.success) {
          toast.success('Password updated successfully');
          passwordFormik.resetForm();
          setPasswordFormOpen(false);
        } else {
          setError(response.message || 'Failed to update password');
          toast.error(response.message || 'Failed to update password');
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred');
        toast.error(err.message || 'An unexpected error occurred');
      }
    }
  });
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field]
    });
  };
  
  // Calculate member since date
  const getMemberSinceDate = () => {
    if (!currentUser?.created_at) return 'N/A';
    
    try {
      return format(new Date(currentUser.created_at), 'MMMM yyyy');
    } catch {
      return 'N/A';
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Profile Information */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Account Information
              </Typography>
              
              {!editing && (
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {editing ? (
              <Box component="form" onSubmit={profileFormik.handleSubmit} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="first_name"
                      name="first_name"
                      label="First Name"
                      value={profileFormik.values.first_name}
                      onChange={profileFormik.handleChange}
                      error={profileFormik.touched.first_name && Boolean(profileFormik.errors.first_name)}
                      helperText={profileFormik.touched.first_name && profileFormik.errors.first_name}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="last_name"
                      name="last_name"
                      label="Last Name"
                      value={profileFormik.values.last_name}
                      onChange={profileFormik.handleChange}
                      error={profileFormik.touched.last_name && Boolean(profileFormik.errors.last_name)}
                      helperText={profileFormik.touched.last_name && profileFormik.errors.last_name}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="phone"
                      name="phone"
                      label="Phone Number"
                      value={profileFormik.values.phone}
                      onChange={profileFormik.handleChange}
                      error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
                      helperText={profileFormik.touched.phone && profileFormik.errors.phone}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email Address"
                      value={currentUser?.email}
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setEditing(false)} 
                    sx={{ mr: 2 }}
                    disabled={profileFormik.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={profileFormik.isSubmitting}
                  >
                    {profileFormik.isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      First Name
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {currentUser?.first_name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Name
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {currentUser?.last_name}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email Address
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {currentUser?.email}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {currentUser?.phone || 'Not provided'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
          
          {/* Password Change */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Password
              </Typography>
              
              {!passwordFormOpen && (
                <Button 
                  variant="outlined" 
                  onClick={() => setPasswordFormOpen(true)}
                >
                  Change Password
                </Button>
              )}
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {passwordFormOpen ? (
              <Box component="form" onSubmit={passwordFormik.handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="current_password"
                  label="Current Password"
                  type={showPassword.currentPassword ? 'text' : 'password'}
                  id="current_password"
                  value={passwordFormik.values.current_password}
                  onChange={passwordFormik.handleChange}
                  error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
                  helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle current password visibility"
                          onClick={() => handleTogglePasswordVisibility('currentPassword')}
                          edge="end"
                        >
                          {showPassword.currentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="new_password"
                  label="New Password"
                  type={showPassword.newPassword ? 'text' : 'password'}
                  id="new_password"
                  value={passwordFormik.values.new_password}
                  onChange={passwordFormik.handleChange}
                  error={passwordFormik.touched.new_password && Boolean(passwordFormik.errors.new_password)}
                  helperText={passwordFormik.touched.new_password && passwordFormik.errors.new_password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => handleTogglePasswordVisibility('newPassword')}
                          edge="end"
                        >
                          {showPassword.newPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirm_password"
                  label="Confirm New Password"
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  id="confirm_password"
                  value={passwordFormik.values.confirm_password}
                  onChange={passwordFormik.handleChange}
                  error={passwordFormik.touched.confirm_password && Boolean(passwordFormik.errors.confirm_password)}
                  helperText={passwordFormik.touched.confirm_password && passwordFormik.errors.confirm_password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                          edge="end"
                        >
                          {showPassword.confirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setPasswordFormOpen(false)} 
                    sx={{ mr: 2 }}
                    disabled={passwordFormik.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained"
                    disabled={passwordFormik.isSubmitting}
                  >
                    {passwordFormik.isSubmitting ? <CircularProgress size={24} /> : 'Update Password'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1">
                Your password can be changed at any time to ensure account security.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Account Summary */}
          <Card className="info-card">
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Account Summary
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                  {currentUser?.first_name?.charAt(0) || 'U'}
                </Avatar>
              </Box>
              
              <Typography variant="body1" align="center" gutterBottom>
                {currentUser?.first_name} {currentUser?.last_name}
              </Typography>
              
              <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
                {currentUser?.email}
              </Typography>
              
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Account Type:</span>
                  <span>{currentUser?.role === 'restaurant_manager' ? 'Restaurant Manager' : 'Customer'}</span>
                </Typography>
                
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Member Since:</span>
                  <span>{getMemberSinceDate()}</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          {/* Quick Links */}
          <Card className="info-card" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h3" gutterBottom>
                Quick Links
              </Typography>
              
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mb: 2 }}
                onClick={() => navigate('/reservations')}
              >
                My Reservations
              </Button>
              
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mb: 2 }}
                onClick={() => navigate('/search')}
              >
                Find Restaurants
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfile;