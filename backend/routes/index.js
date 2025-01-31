const express = require('express');
const { uploadAndEncryptFile } = require('../controllers/encryptionController');
const { downloadAndDecryptFile, decryptById } = require('../controllers/decryptionController');
const { saveData, getAllData, getById } = require('../controllers/deliveryController');
const { simulateBruteForceById } = require('../controllers/bruteforceController');

const router = express.Router();

router.post('/encrypt', uploadAndEncryptFile); // Upload and encrypt
router.post('/decrypt', downloadAndDecryptFile); // Decrypt and view the result
router.post('/decrypt-by-id', decryptById); // Decrypt and download
router.post('/send-key', saveData); // Send information to db
router.get('/get-key', getAllData); // Get information from db
router.get('/get-key/:id', getById); // Get information from db
router.post('/bruteforce', simulateBruteForceById); // Bruteforce to decrypt encrypted file

module.exports = router;