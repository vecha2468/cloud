// src/pages/restaurant/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  EventAvailable,
  Star,
  Add,
  Refresh,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { format, parseISO, isToday, isTomorrow, subDays } from 'date-fns';
import AuthContext from '../../context/AuthContext';
import { getManagerRestaurants } from '../../services/restaurantService';
import { getRestaurantReservations, getReservationStats } from '../../services/reservationService';
import { toast } from 'react-toastify';

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  );
}

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  // State for restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [error, setError] = useState(null);
  
  // State for reservations
  const [reservations, setReservations] = useState([]);
  const [reservationDate, setReservationDate] = useState(new Date());
  const [loadingReservations, setLoadingReservations] = useState(false);
  
  // State for statistics
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch manager's restaurants on component mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingRestaurants(true);
      setError(null);
      
      try {
        const response = await getManagerRestaurants(token);
        
        if (response.success) {
          setRestaurants(response.restaurants || []);
          
          // Set the first restaurant as selected if any
          if (response.restaurants && response.restaurants.length > 0) {
            setSelectedRestaurant(response.restaurants[0]);
          }
        } else {
          setError(response.message || 'Failed to fetch restaurants');
          toast.error(response.message || 'Failed to fetch restaurants');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        toast.error('An unexpected error occurred. Please try again later.');
      } finally {
        setLoadingRestaurants(false);
      }
    };
    
    fetchRestaurants();
  }, [token]);
  
  // Fetch reservations when a restaurant is selected or date changes
  useEffect(() => {
    if (!selectedRestaurant) return;
    
    const fetchReservations = async () => {
      setLoadingReservations(true);
      
      try {
        const formattedDate = format(reservationDate, 'yyyy-MM-dd');
        const response = await getRestaurantReservations(selectedRestaurant.id, formattedDate, token);
        
        if (response.success) {
          setReservations(response.reservations || []);
        } else {
          toast.error(response.message || 'Failed to fetch reservations');
        }
      } catch (err) {
        toast.error('An unexpected error occurred while fetching reservations');
      } finally {
        setLoadingReservations(false);
      }
    };
    
    fetchReservations();
  }, [selectedRestaurant, reservationDate, token]);
  
  // Fetch statistics when a restaurant is selected
  useEffect(() => {
    if (!selectedRestaurant) return;
    
    const fetchStats = async () => {
      setLoadingStats(true);
      
      try {
        const response = await getReservationStats(token);
        
        if (response.success) {
          setStats(response.stats);
        } else {
          toast.error(response.message || 'Failed to fetch statistics');
        }
      } catch (err) {
        toast.error('An unexpected error occurred while fetching statistics');
      } finally {
        setLoadingStats(false);
      }
    };
    
    fetchStats();
  }, [selectedRestaurant, token]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle restaurant selection
  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
  };
  
  // Handle date change
  const handleDateChange = (date) => {
    setReservationDate(date);
  };
  
  // Format reservation time
  const formatTime = (timeString) => {
    try {
      return format(parseISO(`2000-01-01T${timeString}`), 'h:mm a');
    } catch {
      return timeString;
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Render loading state
  if (loadingRestaurants) {
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
            There was a problem loading your restaurant information.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            startIcon={<Refresh />}
          >
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Render no restaurants state
  if (restaurants.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            No Restaurants Found
          </Typography>
          <Typography paragraph>
            You haven't added any restaurants yet. Get started by adding your first restaurant.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/restaurant-form')}
            startIcon={<Add />}
          >
            Add Restaurant
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Restaurant Dashboard
      </Typography>
      
      {/* Restaurant Selector */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <RestaurantIcon color="primary" fontSize="large" />
          </Grid>
          <Grid item xs>
            <Typography variant="h6">
              {selectedRestaurant?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedRestaurant?.address_line1}, {selectedRestaurant?.city}, {selectedRestaurant?.state}
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={() => navigate(`/restaurant-form/${selectedRestaurant?.id}`)}
            >
              Edit Restaurant
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              onClick={() => navigate('/restaurant-form')}
              startIcon={<Add />}
            >
              Add New Restaurant
            </Button>
          </Grid>
        </Grid>
        
        {restaurants.length > 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Restaurants:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {restaurants.map((restaurant) => (
                <Chip
                  key={restaurant.id}
                  label={restaurant.name}
                  onClick={() => handleRestaurantSelect(restaurant)}
                  color={selectedRestaurant?.id === restaurant.id ? 'primary' : 'default'}
                  variant={selectedRestaurant?.id === restaurant.id ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Dashboard Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Overview" icon={<RestaurantIcon />} iconPosition="start" />
          <Tab label="Reservations" icon={<EventAvailable />} iconPosition="start" />
          <Tab label="Statistics" icon={<Star />} iconPosition="start" />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Today's Reservations Card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Today's Reservations" />
                <Divider />
                <CardContent>
                  {loadingReservations ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : reservations.filter(r => isToday(parseISO(r.reservation_date))).length > 0 ? (
                    <List>
                      {reservations
                        .filter(r => isToday(parseISO(r.reservation_date)))
                        .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
                        .slice(0, 5)
                        .map((reservation) => (
                          <ListItem key={reservation.id} divider>
                            <ListItemText
                              primary={`${reservation.party_size} people at ${formatTime(reservation.reservation_time)}`}
                              secondary={`${reservation.first_name} ${reservation.last_name} - ${reservation.phone || 'No phone'}`}
                            />
                            <Chip
                              label={reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              color={getStatusColor(reservation.status)}
                              size="small"
                            />
                          </ListItem>
                        ))}
                    </List>
                  ) : (
                    <Typography variant="body1" align="center" sx={{ p: 2 }}>
                      No reservations for today.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Tomorrow's Reservations Card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Tomorrow's Reservations" />
                <Divider />
                <CardContent>
                  {loadingReservations ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : reservations.filter(r => isTomorrow(parseISO(r.reservation_date))).length > 0 ? (
                    <List>
                      {reservations
                        .filter(r => isTomorrow(parseISO(r.reservation_date)))
                        .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
                        .slice(0, 5)
                        .map((reservation) => (
                          <ListItem key={reservation.id} divider>
                            <ListItemText
                              primary={`${reservation.party_size} people at ${formatTime(reservation.reservation_time)}`}
                              secondary={`${reservation.first_name} ${reservation.last_name} - ${reservation.phone || 'No phone'}`}
                            />
                            <Chip
                              label={reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              color={getStatusColor(reservation.status)}
                              size="small"
                            />
                          </ListItem>
                        ))}
                    </List>
                  ) : (
                    <Typography variant="body1" align="center" sx={{ p: 2 }}>
                      No reservations for tomorrow.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Quick Stats Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Today's Bookings
                  </Typography>
                  <Typography variant="h3">
                    {loadingStats ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      reservations.filter(r => 
                        isToday(parseISO(r.reservation_date)) && 
                        r.status !== 'cancelled'
                      ).length
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upcoming Reservations
                  </Typography>
                  <Typography variant="h3">
                    {loadingStats ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      stats?.total_reservations || 0
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Tables
                  </Typography>
                  <Typography variant="h3">
                    {loadingStats ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      stats?.by_table?.length || 0
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Approval Status
                  </Typography>
                  <Typography variant="h6">
                    {selectedRestaurant?.is_approved ? (
                      <Chip label="Approved" color="success" />
                    ) : (
                      <Chip label="Pending Approval" color="warning" />
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Quick Links */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate(`/restaurant/${selectedRestaurant?.id}`)}
                  >
                    View Public Page
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => setTabValue(1)}
                  >
                    Manage Reservations
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => navigate('/restaurant-settings')}
                  >
                    Table Settings
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Reservations Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Typography variant="h6">
                  Reservations for: {format(reservationDate, 'MMMM d, yyyy')}
                </Typography>
              </Grid>
              <Grid item>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleDateChange(new Date())}
                >
                  Today
                </Button>
              </Grid>
              <Grid item>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleDateChange(subDays(new Date(), 1))}
                >
                  Yesterday
                </Button>
              </Grid>
              <Grid item>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleDateChange(subDays(new Date(), -1))}
                >
                  Tomorrow
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {loadingReservations ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : reservations.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Party Size</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations
                    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time))
                    .map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>{formatTime(reservation.reservation_time)}</TableCell>
                        <TableCell>{reservation.party_size} people</TableCell>
                        <TableCell>{reservation.first_name} {reservation.last_name}</TableCell>
                        <TableCell>
                          {reservation.phone || 'N/A'}
                          <br />
                          {reservation.email}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            color={getStatusColor(reservation.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => navigate(`/reservations/${reservation.id}`)}
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
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No Reservations Found
              </Typography>
              <Typography paragraph>
                There are no reservations for the selected date.
              </Typography>
            </Paper>
          )}
        </TabPanel>
        
        {/* Statistics Tab */}
        <TabPanel value={tabValue} index={2}>
          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <Grid container spacing={3}>
              {/* Reservation Stats Card */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Reservation Statistics" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Reservations
                        </Typography>
                        <Typography variant="h5">
                          {stats.total_reservations || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Completed
                        </Typography>
                        <Typography variant="h5">
                          {stats.by_status?.find(s => s.status === 'completed')?.count || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Confirmed
                        </Typography>
                        <Typography variant="h5">
                          {stats.by_status?.find(s => s.status === 'confirmed')?.count || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Cancelled
                        </Typography>
                        <Typography variant="h5">
                          {stats.by_status?.find(s => s.status === 'cancelled')?.count || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Table Usage Card */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Table Usage" />
                  <Divider />
                  <CardContent>
                    {stats.by_table && stats.by_table.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Table</TableCell>
                              <TableCell>Reservations</TableCell>
                              <TableCell>Usage %</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stats.by_table.map((table) => (
                              <TableRow key={table.table_id}>
                                <TableCell>{table.table_number}</TableCell>
                                <TableCell>{table.count}</TableCell>
                                <TableCell>
                                  {Math.round((table.count / stats.total_reservations) * 100)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body1" align="center" sx={{ p: 2 }}>
                        No table data available.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Daily Trend Card */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Daily Reservation Trend (Last 30 Days)" />
                  <Divider />
                  <CardContent>
                    {stats.daily_reservations && stats.daily_reservations.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Reservations</TableCell>
                              <TableCell>Trend</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stats.daily_reservations
                              .slice(-10) // Get the last 10 days
                              .map((day, index, arr) => {
                                const prevDay = index > 0 ? arr[index - 1].count : day.count;
                                const trend = day.count > prevDay 
                                  ? <ArrowUpward color="success" /> 
                                  : day.count < prevDay 
                                    ? <ArrowDownward color="error" /> 
                                    : '—';
                                
                                return (
                                  <TableRow key={day.reservation_date}>
                                    <TableCell>{format(parseISO(day.reservation_date), 'MMM d')}</TableCell>
                                    <TableCell>{day.count}</TableCell>
                                    <TableCell>{trend}</TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body1" align="center" sx={{ p: 2 }}>
                        No daily trend data available.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No Statistics Available
              </Typography>
              <Typography paragraph>
                There is no statistical data available for this restaurant yet.
              </Typography>
            </Paper>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default RestaurantDashboard;