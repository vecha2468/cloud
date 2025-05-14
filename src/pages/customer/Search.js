// src/pages/customer/Search.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Rating,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Slider
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format, parse } from 'date-fns';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon, 
  RestaurantMenu, 
  Star, 
  AttachMoney
} from '@mui/icons-material';
import { searchRestaurants } from '../../services/restaurantService';
import { toast } from 'react-toastify';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // Parse and set initial search parameters from URL
  const initialSearchParams = {
    date: queryParams.get('date') ? new Date(queryParams.get('date')) : new Date(),
    time: queryParams.get('time') ? 
      parse(queryParams.get('time'), 'HH:mm', new Date()) : 
      new Date(new Date().setHours(19, 0, 0, 0)), // Default to 7:00 PM
    partySize: parseInt(queryParams.get('partySize')) || 2,
    location: queryParams.get('location') || ''
  };
  
  // State for search parameters
  const [searchParams, setSearchParams] = useState(initialSearchParams);
  
  // State for filter options
  const [filters, setFilters] = useState({
    cuisines: [],
    rating: 0,
    priceRange: [1, 5],
    showFilters: false
  });
  
  // State for search results
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cuisine options for filter
  const cuisineOptions = ['Italian', 'Chinese', 'Japanese', 'Indian', 'Mexican', 'American', 'French', 'Seafood', 'International'];
  
  // Fetch restaurants on component mount or when search params change
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Format date for API request
        const formattedDate = format(searchParams.date, 'yyyy-MM-dd');
        const dayOfWeek=searchParams.date.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedTime = format(searchParams.time, 'HH:mm');
        
        // Prepare search parameters
        const apiParams = {
          date: formattedDate,
          time: formattedTime,
          day_of_week:dayOfWeek,
                    party_size: searchParams.partySize,
          location: searchParams.location || undefined,
          cuisine_type: filters.cuisines.length > 0 ? filters.cuisines[0] : undefined,
          rating: filters.rating > 0 ? filters.rating : undefined,
          price_range: filters.priceRange[1] < 5 ? filters.priceRange[1] : undefined
        };
  
        
        
        const response = await searchRestaurants(apiParams);
        
        if (response.success) {
          setRestaurants(response.restaurants || []);
        } else {
          setError(response.message || 'Failed to fetch restaurants');
          toast.error(response.message || 'Failed to fetch restaurants');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        toast.error('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, [searchParams, filters]);
  
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
    
    // Update URL parameters
    const formattedDate = format(searchParams.date, 'yyyy-MM-dd');
    const formattedTime = format(searchParams.time, 'HH:mm');
    
    navigate(
      `/search?date=${formattedDate}&time=${formattedTime}&partySize=${searchParams.partySize}&location=${encodeURIComponent(searchParams.location || '')}`,
      { replace: true }
    );
  };
  
  // Toggle cuisine filter
  const handleCuisineToggle = (cuisine) => {
    const currentCuisines = [...filters.cuisines];
    const cuisineIndex = currentCuisines.indexOf(cuisine);
    
    if (cuisineIndex === -1) {
      currentCuisines.push(cuisine);
    } else {
      currentCuisines.splice(cuisineIndex, 1);
    }
    
    setFilters({
      ...filters,
      cuisines: currentCuisines
    });
  };
  
  // Handle rating filter change
  const handleRatingChange = (event, newValue) => {
    setFilters({
      ...filters,
      rating: newValue
    });
  };
  
  // Handle price range filter change
  const handlePriceRangeChange = (event, newValue) => {
    setFilters({
      ...filters,
      priceRange: newValue
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      ...filters,
      cuisines: [],
      rating: 0,
      priceRange: [1, 5]
    });
  };
  
  // Toggle filter panel visibility
  const toggleFilters = () => {
    setFilters({
      ...filters,
      showFilters: !filters.showFilters
    });
  };
  
  console.log(restaurants)
  // Generate dollar s  igns for cost rating
  const getCostRating = (rating) => {
   const costRatings = {
     1: '$ (Budget)',
     2: '$$ (Moderate)',
     3: '$$$ (High-End)',
     4: '$$$$ (Luxury)',
     5: '$$$$$ (Ultra Luxury)'
   };
    return costRatings[rating] || '$ (Budget)';
}
  
  // Handle reservation time selection
  const handleTimeSelection = (restaurantId, time) => {
    const formattedDate = format(searchParams.date, 'yyyy-MM-dd');
    navigate(`/restaurant/${restaurantId}?date=${formattedDate}&time=${time}&partySize=${searchParams.partySize}`);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Find Available Restaurants
      </Typography>
      
      {/* Search Form */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch} noValidate>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2.5}>
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
            
            <Grid item xs={12} sm={6} md={2.5}>
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
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ height: '56px', flexGrow: 1 }}
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={toggleFilters}
                  sx={{ height: '56px' }}
                >
                  <FilterIcon />
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {/* Filters Section */}
          {filters.showFilters && (
            <Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={3}>
                {/* Cuisine Filters */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Cuisine
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {cuisineOptions.map((cuisine) => (
                      <Chip
                        key={cuisine}
                        label={cuisine}
                        onClick={() => handleCuisineToggle(cuisine)}
                        color={filters.cuisines.includes(cuisine) ? 'primary' : 'default'}
                        variant={filters.cuisines.includes(cuisine) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Grid>
                
                {/* Rating Filter */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Minimum Rating
                  </Typography>
                  <Box sx={{ width: '100%', px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 2 }}>
                        <Rating
                          value={filters.rating}
                          precision={0.5}
                          onChange={handleRatingChange}
                        />
                      </Box>
                      <Typography>
                        {filters.rating > 0 ? `${filters.rating}+` : 'Any'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Price Range Filter */}
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" gutterBottom>
                    Price Range
                  </Typography>
                  <Box sx={{ width: '100%', px: 2 }}>
                    <Slider
                      value={filters.priceRange}
                      onChange={handlePriceRangeChange}
                      valueLabelDisplay="auto"
                      min={1}
                      max={5}
                      marks={[
                        { value: 1, label: '$' },
                        { value: 2, label: '$$' },
                        { value: 3, label: '$$$' },
                        { value: 4, label: '$$$$' },
                        { value: 5, label: '$$$$$' }
                      ]}
                    />
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={resetFilters} sx={{ mr: 1 }}>
                  Reset Filters
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Results Section */}
      <Typography variant="h5" gutterBottom>
        {loading ? 'Searching...' : `${restaurants.length} restaurants available`}
      </Typography>
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : restaurants.length > 0 ? (
        <Grid container spacing={3}>
          {restaurants.map((restaurant) => (
            <Grid item key={restaurant.id} xs={12}>
              <Card sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                <CardMedia
                  component="img"
                  sx={{ 
                    width: { xs: '100%', sm: 200 },
                    height: { xs: 200, sm: 'auto' }
                  }}
                  image={restaurant.primary_photo ? `${process.env.REACT_APP_API_URL.replace('/api', '')}${restaurant.primary_photo}
` : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
                  alt={restaurant.name}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" component="h2">
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
                        {Number(restaurant.average_rating) ? `${Number(restaurant.average_rating).toFixed(1)} (${restaurant.reviews_count} reviews)` : 'No reviews yet'}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {restaurant.cuisine_type} • {getCostRating(restaurant.cost_rating)}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {restaurant.address_line1}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Booked {restaurant.bookings_today || 0} times today
                    </Typography>
                    
                    <Typography variant="body2">
                      {restaurant.description?.length > 150 
                        ? `${restaurant.description.substring(0, 150)}...` 
                        : restaurant.description}
                    </Typography>
                  </CardContent>
                  
                  <Box sx={{ 
                    mt: 'auto', 
                    p: 2, 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'center', md: 'flex-start' }
                  }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Available times for {searchParams.partySize} {searchParams.partySize === 1 ? 'person' : 'people'}:
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                      {restaurant.available_times && restaurant.available_times.map((time) => (
                        <Button
                          key={time}
                          variant="outlined"
                          size="small"
                          className="time-button"
                          onClick={() => handleTimeSelection(restaurant.id, time)}
                        >
                          {time}
                        </Button>
                      ))}
                      {!restaurant.available_times && (
                        <Typography variant="body2" color="text.secondary">
                          No available times for the selected criteria
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', my: 4 }}>
          <Typography variant="h6" paragraph>
            No restaurants found matching your criteria.
          </Typography>
          <Typography variant="body1">
            Try adjusting your search filters or location to find more options.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Search;
