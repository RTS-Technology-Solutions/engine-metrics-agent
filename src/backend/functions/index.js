const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules one by one to isolate issues
const { uploadHandler } = require('./data-ingestion');
const { processDataWithAI } = require('./ai-processing');
const { handleQuery } = require('./query-handler');

// Simple health check function
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      message: 'Firebase Functions are healthy!',
      timestamp: new Date().toISOString(),
      project: process.env.GCLOUD_PROJECT
    });
  });
});

// Data upload endpoint
exports.uploadData = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    uploadHandler(req, res);
  });
});

// AI processing endpoint
exports.processAI = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    processDataWithAI(req, res);
  });
});

// Query handling endpoint (testing this first)
exports.query = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    handleQuery(req, res);
  });
});

console.log('✅ Functions with query handler loaded successfully');