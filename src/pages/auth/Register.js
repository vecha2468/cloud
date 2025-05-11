// src/pages/auth/Register.js
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import AuthContext from '../../context/AuthContext';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  // Formik validation schema
  const validationSchema = Yup.object({
    first_name: Yup
      .string()
      .required('First name is required'),
    last_name: Yup
      .string()
      .required('Last name is required'),
    email: Yup
      .string()
      .email('Enter a valid email')
      .required('Email is required'),
    phone: Yup
      .string()
      .matches(
        /^(\+\d{1,3})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/,
        'Phone number is not valid'
      )
      .optional(),
    password: Yup
      .string()
      .min(6, 'Password should be of minimum 6 characters length')
      .required('Password is required'),
    confirmPassword: Yup
      .string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm your password'),
  });

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      // Remove confirmPassword before submitting
      const { confirmPassword, ...registerData } = values;
      
      const result = await register(registerData);
      
      if (!result.success) {
        // Error is handled by the context via toast
        console.error('Registration failed:', result.message);
      }
      // If successful, the context will handle navigation
    },
  });

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} className="auth-container">
        <Box p={4}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            Create an Account
          </Typography>
          
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="first_name"
                  required
                  fullWidth
                  id="first_name"
                  label="First Name"
                  autoFocus
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                  helperText={formik.touched.first_name && formik.errors.first_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="last_name"
                  label="Last Name"
                  name="last_name"
                  autoComplete="family-name"
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                  helperText={formik.touched.last_name && formik.errors.last_name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  autoComplete="tel"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Register'}
            </Button>
            
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Already have an account? Sign in
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;