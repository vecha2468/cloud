// src/pages/restaurant/RestaurantForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Divider,
  MenuItem,
  FormControl,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardMedia,
  IconButton,
  Tooltip,
  InputLabel,
  Select
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  Save,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AuthContext from '../../context/AuthContext';
import { createRestaurant, updateRestaurant, getRestaurantById } from '../../services/restaurantService';
import { toast } from 'react-toastify';

// Cuisine types
const cuisineTypes = [
  'Italian',
  'Chinese',
  'Japanese',
  'Indian',
  'Mexican',
  'American',
  'French',
  'Mediterranean',
  'Thai',
  'Vietnamese',
  'Korean',
  'Spanish',
  'Greek',
  'Seafood',
  'BBQ',
  'Vegetarian',
  'Vegan',
  'Fusion',
  'International',
  'Other'
];

// Days of the week
const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Initial operating hours
const initialOperatingHours = daysOfWeek.map(day => ({
  day_of_week: day,
  opening_time: '09:00',
  closing_time: '22:00'
}));

const RestaurantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const isEditMode = !!id;
  
  // State for form steps
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Information', 'Location & Contact', 'Operating Hours', 'Photos'];
  
  // State for restaurant data
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // State for operating hours
  const [operatingHours, setOperatingHours] = useState(initialOperatingHours);
  
  // State for photos
  const [photos, setPhotos] = useState([]);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [makeFirstImagePrimary, setMakeFirstImagePrimary] = useState(false);
  
  // Fetch restaurant data if in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchRestaurant = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getRestaurantById(id);
        
        if (response.success) {
          setRestaurant(response.restaurant);
          
          // Set operating hours
          if (response.restaurant.operating_hours && response.restaurant.operating_hours.length > 0) {
            setOperatingHours(response.restaurant.operating_hours);
          }
          
          // Set photos
          if (response.restaurant.photos && response.restaurant.photos.length > 0) {
            setPhotos(response.restaurant.photos);
          }
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
    
    fetchRestaurant();
  }, [id, isEditMode]);
  
  // Validation schema for basic information
  const basicInfoSchema = Yup.object({
    name: Yup.string().required('Restaurant name is required'),
    description: Yup.string().required('Description is required'),
    cuisine_type: Yup.string().required('Cuisine type is required'),
    cost_rating: Yup.number().required('Cost rating is required').min(1).max(5)
  });
  
  // Validation schema for location and contact
  const locationContactSchema = Yup.object({
    address_line1: Yup.string().required('Address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    zip_code: Yup.string().required('ZIP code is required'),
    phone: Yup.string()
      .matches(/^(\+\d{1,3})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/, 'Phone number is not valid')
      .required('Phone number is required'),
    email: Yup.string().email('Invalid email address').optional(),
    website: Yup.string().url('Invalid URL').optional(),
    latitude: Yup.number().optional(),
    longitude: Yup.number().optional()
  });
  
  // Initialize formik
  const formik = useFormik({
    initialValues: {
      name: restaurant?.name || '',
      description: restaurant?.description || '',
      cuisine_type: restaurant?.cuisine_type || '',
      cost_rating: restaurant?.cost_rating || 2,
      address_line1: restaurant?.address_line1 || '',
      address_line2: restaurant?.address_line2 || '',
      city: restaurant?.city || '',
      state: restaurant?.state || '',
      zip_code: restaurant?.zip_code || '',
      phone: restaurant?.phone || '',
      email: restaurant?.email || '',
      website: restaurant?.website || '',
      latitude: restaurant?.latitude || '',
      longitude: restaurant?.longitude || ''
    },
    enableReinitialize: true,
    // Validate based on current step
    validate: values => {
      try {
        if (activeStep === 0) {
          basicInfoSchema.validateSync(values, { abortEarly: false });
        } else if (activeStep === 1) {
          locationContactSchema.validateSync(values, { abortEarly: false });
        }
        return {};
      } catch (err) {
        return err.inner.reduce((errors, error) => {
          errors[error.path] = error.message;
          return errors;
        }, {});
      }
    },
    onSubmit: async (values) => {
      setSubmitting(true);
      setError(null);
      
      try {
        // Create form data for API request
        const formData = new FormData();
        
        // Add basic restaurant data
        Object.keys(values).forEach(key => {
          if (values[key] !== '') {
            formData.append(key, values[key]);
          }
        });
        
        // Add operating hours as JSON string
        formData.append('operating_hours', JSON.stringify(operatingHours));
        
        // Add photo files
        photoFiles.forEach(file => {
          formData.append('photos', file);
        });
        
        // Add flag for making first image primary
        if (makeFirstImagePrimary) {
          formData.append('makeFirstImagePrimary', 'true');
        }
        
        let response;
        
        // Call appropriate API method based on mode
        if (isEditMode) {
          response = await updateRestaurant(id, formData, token);
        } else {
          for (let pair of formData.entries()) {
            console.log(pair[0]+ ':', pair[1]);
          }
          
          response = await createRestaurant(formData, token);
        }
        
        if (response.success) {
          toast.success(isEditMode 
            ? 'Restaurant updated successfully!' 
            : 'Restaurant created successfully!'
          );
          
          // Navigate to dashboard
          navigate('/restaurant-dashboard');
        } else {
          setError(response.message || 'Failed to save restaurant');
          toast.error(response.message || 'Failed to save restaurant');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        toast.error('An unexpected error occurred. Please try again later.');
      } finally {
        setSubmitting(false);
      }
    }
  });
  
  // Handle operating hours change
  const handleHoursChange = (index, field, value) => {
    const updatedHours = [...operatingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    };
    setOperatingHours(updatedHours);
  };
  
  // Handle photo upload
  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Limit to 5 photos total
    const remainingSlots = 5 - (photos.length + photoFiles.length);
    
    if (remainingSlots <= 0) {
      toast.warning('Maximum 5 photos allowed');
      return;
    }
    
    const validFiles = files.slice(0, remainingSlots).filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB size limit`);
        return false;
      }
      
      return true;
    });
    
    // Create preview URLs
    const newPhotoPreviews = validFiles.map(file => ({
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      is_primary: false,
      isNew: true
    }));
    
    setPhotos([...photos, ...newPhotoPreviews]);
    setPhotoFiles([...photoFiles, ...validFiles]);
    
    // Reset file input
    event.target.value = null;
  };
  
  // Handle photo delete
  const handlePhotoDelete = (photoId) => {
    const isNewPhoto = photoId.toString().startsWith('new-');
    
    if (isNewPhoto) {
      // Remove from photoFiles array
      const fileIndex = photoId.replace('new-', '');
      const updatedPhotoFiles = photoFiles.filter((_, index) => index !== parseInt(fileIndex));
      setPhotoFiles(updatedPhotoFiles);
    }
    
    // Remove from photos array
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
  };
  
  // Handle next step
  const handleNext = (e) => {
     e.preventDefault();
    const isBasicInfoValid = activeStep === 0 && basicInfoSchema.isValidSync(formik.values);
    const isLocationContactValid = activeStep === 1 && locationContactSchema.isValidSync(formik.values);
    
    if ((activeStep === 0 && !isBasicInfoValid) || (activeStep === 1 && !isLocationContactValid)) {
      // Trigger validation
      formik.validateForm().then(errors => {
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          // Touch all fields with errors to show validation messages
          const touchedFields = {};
          errorKeys.forEach(key => { touchedFields[key] = true; });
          formik.setTouched(touchedFields);
        }
      });
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    formik.handleSubmit(e);
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEditMode ? 'Edit Restaurant' : 'Add New Restaurant'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box component="form" onSubmit={handleSubmit}>
          {/* Step 1: Basic Information */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Restaurant Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label="Description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                  multiline
                  rows={4}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="cuisine-type-label">Cuisine Type</InputLabel>
                  <Select
                    labelId="cuisine-type-label"
                    id="cuisine_type"
                    name="cuisine_type"
                    value={formik.values.cuisine_type}
                    label="Cuisine Type"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.cuisine_type && Boolean(formik.errors.cuisine_type)}
                  >
                    {cuisineTypes.map((cuisine) => (
                      <MenuItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {formik.touched.cuisine_type && formik.errors.cuisine_type && (
                  <Typography variant="caption" color="error">
                    {formik.errors.cuisine_type}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel id="cost-rating-label">Cost Rating</InputLabel>
                  <Select
                    labelId="cost-rating-label"
                    id="cost_rating"
                    name="cost_rating"
                    value={formik.values.cost_rating}
                    label="Cost Rating"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.cost_rating && Boolean(formik.errors.cost_rating)}
                  >
                    <MenuItem value={1}>$ (Budget)</MenuItem>
                    <MenuItem value={2}>$$ (Moderate)</MenuItem>
                    <MenuItem value={3}>$$$ (High-End)</MenuItem>
                    <MenuItem value={4}>$$$$ (Luxury)</MenuItem>
                    <MenuItem value={5}>$$$$$ (Ultra Luxury)</MenuItem>
                  </Select>
                </FormControl>
                {formik.touched.cost_rating && formik.errors.cost_rating && (
                  <Typography variant="caption" color="error">
                    {formik.errors.cost_rating}
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
          
          {/* Step 2: Location & Contact */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Location & Contact Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address_line1"
                  name="address_line1"
                  label="Address Line 1"
                  value={formik.values.address_line1}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address_line1 && Boolean(formik.errors.address_line1)}
                  helperText={formik.touched.address_line1 && formik.errors.address_line1}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="address_line2"
                  name="address_line2"
                  label="Address Line 2 (Optional)"
                  value={formik.values.address_line2}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address_line2 && Boolean(formik.errors.address_line2)}
                  helperText={formik.touched.address_line2 && formik.errors.address_line2}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="city"
                  name="city"
                  label="City"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.city && Boolean(formik.errors.city)}
                  helperText={formik.touched.city && formik.errors.city}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="state"
                  name="state"
                  label="State"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.state && Boolean(formik.errors.state)}
                  helperText={formik.touched.state && formik.errors.state}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  id="zip_code"
                  name="zip_code"
                  label="ZIP Code"
                  value={formik.values.zip_code}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.zip_code && Boolean(formik.errors.zip_code)}
                  helperText={formik.touched.zip_code && formik.errors.zip_code}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label="Phone Number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email (Optional)"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="website"
                  name="website"
                  label="Website (Optional)"
                  value={formik.values.website}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.website && Boolean(formik.errors.website)}
                  helperText={
                    (formik.touched.website && formik.errors.website) || 
                    "Include 'http://' or 'https://' prefix"
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="latitude"
                  name="latitude"
                  label="Latitude *"
                  value={formik.values.latitude}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.latitude && Boolean(formik.errors.latitude)}
                  helperText={formik.touched.latitude && formik.errors.latitude}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="longitude"
                  name="longitude"
                  label="Longitude *"
                  value={formik.values.longitude}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.longitude && Boolean(formik.errors.longitude)}
                  helperText={formik.touched.longitude && formik.errors.longitude}
                />
              </Grid>
            </Grid>
          )}
          
          {/* Step 3: Operating Hours */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Operating Hours
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Set the opening and closing times for each day of the week. Leave the same times 
                  if your restaurant has consistent hours, or customize each day as needed.
                </Typography>
                
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  {operatingHours.map((hours, index) => (
                    <Grid container spacing={2} key={hours.day_of_week} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Day"
                          value={hours.day_of_week}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <TimePicker
                          label="Opening Time"
                          value={parse(hours.opening_time.substring(0, 5), 'HH:mm', new Date())}
                          onChange={(newValue) => {
                            const formattedTime = format(newValue, 'HH:mm');
                            handleHoursChange(index, 'opening_time', formattedTime);
                          }}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <TimePicker
                          label="Closing Time"
                          value={parse(hours.closing_time.substring(0, 5), 'HH:mm', new Date())}
                          onChange={(newValue) => {
                            const formattedTime = format(newValue, 'HH:mm');
                            handleHoursChange(index, 'closing_time', formattedTime);
                          }}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                    </Grid>
                  ))}
                </LocalizationProvider>
              </Grid>
            </Grid>
          )}
          
          {/* Step 4: Photos */}
          {activeStep === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Restaurant Photos
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload up to 5 photos of your restaurant. The first photo will be used as the main image.
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="photo-upload"
                    type="file"
                    multiple
                    onChange={handlePhotoUpload}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<PhotoCamera />}
                      disabled={photos.length >= 5}
                    >
                      Upload Photos
                    </Button>
                  </label>
                  <Typography variant="caption" sx={{ ml: 2 }}>
                    {photos.length}/5 photos uploaded
                  </Typography>
                </Box>
                
                {photos.length > 0 && (
                  <>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={makeFirstImagePrimary}
                          onChange={(e) => setMakeFirstImagePrimary(e.target.checked)}
                        />
                      }
                      label="Make the first image the primary image"
                    />
                    
                    <Grid container spacing={2}>
                      {photos.map((photo, index) => (
                        <Grid item xs={12} sm={6} md={4} key={photo.id}>
                          <Card>
                            <CardMedia
                              component="img"
                              height="200"
                              image={photo.isNew ? photo.url : `${process.env.REACT_APP_API_URL.replace('/api', '')}${photo.photo_url}`}
                              alt={`Restaurant photo ${index + 1}`}
                            />
                            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption">
                                {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                              </Typography>
                              <Tooltip title="Delete photo">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handlePhotoDelete(photo.id)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
          )}
          
          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid #eee' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            
            <div>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                  startIcon={<Save />}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Save Restaurant'}
                </Button>
              ) : (
                <Button
                  type="button" 
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              )}
            </div>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RestaurantForm;
