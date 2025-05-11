// src/pages/auth/Login.js
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Formik validation schema
  const validationSchema = Yup.object({
    email: Yup
      .string()
      .email('Enter a valid email')
      .required('Email is required'),
    password: Yup
      .string()
      .min(6, 'Password should be of minimum 6 characters length')
      .required('Password is required'),
  });

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      const result = await login(values);
      
      if (!result.success) {
        // Error is handled by the context via toast
        console.error('Login failed:', result.message);
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
            Login to DineEase
          </Typography>
          
          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Login'}
            </Button>
            
            <Grid container>
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    {"Don't have an account? Sign Up"}
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

export default Login;