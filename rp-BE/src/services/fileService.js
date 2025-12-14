// const fs = require('fs').promises;
// const path = require('path');
// const crypto = require('crypto');

// // For serverless deployment, we'll use a different approach
// const isServerless = process.env.NODE_ENV === 'production';

// // Upload file (serverless compatible)
// const uploadFile = async (file) => {
//   if (isServerless) {
//     // In serverless environment, return a mock response
//     // For production, you'd use cloud storage like AWS S3, Cloudinary, etc.
//     return {
//       url: `https://placeholder-image-url.com/${crypto.randomUUID()}.jpg`,
//       path: 'serverless-upload',
//       originalName: file.originalname,
//       size: file.size,
//       mimetype: file.mimetype
//     };
//   }

//   // Local development - use filesystem
//   const uploadDir = path.join(__dirname, '../uploads');
  
//   // Ensure upload directory exists
//   try {
//     await fs.access(uploadDir);
//   } catch (error) {
//     await fs.mkdir(uploadDir, { recursive: true });
//   }
  
//   const fileExt = path.extname(file.originalname);
//   const fileName = `${crypto.randomUUID()}${fileExt}`;
//   const filePath = path.join(uploadDir, fileName);
  
//   await fs.rename(file.path, filePath);
  
//   return {
//     url: `/uploads/${fileName}`,
//     path: filePath,
//     originalName: file.originalname,
//     size: file.size,
//     mimetype: file.mimetype
//   };
// };

// // Delete file (serverless compatible)
// const deleteFile = async (filePath) => {
//   if (isServerless) {
//     // In serverless environment, just log the deletion
//     console.log('File deletion requested (serverless):', filePath);
//     return true;
//   }

//   try {
//     const fullPath = path.join(__dirname, '..', filePath);
//     await fs.unlink(fullPath);
//     return true;
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     return false;
//   }
// };

// module.exports = {
//   uploadFile,
//   deleteFile
// };

/**
 * File Service - Handles image uploads to Cloudinary (production) and local filesystem (development)
 * 
 * PRODUCTION (Cloudinary):
 * - Uploads to Cloudinary automatically when NODE_ENV=production or CLOUDINARY_CLOUD_NAME is set
 * - Returns secure_url from Cloudinary (e.g., https://res.cloudinary.com/...)
 * 
 * DEVELOPMENT (Local):
 * - Saves files to src/uploads/ folder
 * - Returns relative path (e.g., /uploads/filename.jpg)
 */

const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

// ===========================
// CLOUDINARY CONFIGURATION
// ===========================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===========================
// CHECK IF CLOUDINARY CONFIGURED
// ===========================
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// ===========================
// UPLOAD FILE FUNCTION
// ===========================
/**
 * Upload file to Cloudinary (production) or local filesystem (development)
 * @param {object} file - Multer file object with {buffer, originalname, mimetype, size}
 * @returns {Promise<{url, publicId?, path?, originalName, size, mimetype}>}
 */
const uploadFile = async (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  console.log('📤 Starting file upload:', {
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    environment: process.env.NODE_ENV || 'development'
  });

  // ===========================
  // PRODUCTION: CLOUDINARY UPLOAD
  // ===========================
  if (process.env.NODE_ENV === 'production' || isCloudinaryConfigured()) {
    return uploadToCloudinary(file);
  }

  // ===========================
  // DEVELOPMENT: LOCAL UPLOAD
  // ===========================
  return uploadToLocal(file);
};

// ===========================
// CLOUDINARY UPLOAD HELPER
// ===========================
/**
 * Upload file to Cloudinary using stream
 * @param {object} file - Multer file object
 * @returns {Promise<{url, publicId, originalName, size, mimetype}>}
 */
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    console.log('☁️  Uploading to Cloudinary...');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'return-point-items',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        quality: 'auto',
        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: 'limit',
            quality: 'auto'
          }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error.message);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          console.log('✅ Cloudinary upload successful:', {
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height
          });

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            cloudinary: true
          });
        }
      }
    );

    // Upload file buffer to Cloudinary
    uploadStream.end(file.buffer);

    // Handle stream errors
    uploadStream.on('error', (error) => {
      console.error('❌ Upload stream error:', error);
      reject(new Error(`Upload stream failed: ${error.message}`));
    });
  });
};

