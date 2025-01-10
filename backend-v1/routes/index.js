const express = require('express');
const { uploadAndEncryptFile } = require('../controllers/encryptionController');
const { downloadAndDecryptFile } = require('../controllers/decryptionController');
const { saveData, getData } = require('../controllers/deliveryController');

const router = express.Router();

router.post('/encrypt', uploadAndEncryptFile); // Upload and encrypt
router.post('/decrypt', downloadAndDecryptFile); // Decrypt and download
router.post('/send-key', saveData); // Send information to db
router.get('/get-key/:id', getData); // Get information from db

module.exports = router;