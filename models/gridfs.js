// GridFS helper for video upload
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfsBucket;

function initGridFS(connection) {
  if (!gfsBucket) {
    gfsBucket = new GridFSBucket(connection.db, { bucketName: 'videos' });
  }
  return gfsBucket;
}

module.exports = { initGridFS };