// ===========================
// LOCAL UPLOAD HELPER
// ===========================
/**
 * Upload file to local filesystem
 * @param {object} file - Multer file object
 * @returns {Promise<{url, path, originalName, size, mimetype}>}
 */
const uploadToLocal = async (file) => {
  try {
    console.log('💾 Uploading to local filesystem...');

    const uploadDir = path.join(__dirname, '../uploads');

    // Create uploads directory if it doesn't exist
    try {
      await fs.access(uploadDir);
    } catch (error) {
      console.log('📁 Creating uploads directory:', uploadDir);
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, fileExt);
    const fileName = `${baseName}-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const fullPath = path.join(uploadDir, fileName);

    // Write file to disk
    await fs.writeFile(fullPath, file.buffer);

    console.log('✅ Local upload successful:', {
      filename: fileName,
      path: fullPath,
      size: file.size
    });

    return {
      url: `/uploads/${fileName}`,
      path: fullPath,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      local: true
    };
  } catch (error) {
    console.error('❌ Local upload error:', error.message);
    throw new Error(`Local file upload failed: ${error.message}`);
  }
};

// ===========================
// DELETE FILE FUNCTION
// ===========================
/**
 * Delete file from Cloudinary (production) or local filesystem (development)
 * @param {string} filePath - File URL or path to delete
 * @returns {Promise<boolean>}
 */
const deleteFile = async (filePath) => {
  if (!filePath) {
    console.warn('⚠️  No file path provided for deletion');
    return false;
  }

  console.log('🗑️  Attempting to delete file:', filePath);

  // ===========================
  // DELETE FROM CLOUDINARY
  // ===========================
  if (filePath && filePath.includes('res.cloudinary')) {
    return deleteFromCloudinary(filePath);
  }

  // ===========================
  // DELETE FROM LOCAL
  // ===========================
  if (filePath && !filePath.includes('http')) {
    return deleteFromLocal(filePath);
  }

  console.warn('⚠️  Could not determine file storage type:', filePath);
  return false;
};

// ===========================
// CLOUDINARY DELETE HELPER
// ===========================
/**
 * Delete file from Cloudinary
 * @param {string} fileUrl - Cloudinary secure URL
 * @returns {Promise<boolean>}
 */
const deleteFromCloudinary = async (fileUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/public_id.ext
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1]; // e.g., public_id.jpg
    const publicId = `return-point-items/${fileName.split('.')[0]}`; // Include folder

    console.log('☁️  Deleting from Cloudinary:', publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    console.log('✅ Cloudinary deletion successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary deletion error:', error.message);
    // Don't throw - deletion failure shouldn't break the app
    return false;
  }
};

// ===========================
// LOCAL DELETE HELPER
// ===========================
/**
 * Delete file from local filesystem
 * @param {string} filePath - Relative or absolute file path
 * @returns {Promise<boolean>}
 */
const deleteFromLocal = async (filePath) => {
  try {
    // If filePath is relative (e.g., /uploads/file.jpg), convert to absolute
    let fullPath = filePath;
    if (!path.isAbsolute(filePath)) {
      fullPath = path.join(__dirname, '..', filePath);
    }

    console.log('💾 Deleting from local filesystem:', fullPath);

    await fs.unlink(fullPath);

    console.log('✅ Local file deletion successful');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️  File not found (may have already been deleted):', filePath);
      return true; // Treat as success - file doesn't exist anyway
    }
    console.error('❌ Local file deletion error:', error.message);
    // Don't throw - deletion failure shouldn't break the app
    return false;
  }
};

// ===========================
// EXPORTS
// ===========================
module.exports = {
  uploadFile,
  deleteFile,
  isCloudinaryConfigured
};