const express = require('express');
const { uploadAndEncryptFile, getAllEncryptedFiles } = require('../controllers/encryptionController');
const { downloadAndDecryptFile, decryptById } = require('../controllers/decryptionController');
const { saveData, getAllData, getById } = require('../controllers/deliveryController');

const router = express.Router();

router.post('/encrypt', uploadAndEncryptFile); // Upload and encrypt
router.post('/decrypt', downloadAndDecryptFile); // Decrypt and download
router.get('/decrypt/:id', decryptById); // Decrypt and download
router.post('/send-key', saveData); // Send information to db
router.get('/get-key', getAllData); // Get information from db
router.get('/get-key/:id', getById); // Get information from db

// Endpoint untuk mendapatkan daftar file terenkripsi
router.get('/files', getAllEncryptedFiles);

module.exports = router;