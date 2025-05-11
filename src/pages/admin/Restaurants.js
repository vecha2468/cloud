// src/pages/admin/Restaurants.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Check,
  Close,
  Delete,
  Visibility,
  ArrowBack
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import AuthContext from '../../context/AuthContext';
import { getAllRestaurants, approveRestaurant, deleteRestaurant } from '../../services/adminService';
import { toast } from 'react-toastify';

const AdminRestaurants = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AuthContext);
  const queryParams = new URLSearchParams(location.search);
  
  // Get initial filter values from URL params
  const initialStatus = queryParams.get('status') || 'all';
  const initialCuisine = queryParams.get('cuisine') || '';
  const initialSearch = queryParams.get('search') || '';
  
  // State for restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters and pagination
  const [status, setStatus] = useState(initialStatus);
  const [cuisine, setCuisine] = useState(initialCuisine);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for actions
  const [actionRestaurant, setActionRestaurant] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Cuisine types for filtering
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
  
  // Fetch restaurants on component mount and when filters change
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare filter params
        const params = {
          status: status !== 'all' ? status : undefined,
          cuisine: cuisine || undefined,
          search: search || undefined,
          sort_by: 'created_at',
          sort_dir: 'desc'
        };
        
        const response = await getAllRestaurants(params, token);
        
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
    
    // Update URL with filters
    const queryParams = new URLSearchParams();
    if (status !== 'all') queryParams.set('status', status);
    if (cuisine) queryParams.set('cuisine', cuisine);
    if (search) queryParams.set('search', search);
    
    const queryString = queryParams.toString();
    const newUrl = queryString 
      ? `${location.pathname}?${queryString}` 
      : location.pathname;
      
    navigate(newUrl, { replace: true });
  }, [token, status, cuisine, search, location.pathname, navigate]);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle status filter change
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(0);
  };
  
  // Handle cuisine filter change
  const handleCuisineChange = (event) => {
    setCuisine(event.target.value);
    setPage(0);
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
  };
  
  // Handle search submit
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(0);
  };
  
  // Open approval dialog
  const handleApproveClick = (restaurant) => {
    setActionRestaurant(restaurant);
    setActionType('approve');
  };
  
  // Open delete dialog
  const handleDeleteClick = (restaurant) => {
    setActionRestaurant(restaurant);
    setActionType('delete');
  };
  
  // Close action dialog
  const handleCloseDialog = () => {
    setActionRestaurant(null);
    setActionType(null);
  };
  
  // Confirm action
  const handleConfirmAction = async () => {
    if (!actionRestaurant || !actionType) return;
    
    setActionInProgress(true);
    
    try {
      let response;
      
      if (actionType === 'approve') {
        response = await approveRestaurant(actionRestaurant.id, token);
        
        if (response.success) {
          toast.success('Restaurant approved successfully');
          
          // Update restaurant status in the list
          setRestaurants(restaurants.map(r => 
            r.id === actionRestaurant.id 
              ? { ...r, is_approved: true } 
              : r
          ));
        } else {
          toast.error(response.message || 'Failed to approve restaurant');
        }
      } else if (actionType === 'delete') {
        response = await deleteRestaurant(actionRestaurant.id, token);
        
        if (response.success) {
          toast.success('Restaurant deleted successfully');
          
          // Remove restaurant from the list
          setRestaurants(restaurants.filter(r => r.id !== actionRestaurant.id));
        } else {
          toast.error(response.message || 'Failed to delete restaurant');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setActionInProgress(false);
      handleCloseDialog();
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };
  
  // Render loading state
  if (loading && restaurants.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Get displayed restaurants (with pagination)
  const displayedRestaurants = restaurants
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin-dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Restaurants
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                value={status}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending Approval</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="cuisine-label">Cuisine</InputLabel>
              <Select
                labelId="cuisine-label"
                id="cuisine"
                value={cuisine}
                label="Cuisine"
                onChange={handleCuisineChange}
              >
                <MenuItem value="">All Cuisines</MenuItem>
                {cuisineTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search by name, city, or manager..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="submit"
                        edge="end"
                      >
                        <FilterList />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Restaurants Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Cuisine</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedRestaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell>{restaurant.name}</TableCell>
                  <TableCell>{restaurant.city}, {restaurant.state}</TableCell>
                  <TableCell>{restaurant.cuisine_type}</TableCell>
                  <TableCell>
                    {restaurant.manager_first_name} {restaurant.manager_last_name}
                  </TableCell>
                  <TableCell>{formatDate(restaurant.created_at)}</TableCell>
                  <TableCell>
                    <Chip
                      label={restaurant.is_approved ? 'Approved' : 'Pending'}
                      color={restaurant.is_approved ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    
                    {!restaurant.is_approved && (
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApproveClick(restaurant)}
                        >
                          <Check />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(restaurant)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              
              {displayedRestaurants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No restaurants found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={restaurants.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* Action Dialog */}
      <Dialog
        open={!!actionRestaurant && !!actionType}
        onClose={handleCloseDialog}
      >
        <DialogTitle>
          {actionType === 'approve' 
            ? 'Approve Restaurant' 
            : actionType === 'delete' 
              ? 'Delete Restaurant' 
              : 'Restaurant Action'}
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            {actionType === 'approve' 
              ? `Are you sure you want to approve "${actionRestaurant?.name}"? This will make the restaurant visible to customers.`
              : actionType === 'delete'
                ? `Are you sure you want to delete "${actionRestaurant?.name}"? This action cannot be undone.`
                : 'Please confirm this action.'
            }
          </DialogContentText>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            disabled={actionInProgress}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction}
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={actionInProgress}
            startIcon={actionInProgress ? <CircularProgress size={20} /> : null}
          >
            {actionType === 'approve' ? 'Approve' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminRestaurants;