// src/pages/customer/RestaurantDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Paper, 
  Tabs, 
  Tab, 
  Divider, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  CircularProgress,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert
} from '@mui/material';
import { 
  LocationOn, 
  Phone, 
  Language, 
  AccessTime, 
  EventAvailable, 
  RestaurantMenu, 
  Info,
  Event,
  Person,
  Message
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { format, addDays, parse, parseISO, format as formatDate } from 'date-fns';
import AuthContext from '../../context/AuthContext';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { getRestaurantById } from '../../services/restaurantService';
import { createReservation } from '../../services/reservationService';
import { getRestaurantReviews, submitReview } from '../../services/reviewService';
import { toast } from 'react-toastify';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`restaurant-tabpanel-${index}`}
      aria-labelledby={`restaurant-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RestaurantDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, token } = useContext(AuthContext);
  const queryParams = new URLSearchParams(location.search);
  
  // Load Google Maps API
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });
  
  // State for restaurant data
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for reviews
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for reservation

 const [reservationParams, setReservationParams] = useState({
  date: queryParams.get('date') ? parseISO(queryParams.get('date'))  : new Date(),
  time: queryParams.get('time') 
    ? parse(queryParams.get('time').substring(0, 5), 'HH:mm', new Date())  // Strip seconds
    : new Date(new Date().setHours(19, 0, 0, 0)), // Default to 7:00 PM
  partySize: parseInt(queryParams.get('partySize')) || 2,
  specialRequest: ''
});
console.log(queryParams,queryParams.get('time'),queryParams.get('date'),new Date(queryParams.get('date')),new Date() );

  // State for reservation confirmation dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  
  // State for review form
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  
  // Fetch restaurant data and reviews on component mount
  useEffect(() => {
    const fetchRestaurantData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch restaurant details
        const response = await getRestaurantById(id);
        
        if (response.success) {
          setRestaurant(response.restaurant);
        } else {
          setError(response.message || 'Failed to fetch restaurant details');
          toast.error(response.message || 'Failed to fetch restaurant details');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        toast.error('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchReviews = async () => {
      setLoadingReviews(true);
      
      try {
        const response = await getRestaurantReviews(id);
        
        if (response.success) {
          setReviews(response.reviews || []);
          setReviewsSummary(response.summary || null);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    
    fetchRestaurantData();
    fetchReviews();
  }, [id]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle reservation form changes
  const handleReservationChange = (field, value) => {
    setReservationParams({
      ...reservationParams,
      [field]: value
    });
  };
  
  // Handle reservation form submission
  const handleReservationSubmit = (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: location.pathname + location.search,
          message: 'Please log in to make a reservation'
        } 
      });
      return;
    }
    
    // Open confirmation dialog
    setOpenDialog(true);
  };
  
  // Handle reservation confirmation
  const handleReservationConfirm = async () => {
    setReservationSubmitting(true);
    
    try {
      // Format date and time for API
      const formattedDate = format(reservationParams.date, 'yyyy-MM-dd');
      const formattedTime = format(reservationParams.time, 'HH:mm');
      
      // Prepare reservation data
      const reservationData = {
        restaurant_id: restaurant.id,
        reservation_date: formattedDate,
        reservation_time: formattedTime,
        party_size: reservationParams.partySize,
        special_request: reservationParams.specialRequest || undefined
      };
      
      // Submit reservation
      const response = await createReservation(reservationData, token);
      
      if (response.success) {
        setOpenDialog(false);
        toast.success('Reservation confirmed successfully!');
        
        // Navigate to the reservations page
        navigate('/reservations', { 
          state: { 
            message: 'Reservation confirmed successfully!' 
          } 
        });
      } else {
        toast.error(response.message || 'Failed to create reservation');
        setOpenDialog(false);
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again later.');
      setOpenDialog(false);
    } finally {
      setReservationSubmitting(false);
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  
  // Handle review form changes
  const handleReviewChange = (field, value) => {
    setReviewForm({
      ...reviewForm,
      [field]: value
    });
  };
  
  // Handle review form submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please log in to leave a review'
        } 
      });
      return;
    }
    
    setReviewSubmitting(true);
    
    try {
      // Prepare review data
      const reviewData = {
        restaurant_id: restaurant.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      };
      
      // Submit review
      const response = await submitReview(reviewData, token);
      
      if (response.success) {
        toast.success('Review submitted successfully!');
        
        // Reset form
        setReviewForm({
          rating: 0,
          comment: ''
        });
        
        // Refresh reviews
        const reviewsResponse = await getRestaurantReviews(id);
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.reviews || []);
          setReviewsSummary(reviewsResponse.summary || null);
        }
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setReviewSubmitting(false);
    }
  };
  
  // Generate dollar signs for cost rating
  const getCostRating = (rating = 0) => {
    return '$'.repeat(rating);
  };
  
  // Format date for display
  const formatReviewDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return formatDate(date, 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };
  
  // Map container style
  const mapContainerStyle = {
    width: '100%',
    height: '300px'
  };
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If error or restaurant not found, show error message
  if (error || !restaurant) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error || 'Restaurant not found'}
        </Alert>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Restaurant Not Found
          </Typography>
          <Typography paragraph>
            The restaurant you are looking for does not exist or has been removed.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/search')}
          >
            Search Restaurants
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Restaurant Header */}
      <Box className="restaurant-header">
        <Typography variant="h3" component="h1" gutterBottom>
          {restaurant.name}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Rating value={Number(restaurant.average_rating) || 0} precision={0.1} readOnly />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {Number(restaurant.average_rating) 
                ? `${Number(restaurant.average_rating).toFixed(1)} (${restaurant.reviews_count} reviews)`
                : 'No reviews yet'}
            </Typography>
          </Box>
          
          <Chip 
            label={restaurant.cuisine_type} 
            variant="outlined" 
            color="primary" 
            size="small" 
          />
          
          <Typography variant="body2">
            {getCostRating(restaurant.cost_rating)}
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          {restaurant.description}
        </Typography>
      </Box>
      
      {/* Restaurant Photos */}
      <Box className="restaurant-photos" sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          {restaurant.photos && restaurant.photos.length > 0 ? (
            restaurant.photos.map((photo, index) => (
              <Grid 
                item 
                xs={12} 
                sm={index === 0 ? 12 : 6} 
                md={index === 0 ? 8 : 4} 
                key={photo.id}
              >
                <img 
                  src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.photo_url}`}
                  alt={`${restaurant.name} - ${index + 1}`} 
                  style={{ 
                    width: '100%', 
                    height: index === 0 ? '400px' : '200px', 
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }} 
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <img 
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
                alt={restaurant.name} 
                style={{ 
                  width: '100%', 
                  height: '400px', 
                  objectFit: 'cover',
                  borderRadius: '8px'
                }} 
              />
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Tabs Section */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Information" icon={<Info />} iconPosition="start" />
          <Tab label="Reservation" icon={<EventAvailable />} iconPosition="start" />
          <Tab label="Reviews" icon={<Message />} iconPosition="start" />
        </Tabs>
        
        {/* Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Location & Contact
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <LocationOn color="primary" sx={{ mr: 2, mt: 0.5 }} />
                  <Typography>
                    {restaurant.address_line1}<br />
                    {restaurant.address_line2 && `${restaurant.address_line2}`}<br />
                    {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone color="primary" sx={{ mr: 2 }} />
                  <Typography>
                    {restaurant.phone}
                  </Typography>
                </Box>
                
                {restaurant.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Language color="primary" sx={{ mr: 2 }} />
                    <Typography>
                      <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                        {restaurant.website.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Hours of Operation
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                {restaurant.operating_hours && restaurant.operating_hours.map((hours, index) => (
                  <Box 
                    key={hours.day_of_week} 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: index < restaurant.operating_hours.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {hours.day_of_week}
                    </Typography>
                    <Typography variant="body2">
                      {hours.opening_time} - {hours.closing_time}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Location
              </Typography>
              
              {isMapLoaded && restaurant.latitude && restaurant.longitude ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={{
                    lat: Number(restaurant.latitude),
                    lng: Number(restaurant.longitude)
                  }}
                  zoom={15}
                >
                  <Marker
  position={{
    lat: Number(restaurant.latitude),
    lng: Number(restaurant.longitude)
  }}
  icon={{
    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
  }}
/>
  
    
                </GoogleMap>
              ) : (
                <Paper
                  sx={{
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {isMapLoaded ? 'Location data not available' : 'Loading map...'}
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Reservation Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Make a Reservation
          </Typography>
          
          <Box component="form" onSubmit={handleReservationSubmit} noValidate className="reservation-form">
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={reservationParams.date}
                    onChange={(newValue) => handleReservationChange('date', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDate={new Date()}
                    maxDate={addDays(new Date(), 30)}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Time"
                    value={reservationParams.time}
                    onChange={(newValue) => handleReservationChange('time', newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="party-size-label">Party Size</InputLabel>
                  <Select
                    labelId="party-size-label"
                    id="party-size"
                    value={reservationParams.partySize}
                    label="Party Size"
                    onChange={(e) => handleReservationChange('partySize', e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <MenuItem key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</MenuItem>
                    ))}
                    <MenuItem value={11}>More than 10</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="special-request"
                  label="Special Request (Optional)"
                  name="specialRequest"
                  value={reservationParams.specialRequest}
                  onChange={(e) => handleReservationChange('specialRequest', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={!isAuthenticated}
                >
                  {isAuthenticated ? 'Book Table' : 'Login to Book Table'}
                </Button>
                {!isAuthenticated && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    Please log in to make a reservation
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Reviews Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Customer Reviews
              </Typography>
              
              {loadingReviews ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reviews.length > 0 ? (
                <List>
                  {reviews.map((review) => (
                    <ListItem 
                      key={review.id} 
                      alignItems="flex-start"
                      sx={{ 
                        px: 0,
                        borderBottom: '1px solid #eee',
                        mb: 2
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar>{review.first_name?.charAt(0) || 'U'}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography component="span" variant="subtitle1">
                              {review.first_name} {review.last_name}
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {formatReviewDate(review.created_at)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Rating value={review.rating} size="small" readOnly sx={{ mt: 1, mb: 1 }} />
                            <Typography variant="body2" color="text.primary" paragraph>
                              {review.comment}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1">
                    No reviews yet. Be the first to review!
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Paper elevation={1} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Write a Review
                </Typography>
                
                <Box component="form" onSubmit={handleReviewSubmit} noValidate>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Your Rating
                    </Typography>
                    <Rating
                      name="rating"
                      value={reviewForm.rating}
                      onChange={(event, newValue) => {
                        handleReviewChange('rating', newValue);
                      }}
                      size="large"
                    />
                  </Box>
                  
                  <TextField
                    fullWidth
                    id="review-comment"
                    label="Your Review"
                    name="comment"
                    value={reviewForm.comment}
                    onChange={(e) => handleReviewChange('comment', e.target.value)}
                    multiline
                    rows={5}
                    margin="normal"
                    required
                  />
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    disabled={!isAuthenticated || reviewForm.rating === 0 || !reviewForm.comment || reviewSubmitting}
                  >
                    {reviewSubmitting ? <CircularProgress size={24} /> : 'Submit Review'}
                  </Button>
                  
                  {!isAuthenticated && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Please log in to leave a review
                    </Typography>
                  )}
                </Box>
              </Paper>
              
              {reviewsSummary && (
                <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Rating Summary
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" component="div" gutterBottom>
                      {Number(reviewsSummary.average_rating) ? Number(reviewsSummary.average_rating).toFixed(1) : '0.0'}
                      <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                        out of 5
                      </Typography>
                    </Typography>
                    <Rating 
                      value={Number(reviewsSummary.average_rating) || 0} 
                      precision={0.1} 
                      readOnly 
                      sx={{ mb: 1 }} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      Based on {reviewsSummary.total_reviews || 0} reviews
                    </Typography>
                  </Box>
                  
                  <Box>
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewsSummary[`${rating}_star`] || 0;
                      const percentage = reviewsSummary.total_reviews 
                        ? Math.round((count / reviewsSummary.total_reviews) * 100) 
                        : 0;
                      
                      return (
                        <Box 
                          key={rating}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            mb: 0.5
                          }}
                        >
                          <Typography variant="body2" sx={{ width: 50 }}>
                            {rating} stars
                          </Typography>
                          <Box 
                            sx={{ 
                              flexGrow: 1, 
                              ml: 1, 
                              mr: 2,
                              bgcolor: 'grey.200', 
                              borderRadius: 1,
                              overflow: 'hidden'
                            }}
                          >
                            <Box 
                              sx={{ 
                                width: `${percentage}%`, 
                                bgcolor: 'primary.main',
                                height: 8
                              }} 
                            />
                          </Box>
                          <Typography variant="body2">
                            {percentage}%
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      {/* Reservation Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="reservation-dialog-title"
      >
        <DialogTitle id="reservation-dialog-title">
          Confirm Reservation
        </DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Please confirm your reservation details:
          </DialogContentText>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Event color="primary" sx={{ mr: 2 }} />
            <Typography>
              {format(reservationParams.date, 'yyyy-MM-dd')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AccessTime color="primary" sx={{ mr: 2 }} />
            <Typography>
              {format(reservationParams.time, 'HH:mm')}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person color="primary" sx={{ mr: 2 }} />
            <Typography>
              {reservationParams.partySize} {reservationParams.partySize === 1 ? 'person' : 'people'}
            </Typography>
          </Box>
          
          {reservationParams.specialRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Special Request:
              </Typography>
              <Typography variant="body2">
                {reservationParams.specialRequest}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              A confirmation will be sent to your email address.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={reservationSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleReservationConfirm} 
            color="primary" 
            variant="contained"
            disabled={reservationSubmitting}
          >
            {reservationSubmitting ? <CircularProgress size={24} /> : 'Confirm Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RestaurantDetails;
