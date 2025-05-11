// src/pages/admin/Users.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Search,
  FilterList,
  Edit,
  Person,
  Restaurant,
  Star,
  ArrowBack
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import AuthContext from '../../context/AuthContext';
import { getAllUsers, getUserDetails, updateUserRole } from '../../services/adminService';
import { toast } from 'react-toastify';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  // State for users
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters and pagination
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for user details
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  
  // State for role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);
  
  // Fetch users on component mount and when filters change
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare filter params
        const params = {
          role: role !== 'all' ? role : undefined,
          search: search || undefined,
          sort_by: 'created_at',
          sort_dir: 'desc'
        };
        
        const response = await getAllUsers(params, token);
        
        if (response.success) {
          setUsers(response.users || []);
        } else {
          setError(response.message || 'Failed to fetch users');
          toast.error(response.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again later.');
        toast.error('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [token, role, search]);
  
  // Fetch user details when a user is selected
  useEffect(() => {
    if (!selectedUser) {
      setUserDetails(null);
      return;
    }
    
    const fetchUserDetails = async () => {
      setLoadingUserDetails(true);
      
      try {
        const response = await getUserDetails(selectedUser.id, token);
        
        if (response.success) {
          setUserDetails(response.user);
        } else {
          toast.error(response.message || 'Failed to fetch user details');
        }
      } catch (err) {
        toast.error('An unexpected error occurred');
      } finally {
        setLoadingUserDetails(false);
      }
    };
    
    fetchUserDetails();
  }, [selectedUser, token]);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle role filter change
  const handleNewRoleChange = (event) => {
    setNewRole(event.target.value);
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
  
  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };
  
  // Open role change dialog
  const handleOpenRoleDialog = () => {
    if (!selectedUser) return;
    
    setNewRole(selectedUser.role);
    setRoleDialogOpen(true);
  };
  
  // Close role change dialog
  const handleCloseRoleDialog = () => {
    setRoleDialogOpen(false);
  };
  
  // Handle role change
  const handleRoleChange = (event) => {
    setNewRole(event.target.value);
  };
  
  // Submit role change
  const handleSubmitRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    
    setUpdatingRole(true);
    
    try {
      const response = await updateUserRole(selectedUser.id, newRole, token);
      
      if (response.success) {
        toast.success('User role updated successfully');
        
        // Update user in both lists
        const updatedUser = { ...selectedUser, role: newRole };
        setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
        setSelectedUser(updatedUser);
        
        // Close dialog
        setRoleDialogOpen(false);
      } else {
        toast.error(response.message || 'Failed to update user role');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setUpdatingRole(false);
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
  
  // Get role color for chip
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'restaurant_manager':
        return 'primary';
      case 'customer':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Get role display name
  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'restaurant_manager':
        return 'Restaurant Manager';
      case 'customer':
        return 'Customer';
      default:
        return role;
    }
  };
  
  // Render loading state
  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Get displayed users (with pagination)
  const displayedUsers = users
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
      
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Users
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Left Column - User List */}
        <Grid item xs={12} md={selectedUser ? 8 : 12}>
          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    value={role}
                    label="Role"
                    onChange={handleNewRoleChange}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="customer">Customers</MenuItem>
                    <MenuItem value="restaurant_manager">Restaurant Managers</MenuItem>
                    <MenuItem value="admin">Admins</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={8}>
                <form onSubmit={handleSearchSubmit}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Search by name or email..."
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
          
          {/* Users Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedUsers.map((user) => (
                    <TableRow 
                      key={user.id}
                      selected={selectedUser?.id === user.id}
                      hover
                      onClick={() => handleUserSelect(user)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleName(user.role)}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserSelect(user);
                            }}
                          >
                            <Person />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Change Role">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserSelect(user);
                              handleOpenRoleDialog();
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {displayedUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={users.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
        
        {/* Right Column - User Details */}
        {selectedUser && (
          <Grid item xs={12} md={4}>
            {loadingUserDetails ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : userDetails ? (
              <Box>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      User Details
                    </Typography>
                    
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      {userDetails.first_name} {userDetails.last_name}
                    </Typography>
                    
                    <Chip
                      label={getRoleName(userDetails.role)}
                      color={getRoleColor(userDetails.role)}
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      Email:
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {userDetails.email}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Phone:
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {userDetails.phone || 'Not provided'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Joined:
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(userDetails.created_at)}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleOpenRoleDialog}
                      >
                        Change Role
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                
                {/* Restaurant Manager Specific */}
                {userDetails.role === 'restaurant_manager' && userDetails.restaurants && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Restaurant color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Restaurants
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ mb: 2 }} />
                      
                      {userDetails.restaurants.length > 0 ? (
                        <List dense disablePadding>
                          {userDetails.restaurants.map((restaurant) => (
                            <ListItem key={restaurant.id} disableGutters>
                              <ListItemText
                                primary={restaurant.name}
                                secondary={`${restaurant.city}, ${restaurant.state} • ${restaurant.is_approved ? 'Approved' : 'Pending'}`}
                              />
                              <ListItemSecondaryAction>
                                <Tooltip title="View Restaurant">
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                                  >
                                    <Restaurant fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No restaurants added yet
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {/* Customer Specific */}
                {userDetails.role === 'customer' && (
                  <>
                    {/* Reservations */}
                    {userDetails.reservations && (
                      <Card sx={{ mb: 3 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Restaurant color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              Recent Reservations
                            </Typography>
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          {userDetails.reservations.length > 0 ? (
                            <List dense disablePadding>
                              {userDetails.reservations.map((reservation) => (
                                <ListItem key={reservation.id} disableGutters>
                                  <ListItemText
                                    primary={reservation.restaurant_name}
                                    secondary={`${formatDate(reservation.reservation_date)} • ${reservation.status}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No reservations found
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Reviews */}
                    {userDetails.reviews && (
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Star color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">
                              Recent Reviews
                            </Typography>
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          {userDetails.reviews.length > 0 ? (
                            <List dense disablePadding>
                              {userDetails.reviews.map((review) => (
                                <ListItem key={review.id} disableGutters>
                                  <ListItemText
                                    primary={`${review.restaurant_name} - ${review.rating}/5`}
                                    secondary={`${formatDate(review.created_at)}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No reviews found
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </Box>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">
                  Select a user to view details
                </Typography>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>
      
      {/* Role Change Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={handleCloseRoleDialog}
      >
        <DialogTitle>
          Change User Role
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText paragraph>
            Change role for {selectedUser?.first_name} {selectedUser?.last_name}
          </DialogContentText>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="new-role-label">Role</InputLabel>
            <Select
              labelId="new-role-label"
              id="new-role"
              value={newRole}
              label="Role"
              onChange={handleRoleChange}
            >
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="restaurant_manager">Restaurant Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseRoleDialog}
            disabled={updatingRole}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRoleChange}
            color="primary"
            variant="contained"
            disabled={updatingRole || newRole === selectedUser?.role}
            startIcon={updatingRole ? <CircularProgress size={20} /> : null}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminUsers;