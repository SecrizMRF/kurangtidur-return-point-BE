// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Create uploads directory if it doesn't exist
// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed.'));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: fileFilter
// });

// module.exports = upload;

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Multer Upload Middleware - CONFIGURED FOR MANUAL CLOUDINARY UPLOAD
 * 
 * Configuration:
 * - Uses memory storage (file content in req.file.buffer)
 * - File buffer is passed to fileService.uploadFile()
 * - fileService handles upload to Cloudinary (production) or local (development)
 * 
 * Flow:
 * 1. User uploads file via form
 * 2. Multer stores file in memory as buffer
 * 3. Controller receives req.file with {buffer, originalname, mimetype, size}
 * 4. Controller calls uploadFile(req.file)
 * 5. uploadFile() sends buffer to Cloudinary or saves to local filesystem
 */

// ===========================
// STORAGE CONFIGURATION
// ===========================
// Memory storage - stores file content in buffer
// This allows easy upload to Cloudinary without disk I/O
const storage = multer.memoryStorage();

// ===========================
// FILE TYPE VALIDATION
// ===========================
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG files are allowed.'));
  }
};

// ===========================
// MULTER CONFIGURATION
// ===========================
const upload = multer({
  storage: storage,           // Memory storage for buffer
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter      // Type validation
});

module.exports = upload;