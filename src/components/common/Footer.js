// src/components/common/Footer.js
import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link, 
  IconButton 
} from '@mui/material';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  LinkedIn 
} from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[900],
        color: 'white',
      }}
      className="app-footer"
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              DineEase
            </Typography>
            <Typography variant="body2" color="white">
              Find and book the best restaurants in your area.
              Experience hassle-free dining with our reservation system.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="LinkedIn">
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box>
              <Link href="/" color="inherit" display="block" sx={{ mb: 1 }}>
                Home
              </Link>
              <Link href="/search" color="inherit" display="block" sx={{ mb: 1 }}>
                Find Restaurants
              </Link>
              <Link href="/login" color="inherit" display="block" sx={{ mb: 1 }}>
                Login
              </Link>
              <Link href="/register" color="inherit" display="block" sx={{ mb: 1 }}>
                Register
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" color="white" paragraph>
              Email: info@dineease.com
            </Typography>
            <Typography variant="body2" color="white" paragraph>
              Phone: (123) 456-7890
            </Typography>
            <Typography variant="body2" color="white">
              Address: 123 Main Street, City, State 12345
            </Typography>
          </Grid>
        </Grid>
        
        <Box mt={3} pt={3} borderTop={1} borderColor="grey.600">
          <Typography variant="body2" color="white" align="center">
            &copy; {new Date().getFullYear()} DineEase. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;