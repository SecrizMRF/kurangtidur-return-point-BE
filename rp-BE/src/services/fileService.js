const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// For serverless deployment, we'll use a different approach
const isServerless = process.env.NODE_ENV === 'production';

// Upload file (serverless compatible)
const uploadFile = async (file) => {
  if (isServerless) {
    // In serverless environment, return a mock response
    // For production, you'd use cloud storage like AWS S3, Cloudinary, etc.
    return {
      url: `https://placeholder-image-url.com/${crypto.randomUUID()}.jpg`,
      path: 'serverless-upload',
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  // Local development - use filesystem
  const uploadDir = path.join(__dirname, '../uploads');
  
  // Ensure upload directory exists
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  const fileExt = path.extname(file.originalname);
  const fileName = `${crypto.randomUUID()}${fileExt}`;
  const filePath = path.join(uploadDir, fileName);
  
  await fs.rename(file.path, filePath);
  
  return {
    url: `/uploads/${fileName}`,
    path: filePath,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype
  };
};

// Delete file (serverless compatible)
const deleteFile = async (filePath) => {
  if (isServerless) {
    // In serverless environment, just log the deletion
    console.log('File deletion requested (serverless):', filePath);
    return true;
  }

  try {
    const fullPath = path.join(__dirname, '..', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  uploadFile,
  deleteFile
};