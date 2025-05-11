// src/pages/customer/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Rating,
  CircularProgress,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { Search as SearchIcon } from '@mui/icons-material';
import { getAllRestaurants } from '../../services/restaurantService';
import { toast } from 'react-toastify';

const Home = () => {
  const navigate = useNavigate();
  
  // Search form state
  const [searchParams, setSearchParams] = useState({
    date: new Date(),
    time: new Date(new Date().setHours(19, 0, 0, 0)), // Default to 7:00 PM
    partySize: 2,
    location: ''
  });
  
  // Featured restaurants state
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch featured restaurants on component mount
  useEffect(() => {
    const fetchFeaturedRestaurants = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getAllRestaurants();
        
        if (response.success) {
          // Sort by ratings and take top 4
          const sortedRestaurants = response.restaurants.sort((a, b) => 
            (b.average_rating || 0) - (a.average_rating || 0)
          );
          
          setFeaturedRestaurants(sortedRestaurants.slice(0, 4));
        } else {
          setError(response.message || 'Failed to fetch featured restaurants');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedRestaurants();
  }, []);
  
  // Handle search form input changes
  const handleInputChange = (field, value) => {
    setSearchParams({
      ...searchParams,
      [field]: value
    });
  };
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Format date and time for URL parameters
    const formattedDate = format(searchParams.date, 'yyyy-MM-dd');
    const formattedTime = format(searchParams.time, 'HH:mm');
    
    // Navigate to search page with parameters
    navigate(`/search?date=${formattedDate}&time=${formattedTime}&partySize=${searchParams.partySize}&location=${encodeURIComponent(searchParams.location || '')}`);
  };
  
  // Generate dollar signs for cost rating
  const getCostRating = (rating = 0) => {
    return '$'.repeat(rating);
  };
  
  return (
    <>
      {/* Hero Section */}
      <Box className="hero-section">
        <Container maxWidth="md" className="hero-content">
          <Typography variant="h2" component="h1" gutterBottom>
            Find Your Perfect Dining Experience
          </Typography>
          <Typography variant="h5" paragraph>
            Discover and book the best restaurants in your area
          </Typography>
          
          {/* Search Form */}
          <Paper elevation={3} className="search-container">
            <Box component="form" onSubmit={handleSearch} noValidate>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={searchParams.date}
                      onChange={(newValue) => handleInputChange('date', newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                      minDate={new Date()}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      label="Time"
                      value={searchParams.time}
                      onChange={(newValue) => handleInputChange('time', newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth required>
                    <InputLabel id="party-size-label">Party Size</InputLabel>
                    <Select
                      labelId="party-size-label"
                      id="party-size"
                      value={searchParams.partySize}
                      label="Party Size"
                      onChange={(e) => handleInputChange('partySize', e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <MenuItem key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</MenuItem>
                      ))}
                      <MenuItem value={11}>More than 10</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="location"
                    label="City or Zip Code"
                    name="location"
                    value={searchParams.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box component="span" sx={{ mr: 1 }}>
                          <SearchIcon color="action" />
                        </Box>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={1}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<SearchIcon />}
                    sx={{ height: '56px' }}
                  >
                    Find
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>
      
      {/* Error message if any */}
      {error && (
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        </Container>
      )}
      
      {/* Featured Restaurants Section */}
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Featured Restaurants
        </Typography>
        <Typography variant="subtitle1" paragraph align="center" sx={{ mb: 4 }}>
          Discover our most popular dining destinations
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : featuredRestaurants.length > 0 ? (
          <Grid container spacing={4}>
            {featuredRestaurants.map((restaurant) => (
              <Grid item key={restaurant.id} xs={12} sm={6} md={3}>
                <Card className="restaurant-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={restaurant.primary_photo 
                      ? `${process.env.REACT_APP_API_URL}${restaurant.primary_photo}` 
                      : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
                    alt={restaurant.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h3">
                      {restaurant.name}
                    </Typography>
                    
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <Rating 
                        value={Number(restaurant.average_rating) || 0} 
                        precision={0.1} 
                        readOnly 
                        size="small" 
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {Number(restaurant.average_rating) ? Number(restaurant.average_rating).toFixed(1) : 'No ratings'}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {restaurant.cuisine_type} • {getCostRating(restaurant.cost_rating)}
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      {restaurant.description?.length > 100 
                        ? `${restaurant.description.substring(0, 100)}...` 
                        : restaurant.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                    >
                      Book Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1">
              No featured restaurants available at the moment.
            </Typography>
          </Box>
        )}
      </Container>
      
      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center">
            How It Works
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h5" gutterBottom>
                  1. Search
                </Typography>
                <Typography>
                  Find restaurants by location, date, time, and party size
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h5" gutterBottom>
                  2. Choose
                </Typography>
                <Typography>
                  Browse restaurant details, menus, and reviews
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Typography variant="h5" gutterBottom>
                  3. Book
                </Typography>
                <Typography>
                  Reserve your table with instant confirmation
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      {/* Call to Action Section */}
      <Container maxWidth="md" sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Are You a Restaurant Owner?
        </Typography>
        <Typography variant="body1" paragraph>
          Join our platform to increase your visibility and streamline your reservation process.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={() => navigate('/register')}
          sx={{ mt: 2 }}
        >
          Register Your Restaurant
        </Button>
      </Container>
    </>
  );
};

export default Home;
