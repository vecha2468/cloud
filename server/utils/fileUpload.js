// server/utils/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup storage for restaurant photos
const restaurantPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const restaurantDir = path.join(uploadsDir, 'restaurants');
    if (!fs.existsSync(restaurantDir)) {
      fs.mkdirSync(restaurantDir, { recursive: true });
    }
    cb(null, restaurantDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `restaurant-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter to only allow images
const imageFileFilter = (req, file, cb) => {
  // Allow only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer upload for restaurant photos
const uploadRestaurantPhotos = multer({
  storage: restaurantPhotoStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: imageFileFilter
});

// Handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files at once.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Delete file from uploads directory
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

module.exports = {
  uploadRestaurantPhotos,
  handleUploadError,
  deleteFile
};