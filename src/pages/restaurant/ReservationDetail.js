// src/pages/restaurant/ReservationDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  TextField,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack,
  Event,
  AccessTime,
  Person,
  Email,
  Phone,
  Save,
  Cancel,
  CheckCircle
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import AuthContext from '../../context/AuthContext';
import { updateReservation, cancelReservation } from '../../services/reservationService';
import { toast } from 'react-toastify';

// Mock reservation data (to be replaced with API calls)
const mockReservation = {
  id: 1,
  customer_id: 3,
  restaurant_id: 1,
  table_id: 5,
  reservation_date: '2023-05-15',
  reservation_time: '19:30',
  party_size: 4,
  status: 'confirmed',
  special_request: 'Window seating if possible',
  created_at: '2023-05-01T12:30:00.000Z',
  updated_at: '2023-05-01T12:30:00.000Z',
  restaurant_name: 'The Gourmet Kitchen',
  table_number: '5',
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@example.com',
  phone: '(555) 123-4567'
};

const ReservationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  // State for reservation
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for form
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // State for cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Fetch reservation data
  useEffect(() => {
    const fetchReservation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real application, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          setReservation(mockReservation);
          setStatus(mockReservation.status);
          setNotes(mockReservation.notes || '');
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to fetch reservation details');
        toast.error('Failed to fetch reservation details');
        setLoading(false);
      }
    };
    
    fetchReservation();
  }, [id]);
  
  // Handle status change
  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };
  
  // Handle notes change
  const handleNotesChange = (event) => {
    setNotes(event.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    
    try {
      const updateData = {
        status,
        notes
      };
      
      const response = await updateReservation(id, updateData, token);
      
      if (response.success) {
        toast.success('Reservation updated successfully');
        // Update local state
        setReservation({
          ...reservation,
          status,
          notes
        });
      } else {
        toast.error(response.message || 'Failed to update reservation');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle reservation cancellation
  const handleCancelReservation = async () => {
    setSubmitting(true);
    setCancelDialogOpen(false);
    
    try {
      const response = await cancelReservation(id, token);
      
      if (response.success) {
        toast.success('Reservation cancelled successfully');
        // Update local state
        setReservation({
          ...reservation,
          status: 'cancelled'
        });
        setStatus('cancelled');
      } else {
        toast.error(response.message || 'Failed to cancel reservation');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };
  
  // Format time
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
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error || !reservation) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error || 'Reservation not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/restaurant-dashboard')}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/restaurant-dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Reservation Details
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              {reservation.restaurant_name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                color={getStatusColor(status)}
                size="small"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { sm: 'flex-end' } }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Reservation ID
              </Typography>
              <Typography variant="body1" gutterBottom>
                #{reservation.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1">
                {formatDate(reservation.created_at)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reservation Information
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Event color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(reservation.reservation_date)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTime color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body1">
                      {formatTime(reservation.reservation_time)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Person color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Party Size
                    </Typography>
                    <Typography variant="body1">
                      {reservation.party_size} {reservation.party_size === 1 ? 'person' : 'people'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Table:
                  </Typography>
                  <Typography variant="body1">
                    {reservation.table_number}
                  </Typography>
                </Box>
                
                {reservation.special_request && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Special Request
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {reservation.special_request}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {reservation.first_name} {reservation.last_name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {reservation.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Phone color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">
                      {reservation.phone}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Reservation
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={status}
                  label="Status"
                  onChange={handleStatusChange}
                  disabled={submitting}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Notes (Internal)"
                value={notes}
                onChange={handleNotesChange}
                multiline
                rows={3}
                disabled={submitting}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => setCancelDialogOpen(true)}
                  disabled={submitting || status === 'cancelled' || status === 'completed'}
                >
                  Cancel Reservation
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
                  disabled={submitting || (status === reservation.status && notes === reservation.notes)}
                >
                  Save Changes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Reservation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this reservation for {reservation.first_name} {reservation.last_name} on {formatDate(reservation.reservation_date)} at {formatTime(reservation.reservation_time)}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)}
            disabled={submitting}
          >
            Keep Reservation
          </Button>
          <Button 
            onClick={handleCancelReservation} 
            color="error"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Cancel Reservation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReservationDetail;
