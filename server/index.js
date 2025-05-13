// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Environment Variables ---
// Load .env file ONLY for local development.
// In AWS Elastic Beanstalk, configure these in Environment Properties.
if (process.env.NODE_ENV !== 'production') {
  // Ensure this path is correct relative to server/index.js
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
  console.log('[ENV] Loaded .env file for local development.');
} else {
  console.log('[ENV] Running in production mode (assuming EB Environment Properties).');
}

// --- Essential Imports & App Initialization ---
const app = express();
const PORT = process.env.PORT || 5000; // Correct for EB and local fallback

// Database connection (ensure this path is correct)
const db = require('./config/database');

// --- Core Middleware ---
app.use(cors()); // TODO: Configure allowed origins specifically for production
app.use(express.json()); // Modern replacement for body-parser JSON
app.use(express.urlencoded({ extended: true })); // Modern replacement for body-parser urlencoded
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection Test (Optional but helpful) ---
async function testDbConnection() {
  try {
    const connection = await db.getConnection();
    console.log('[DB] Database connected successfully (via test).');
    connection.release();
  } catch (err) {
    // Log details but don't prevent app startup if DB isn't immediately ready
    console.error('[DB Error] Initial database connection test failed:', err.message || err);
  }
}
testDbConnection();

// --- API Routes ---
// Define API endpoints BEFORE the static file serving/catch-all route
console.log('[Routes] Configuring API routes...');
try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/restaurants', require('./routes/restaurants'));
    app.use('/api/reservations', require('./routes/reservations'));
    app.use('/api/reviews', require('./routes/reviews'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/tables', require('./routes/tables'));
    console.log('[Routes] API routes configured successfully.');
} catch (routeError) {
    console.error('[Routes Error] Failed to load API routes:', routeError);
    // Depending on the error, you might want to exit or handle differently
    process.exit(1); // Exit if routes can't be loaded, as the app is broken
}


// --- Static Frontend Serving ---
console.log('[Static Serve] Configuring static file serving...');
// Construct the path to the 'build' folder.
// ASSUMPTION: The 'build' folder is located one directory level UP
// from the 'server' directory where this index.js resides.
// This MATCHES the target zip structure: zip_root/build and zip_root/server
const buildPath = path.join(__dirname, '..', 'build');

// --- IMPORTANT LOGGING FOR DEBUGGING ---
console.log(`[Static Serve] Current directory (__dirname): ${__dirname}`);
console.log(`[Static Serve] Calculated build path: ${buildPath}`);
// Check if the calculated build path actually exists from the server's perspective
const fs = require('fs'); // Require fs just for this check
try {
    if (fs.existsSync(buildPath)) {
        console.log(`[Static Serve] Verified build path exists: ${buildPath}`);
        // Check specifically for index.html within the build path
        if (fs.existsSync(path.join(buildPath, 'index.html'))) {
            console.log(`[Static Serve] Verified index.html exists within build path.`);
        } else {
            console.warn(`[Static Serve Warning] index.html NOT FOUND inside verified build path: ${path.join(buildPath, 'index.html')}`);
        }
    } else {
        // This would be the core issue if hit
        console.error(`[Static Serve Error] Calculated build path DOES NOT EXIST: ${buildPath}`);
    }
} catch (e) {
     console.error(`[Static Serve Error] Error checking build path existence:`, e);
}
// --- END IMPORTANT LOGGING ---


// Serve static assets (CSS, JS, images, etc.) from the 'build' directory
app.use(express.static(buildPath));

// Catch-all route: For any request not handled by API routes or static files,
// serve the main 'index.html' file from the 'build' directory.
// React Router will then take over routing on the client-side.
app.get('*', (req, res, next) => { // Added next for clarity if needed later
  const indexPath = path.join(buildPath, 'index.html');
  console.log(`[Catchall Route] Request received for '${req.originalUrl}', attempting to serve: ${indexPath}`);

  res.sendFile(indexPath, (err) => {
    if (err) {
      // Log the error details server-side
      console.error(`[Catchall Error] Failed to send file '${indexPath}' for URL '${req.originalUrl}':`, err);
      // Avoid sending detailed error object to client unless debugging
      // ENOENT specifically means the file wasn't found AT THE PATH specified.
      if (err.code === 'ENOENT') {
         res.status(404).send(`Error: Could not find the required application file at ${indexPath}. Check server path configuration and deployment package.`);
      } else {
         res.status(500).send('An internal error occurred while trying to load the application.');
      }
      // It's often useful to pass the error to a dedicated error handler if you have one
      // next(err);
    } else {
      console.log(`[Catchall Route] Successfully sent file: ${indexPath} for URL '${req.originalUrl}'`);
    }
  });
});
console.log('[Static Serve] Static file serving configured.');


// --- Health Check Endpoint (Good Practice) ---
app.get('/health', (req, res) => {
  // Could add checks for DB status etc. here later
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- Final Error Handling Middleware (Keep Last) ---
// This catches errors passed via next(err) or uncaught synchronous errors in route handlers
app.use((err, req, res, next) => {
  console.error('[Unhandled Error Middleware] Error caught:', err.stack || err);

  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err); // Delegate to default Express error handler
  }

  // Respond with a generic error message
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    // Only include error details in development for security reasons
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`[Server] Express server listening on port ${PORT}`);
  console.log(`[Server] NODE_ENV is set to: ${process.env.NODE_ENV || 'development (default)'}`);
});

// --- Optional: Handle unhandled promise rejections ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] At:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// --- Optional: Handle uncaught exceptions ---
process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception] Error:', error);
  // It's often recommended to gracefully shut down the server here
  // process.exit(1);
});
