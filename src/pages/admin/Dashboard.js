// src/pages/admin/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person,
  Restaurant,
  EventAvailable,
  Star,
  TrendingUp,
  Check,
  Close,
  Warning
} from '@mui/icons-material';
import { format, parseISO, subDays } from 'date-fns';
import AuthContext from '../../context/AuthContext';
import { getDashboardStats, getPendingRestaurants, approveRestaurant } from '../../services/adminService';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  // State for dashboard data
  const [stats, setStats] = useState(null);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  
  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch dashboard stats
        const statsResponse = await getDashboardStats(token);
        
        if (statsResponse.success) {
          setStats(statsResponse.stats);
        } else {
          setError(statsResponse.message || 'Failed to fetch dashboard statistics');
          toast.error(statsResponse.message || 'Failed to fetch dashboard statistics');
        }
        
        // Fetch pending restaurants
        const pendingResponse = await getPendingRestaurants(token);
        
        if (pendingResponse.success) {
          setPendingRestaurants(pendingResponse.restaurants || []);
        } else {
          toast.error(pendingResponse.message || 'Failed to fetch pending restaurants');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        toast.error('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [token]);
  
  // Handle restaurant approval
  const handleApproveRestaurant = async (restaurantId) => {
    setApprovingId(restaurantId);
    
    try {
      const response = await approveRestaurant(restaurantId, token);
      
      if (response.success) {
        toast.success('Restaurant approved successfully');
        
        // Remove the approved restaurant from the pending list
        setPendingRestaurants(pendingRestaurants.filter(
          restaurant => restaurant.id !== restaurantId
        ));
      } else {
        toast.error(response.message || 'Failed to approve restaurant');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setApprovingId(null);
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
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Dashboard
          </Typography>
          <Typography paragraph>
            There was a problem loading the dashboard data.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            sx={{ mr: 2 }}
            onClick={() => navigate('/admin-users')}
          >
            Manage Users
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate('/admin-restaurants')}
          >
            Manage Restaurants
          </Button>
        </Box>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users
              </Typography>
              <Typography variant="h3">
                {stats?.counts?.users?.total_users || 0}
              </Typography>
              <Typography variant="body2">
                {stats?.counts?.users?.total_customers || 0} customers, {stats?.counts?.users?.total_managers || 0} managers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Restaurants
              </Typography>
              <Typography variant="h3">
                {stats?.counts?.restaurants?.total_restaurants || 0}
              </Typography>
              <Typography variant="body2">
                {stats?.counts?.restaurants?.approved_restaurants || 0} approved, {stats?.counts?.restaurants?.pending_restaurants || 0} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reservations
              </Typography>
              <Typography variant="h3">
                {stats?.counts?.reservations?.total_reservations || 0}
              </Typography>
              <Typography variant="body2">
                {stats?.counts?.reservations?.confirmed_reservations || 0} confirmed, {stats?.counts?.reservations?.completed_reservations || 0} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reviews
              </Typography>
              <Typography variant="h3">
                {stats?.counts?.reviews?.total_reviews || 0}
              </Typography>
              <Typography variant="body2">
                Avg. Rating: {Number.isFinite(Number(stats?.counts?.reviews?.average_rating))
    ? Number(stats.counts.reviews.average_rating).toFixed(1)
    : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Main Content Grid */}
      <Grid container spacing={4}>
        {/* Pending Approvals */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning color="warning" sx={{ mr: 1 }} />
                Pending Restaurant Approvals
              </Typography>
            </Box>
            
            <Divider />
            
            {pendingRestaurants.length > 0 ? (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRestaurants.map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell>{restaurant.name}</TableCell>
                        <TableCell>{restaurant.city}, {restaurant.state}</TableCell>
                        <TableCell>{formatDate(restaurant.created_at)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleApproveRestaurant(restaurant.id)}
                            disabled={approvingId === restaurant.id}
                            startIcon={approvingId === restaurant.id ? <CircularProgress size={20} /> : <Check />}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">
                  No pending restaurant approvals
                </Typography>
              </Box>
            )}
            
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="text"
                onClick={() => navigate('/admin-restaurants?status=pending')}
              >
                See All Pending Restaurants
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp color="info" sx={{ mr: 1 }} />
                Recent Activity
              </Typography>
            </Box>
            
            <Divider />
            
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {/* Recent Users */}
              {stats?.recent?.users?.map((user) => (
                <ListItem key={`user-${user.id}`} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`New ${user.role}: ${user.first_name} ${user.last_name}`}
                    secondary={`Joined on ${formatDate(user.created_at)}`}
                  />
                </ListItem>
              ))}
              
              {/* Recent Reservations */}
              {stats?.recent?.reservations?.map((reservation) => (
                <ListItem key={`reservation-${reservation.id}`} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <EventAvailable />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Reservation at ${reservation.restaurant_name}`}
                    secondary={`${reservation.first_name} ${reservation.last_name} - ${formatDate(reservation.reservation_date)} - Status: ${reservation.status}`}
                  />
                </ListItem>
              ))}
              
              {/* Recent Reviews */}
              {stats?.recent?.reviews?.map((review) => (
                <ListItem key={`review-${review.id}`} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <Star />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`New review for ${review.restaurant_name}`}
                    secondary={`${review.first_name} ${review.last_name} - Rating: ${review.rating}/5 - ${formatDate(review.created_at)}`}
                  />
                </ListItem>
              ))}
              
              {stats?.recent?.users?.length === 0 && 
               stats?.recent?.reservations?.length === 0 && 
               stats?.recent?.reviews?.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No recent activity"
                    secondary="New activity will appear here"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Reservation Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reservation Trend (Last 30 Days)
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Reservations</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.trends?.reservations?.map((day) => (
                    <TableRow key={day.reservation_date}>
                      <TableCell>{formatDate(day.reservation_date)}</TableCell>
                      <TableCell>{day.count}</TableCell>
                      <TableCell>
                        <Chip 
                          size="small"
                          label={day.count > 10 ? 'High' : day.count > 5 ? 'Medium' : 'Low'} 
                          color={day.count > 10 ? 'success' : day.count > 5 ? 'warning' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {(!stats?.trends?.reservations || stats.trends.reservations.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No reservation data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
