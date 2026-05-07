const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');

// These should be in your .env file
// CLOUDINARY_CLOUD_NAME
// CLOUDINARY_API_KEY
// CLOUDINARY_API_SECRET
// CLOUDINARY_FOLDER (optional)

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads a file to Cloudinary
 * @param {Object} file - The file object from multer (memoryStorage)
 * @returns {Promise<string>} - Secure URL of the uploaded file
 */
const uploadVideoToCloudinary = async (file) => {
  try {
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({
        resource_type: 'video',
        folder: process.env.CLOUDINARY_FOLDER || undefined,
        use_filename: true,
        unique_filename: true,
      }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });

      Readable.from(file.buffer).pipe(uploadStream);
    });

    return uploadResult.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Deletes a video from Cloudinary
 * @param {string} fileLink - Public URL of the uploaded file
 */
const deleteVideoFromCloudinary = async (fileLink) => {
  try {
    if (!fileLink || !String(fileLink).includes('res.cloudinary.com')) return;

    const parsed = new URL(fileLink);
    const uploadIndex = parsed.pathname.indexOf('/upload/');
    if (uploadIndex === -1) return;

    let publicPath = parsed.pathname.slice(uploadIndex + '/upload/'.length);
    publicPath = publicPath.replace(/^v\d+\//, '');
    publicPath = decodeURIComponent(publicPath).replace(/\.[^/.?]+$/, '');

    if (!publicPath) return;

    await cloudinary.uploader.destroy(publicPath, { resource_type: 'video' });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw to avoid blocking the main flow
  }
};

module.exports = {
  uploadVideoToCloudinary,
  deleteVideoFromCloudinary,
};
