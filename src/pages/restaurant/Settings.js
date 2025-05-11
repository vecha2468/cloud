// src/pages/restaurant/Settings.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  CheckCircle,
  Cancel,
  Refresh
} from '@mui/icons-material';
import AuthContext from '../../context/AuthContext';
import { getManagerRestaurants, getRestaurantTables, createRestaurantTable, updateRestaurantTable, deleteRestaurantTable} from '../../services/restaurantService';
import { toast } from 'react-toastify';

// Mock table data (to be replaced with API calls)
const mockTables = [
  { id: 1, restaurant_id: 1, table_number: '1', capacity: 2 },
  { id: 2, restaurant_id: 1, table_number: '2', capacity: 2 },
  { id: 3, restaurant_id: 1, table_number: '3', capacity: 4 },
  { id: 4, restaurant_id: 1, table_number: '4', capacity: 4 },
  { id: 5, restaurant_id: 1, table_number: '5', capacity: 6 },
  { id: 6, restaurant_id: 1, table_number: '6', capacity: 8 }
];

const RestaurantSettings = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  // State for restaurants
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [error, setError] = useState(null);
  
  // State for tables
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState(null);
  
  // State for table dialog
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [submittingTable, setSubmittingTable] = useState(false);
  
  // Fetch manager's restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingRestaurants(true);
      setError(null);
      try {
        const response = await getManagerRestaurants(token);
        if (response.success) {
          setRestaurants(response.restaurants || []);
          if (response.restaurants && response.restaurants.length > 0) {
            // Automatically select the first restaurant
            setSelectedRestaurant(response.restaurants[0]);
          } else {
             setSelectedRestaurant(null); // No restaurants found
             setTables([]); // Clear tables if no restaurant
          }
        } else {
          setError(response.message || 'Failed to fetch restaurants');
          toast.error(response.message || 'Failed to fetch restaurants');
        }
      } catch (err) {
        setError('An unexpected error occurred fetching restaurants.');
        toast.error('An unexpected error occurred fetching restaurants.');
      } finally {
        setLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, [token]);

  // Fetch tables when a restaurant is selected
  useEffect(() => {
    if (!selectedRestaurant) {
      setTables([]); // Clear tables if no restaurant is selected
      return;
    };

    const fetchTables = async () => {
      setLoadingTables(true);
      setTablesError(null);
      try {
        // ---- API CALL ----
        const response = await getRestaurantTables(selectedRestaurant.id, token);
        if (response.success) {
          setTables(response.tables || []);
        } else {
          setTablesError(response.message || 'Failed to fetch tables');
          toast.error(response.message || 'Failed to fetch tables');
          setTables([]); // Clear tables on error
        }
      } catch (err) {
        setTablesError('An unexpected error occurred fetching tables.');
        toast.error('An unexpected error occurred fetching tables.');
        setTables([]); // Clear tables on error
      } finally {
        setLoadingTables(false);
      }
    };

    fetchTables();
  }, [selectedRestaurant, token]); // Re-fetch if selectedRestaurant or token changes

  // Table form validation schema
  const tableValidationSchema = Yup.object({
    table_number: Yup.string().required('Table number/name is required'),
    capacity: Yup.number()
      .required('Capacity is required')
      .min(1, 'Capacity must be at least 1')
      .integer('Capacity must be a whole number')
      .max(50, 'Capacity seems too high (max 50)') // Increased max capacity
  });

  // Initialize table form
  const tableFormik = useFormik({
    initialValues: {
      table_number: '',
      capacity: 2
    },
    validationSchema: tableValidationSchema,
    onSubmit: async (values) => {
      if (!selectedRestaurant) {
          toast.error("No restaurant selected.");
          return;
      }
      setSubmittingTable(true);
      try {
        let response;
        if (editingTable) {
          // ---- UPDATE API CALL ----
          response = await updateRestaurantTable(editingTable.id, values, token);
          if (response.success) {
            // Update table in local state
            setTables(tables.map(table =>
              table.id === editingTable.id ? response.table : table
            ));
            toast.success('Table updated successfully');
          }
        } else {
          // ---- CREATE API CALL ----
          const payload = {
              ...values,
              restaurant_id: selectedRestaurant.id // Add restaurant_id
          };
          response = await createRestaurantTable(payload, token);
           if (response.success) {
             // Add new table to local state
             setTables([...tables, response.table]);
             toast.success('Table added successfully');
           }
        }

        // Handle API response (success or failure)
        if (response.success) {
            handleCloseTableDialog(); // Close dialog on success
        } else {
            toast.error(response.message || 'Failed to save table.');
        }

      } catch (err) {
        toast.error('An unexpected error occurred while saving the table.');
      } finally {
        setSubmittingTable(false);
      }
    }
  });

  // Handle restaurant selection
  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
    // Table fetching is handled by the useEffect hook watching selectedRestaurant
  };

  // Open dialog to add a new table
  const handleAddTable = () => {
    if (!selectedRestaurant) {
        toast.warn("Please select a restaurant first.");
        return;
    }
    setEditingTable(null);
    tableFormik.resetForm({ values: { table_number: '', capacity: 2 } }); // Reset with defaults
    setTableDialogOpen(true);
  };

  // Open dialog to edit a table
  const handleEditTable = (table) => {
    setEditingTable(table);
    tableFormik.setValues({
      table_number: table.table_number,
      capacity: table.capacity
    });
    setTableDialogOpen(true);
  };

  // Handle table deletion
  const handleDeleteTable = async (tableId) => {
    // Optional: Add a confirmation dialog here
    if (!window.confirm("Are you sure you want to delete this table?")) {
        return;
    }

    try {
      // ---- DELETE API CALL ----
      const response = await deleteRestaurantTable(tableId, token);
      if (response.success) {
        // Remove table from local state
        setTables(tables.filter(table => table.id !== tableId));
        toast.success('Table deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete table.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred while deleting the table.');
    }
  };

  // Close table dialog
  const handleCloseTableDialog = () => {
    setTableDialogOpen(false);
    setEditingTable(null);
    tableFormik.resetForm();
  };

  // ---- Render Logic ----

  if (loadingRestaurants) {
    // ... Loading indicator ...
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
  }

  if (error) {
    // ... Error display for restaurant loading ...
    return <Container maxWidth="lg" sx={{ my: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!selectedRestaurant && restaurants.length === 0) {
      // ... No restaurants found message and add button ...
      return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>No Restaurants Found</Typography>
            <Typography paragraph>You haven't added any restaurants yet.</Typography>
            <Button variant="contained" onClick={() => navigate('/restaurant-form')} startIcon={<Add />}>
              Add Your First Restaurant
            </Button>
          </Paper>
        </Container>
      );
  }

  // Main component render
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Restaurant Settings
      </Typography>

      {/* Restaurant Selector */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Restaurant
        </Typography>
        {restaurants.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: selectedRestaurant ? 2 : 0 }}>
              {restaurants.map((restaurant) => (
                <Chip
                  key={restaurant.id}
                  label={restaurant.name}
                  onClick={() => handleRestaurantSelect(restaurant)}
                  color={selectedRestaurant?.id === restaurant.id ? 'primary' : 'default'}
                  variant={selectedRestaurant?.id === restaurant.id ? 'filled' : 'outlined'}
                  clickable // Make it clear it's clickable
                />
              ))}
            </Box>
            {selectedRestaurant && (
                <Typography variant="body2" color="text.secondary">
                 {selectedRestaurant.address_line1}, {selectedRestaurant.city}, {selectedRestaurant.state}
                </Typography>
            )}
          </>
        ) : (
           <Typography color="text.secondary">No restaurants available.</Typography> // Should not happen if initial check is done
        )}
      </Paper>

      {/* Tables Management - Only show if a restaurant is selected */}
      {selectedRestaurant && (
        <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                Table Management for "{selectedRestaurant.name}"
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddTable}
              >
                Add Table
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

          {loadingTables ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : tablesError ? (
             <Alert severity="error">{tablesError}</Alert>
          ) : tables.length > 0 ? (
            <TableContainer>
              <Table size="small"> {/* Optional: Make table smaller */}
                <TableHead>
                  <TableRow>
                    <TableCell>Table Number/Name</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow hover key={table.id}> {/* Add hover effect */}
                      <TableCell>{table.table_number}</TableCell>
                      <TableCell>{table.capacity} {table.capacity === 1 ? 'person' : 'people'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit Table">
                          <IconButton size="small" color="primary" onClick={() => handleEditTable(table)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Table">
                          <IconButton size="small" color="error" onClick={() => handleDeleteTable(table.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                No tables configured for this restaurant yet.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddTable}
                sx={{mt: 1}}
              >
                Add First Table
              </Button>
            </Paper>
          )}
        </Paper>
      )}

      {/* Table Dialog */}
      <Dialog open={tableDialogOpen} onClose={handleCloseTableDialog} maxWidth="xs" fullWidth> {/* Smaller dialog */}
        <form onSubmit={tableFormik.handleSubmit}>
          <DialogTitle>{editingTable ? 'Edit Table' : 'Add New Table'}</DialogTitle>
          <DialogContent>
            {/* Optional: Add DialogContentText for instructions */}
            {/* <DialogContentText sx={{ mb: 2 }}>
              Enter the table identifier (e.g., "Table 5", "Patio 2") and its seating capacity.
            </DialogContentText> */}
            <Grid container spacing={2} sx={{ pt: 1 }}> {/* Reduced spacing */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="table_number"
                  name="table_number"
                  label="Table Number/Name"
                  value={tableFormik.values.table_number}
                  onChange={tableFormik.handleChange}
                  onBlur={tableFormik.handleBlur}
                  error={tableFormik.touched.table_number && Boolean(tableFormik.errors.table_number)}
                  helperText={tableFormik.touched.table_number && tableFormik.errors.table_number}
                  required
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                 <FormControl fullWidth error={tableFormik.touched.capacity && Boolean(tableFormik.errors.capacity)}>
                  <InputLabel id="capacity-label">Capacity</InputLabel>
                  <Select
                    labelId="capacity-label"
                    id="capacity"
                    name="capacity"
                    value={tableFormik.values.capacity}
                    label="Capacity"
                    onChange={tableFormik.handleChange}
                    onBlur={tableFormik.handleBlur}
                    required
                  >
                    {[...Array(20).keys()].map(i => i + 1).map((num) => ( // Generate numbers 1-20
                      <MenuItem key={num} value={num}>
                        {num} {num === 1 ? 'person' : 'people'}
                      </MenuItem>
                    ))}
                     {/* Add larger options if needed */}
                    <MenuItem value={25}>25 people</MenuItem>
                    <MenuItem value={30}>30 people</MenuItem>
                  </Select>
                   {tableFormik.touched.capacity && tableFormik.errors.capacity && (
                     <Typography variant="caption" color="error" sx={{ ml: 2, mt: 1}}> {/* Adjusted helper text position */}
                       {tableFormik.errors.capacity}
                     </Typography>
                   )}
                </FormControl>

              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTableDialog} disabled={submittingTable} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submittingTable || !tableFormik.dirty || !tableFormik.isValid} // Disable if not dirty or invalid
              startIcon={submittingTable ? <CircularProgress size={20} color="inherit"/> : <Save />}
            >
              {submittingTable ? (editingTable ? 'Updating...' : 'Adding...') : (editingTable ? 'Update Table' : 'Add Table')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default RestaurantSettings;
