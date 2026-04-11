const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dv0heb3cz',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'alumni-platform/profiles') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
};

// Get optimized image URL
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    fetch_format: 'auto',
    quality: 'auto',
    secure: true,
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedUrl
};
