// src/pages/customer/UserReservations.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  CardMedia,
  Tabs, 
  Tab, 
  Divider, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  CircularProgress,
  Chip,
  Alert
} from '@mui/material';
import { 
  Restaurant, 
  LocationOn, 
  AccessTime, 
  Event, 
  Person, 
  Cancel
} from '@mui/icons-material';
import { format, parseISO, isPast } from 'date-fns';
import AuthContext from '../../context/AuthContext';
import { getUserReservations, cancelReservation } from '../../services/reservationService';
import { toast } from 'react-toastify';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reservation-tabpanel-${index}`}
      aria-labelledby={`reservation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const UserReservations = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for reservations
  const [reservations, setReservations] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for cancellation dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  
  // Fetch reservations on component mount
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getUserReservations(token);
        
        if (response.success) {
          setReservations(response.reservations || []);
          
          // Filter upcoming and past reservations
          const upcoming = response.reservations.filter(
            res => !isPast(parseISO(`${res.reservation_date}T${res.reservation_time}`)) || 
                  res.status === 'cancelled'
          );
          
          const past = response.reservations.filter(
            res => isPast(parseISO(`${res.reservation_date}T${res.reservation_time}`)) && 
                  res.status !== 'cancelled'
          );
          
          setUpcomingReservations(upcoming);
          setPastReservations(past);
        } else {
          setError(response.message || 'Failed to fetch reservations');
          toast.error(response.message || 'Failed to fetch reservations');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        toast.error('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReservations();
  }, [token]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Open cancel dialog
  const handleCancelClick = (reservation) => {
    setSelectedReservation(reservation);
    setCancelDialogOpen(true);
  };
  
  // Close cancel dialog
  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setSelectedReservation(null);
  };
  
  // Confirm cancellation
  const handleConfirmCancel = async () => {
    if (!selectedReservation) return;
    
    setCancelling(true);
    
    try {
      const response = await cancelReservation(selectedReservation.id, token);
      
      if (response.success) {
        toast.success('Reservation cancelled successfully');
        
        // Update the status of the reservation in state
        const updatedReservations = reservations.map(res => 
          res.id === selectedReservation.id 
            ? { ...res, status: 'cancelled' } 
            : res
        );
        
        setReservations(updatedReservations);
        
        // Update upcoming reservations
        const upcoming = updatedReservations.filter(
          res => !isPast(parseISO(`${res.reservation_date}T${res.reservation_time}`)) || 
                res.status === 'cancelled'
        );
        
        setUpcomingReservations(upcoming);
      } else {
        toast.error(response.message || 'Failed to cancel reservation');
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setCancelling(false);
      setCancelDialogOpen(false);
      setSelectedReservation(null);
    }
  };
  
  // Render reservation card
  const renderReservationCard = (reservation) => {
    const reservationDateTime = parseISO(`${reservation.reservation_date}T${reservation.reservation_time}`);
    const isPastReservation = isPast(reservationDateTime);
    
    let statusColor = 'default';
    
    switch (reservation.status) {
      case 'confirmed':
        statusColor = 'success';
        break;
      case 'pending':
        statusColor = 'warning';
        break;
      case 'completed':
        statusColor = 'info';
        break;
      case 'cancelled':
        statusColor = 'error';
        break;
      default:
        statusColor = 'default';
    }
    
    return (
      <Grid item xs={12} md={6} key={reservation.id}>
        <Card sx={{ mb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #eee' }}>
            <CardMedia
              component="img"
              sx={{ width: 80, height: 80, borderRadius: '4px', mr: 2 }}
              image={reservation.restaurant_image ? `${process.env.REACT_APP_API_URL}${reservation.restaurant_image}` : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
              alt={reservation.restaurant_name}
            />
            <Box>
              <Typography variant="h6" component="h3">
                {reservation.restaurant_name}
              </Typography>
              <Chip 
                label={reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)} 
                color={statusColor}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>
          
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Event color="primary" sx={{ mr: 1.5 }} fontSize="small" />
              <Typography variant="body2">
                {format(parseISO(reservation.reservation_date), 'EEEE, MMMM d, yyyy')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <AccessTime color="primary" sx={{ mr: 1.5 }} fontSize="small" />
              <Typography variant="body2">
                {format(parseISO(`2000-01-01T${reservation.reservation_time}`), 'h:mm a')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Person color="primary" sx={{ mr: 1.5 }} fontSize="small" />
              <Typography variant="body2">
                {reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}
              </Typography>
            </Box>
            
            {reservation.special_request && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Special Request:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reservation.special_request}
                </Typography>
              </Box>
            )}
          </CardContent>
          
          <CardActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => navigate(`/restaurant/${reservation.restaurant_id}`)}
              size="small"
            >
              View Restaurant
            </Button>
            
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && !isPastReservation && (
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => handleCancelClick(reservation)}
                startIcon={<Cancel />}
                size="small"
                sx={{ ml: 'auto' }}
              >
                Cancel
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>
    );
  };
  
  // Show success message from navigation state (after booking a reservation)
  const locationState = location.state;
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Success message after booking */}
      {locationState?.message && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {locationState.message}
        </Alert>
      )}
      
      {/* Error message if any */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h4" component="h1" gutterBottom>
        My Reservations
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : reservations.length > 0 ? (
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Upcoming" />
            <Tab label="Past" />
          </Tabs>
          
          {/* Upcoming Reservations Tab */}
          <TabPanel value={tabValue} index={0}>
            {upcomingReservations.length > 0 ? (
              <Grid container spacing={3}>
                {upcomingReservations.map(reservation => renderReservationCard(reservation))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Upcoming Reservations
                </Typography>
                <Typography variant="body1" paragraph>
                  You don't have any upcoming reservations.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/search')}
                >
                  Find Restaurants
                </Button>
              </Box>
            )}
          </TabPanel>
          
          {/* Past Reservations Tab */}
          <TabPanel value={tabValue} index={1}>
            {pastReservations.length > 0 ? (
              <Grid container spacing={3}>
                {pastReservations.map(reservation => renderReservationCard(reservation))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No Past Reservations
                </Typography>
                <Typography variant="body1">
                  You don't have any past reservations.
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Reservations Found
          </Typography>
          <Typography variant="body1" paragraph>
            You haven't made any reservations yet.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/search')}
          >
            Find Restaurants
          </Button>
        </Paper>
      )}
      
      {/* Cancellation Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelDialogClose}
        aria-labelledby="cancel-dialog-title"
      >
        <DialogTitle id="cancel-dialog-title">
          Cancel Reservation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your reservation at {selectedReservation?.restaurant_name} on {selectedReservation ? format(parseISO(selectedReservation.reservation_date), 'MMMM d, yyyy') : ''} at {selectedReservation ? format(parseISO(`2000-01-01T${selectedReservation.reservation_time}`), 'h:mm a') : ''}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose} disabled={cancelling}>
            Keep Reservation
          </Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : 'Cancel Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserReservations;