const { google } = require('googleapis');
const stream = require('stream');
const path = require('path');

// These should be in your .env file
// GOOGLE_DRIVE_CLIENT_ID
// GOOGLE_DRIVE_CLIENT_SECRET
// GOOGLE_DRIVE_REDIRECT_URI
// GOOGLE_DRIVE_REFRESH_TOKEN
// GOOGLE_DRIVE_FOLDER_ID (Optional: ID of the folder where you want to save videos)

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

/**
 * Uploads a file to Google Drive
 * @param {Object} file - The file object from multer (memoryStorage)
 * @returns {Promise<string>} - The webViewLink or id of the uploaded file
 */
const uploadVideoToDrive = async (file) => {
  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const response = await drive.files.create({
      requestBody: {
        name: `${Date.now()}-${file.originalname}`,
        mimeType: file.mimetype,
        parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : [],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
    });

    const fileId = response.data.id;

    // Make the file publicly viewable (optional, but necessary if you want patients to see it)
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Get the webViewLink
    const result = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink',
    });

    return result.data.webViewLink;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
};

/**
 * Deletes a file from Google Drive
 * @param {string} fileLink - The link of the file to delete
 */
const deleteVideoFromDrive = async (fileLink) => {
  try {
    // Extract file ID from link
    // Example: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
    const match = fileLink.match(/\/d\/(.+)\//);
    const fileId = match ? match[1] : null;

    if (fileId) {
      await drive.files.delete({
        fileId: fileId,
      });
    }
  } catch (error) {
    console.error('Error deleting from Google Drive:', error);
    // Don't throw to avoid blocking the main flow
  }
};

module.exports = {
  uploadVideoToDrive,
  deleteVideoFromDrive,
};
