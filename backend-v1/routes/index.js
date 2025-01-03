const express = require('express');
const { uploadAndEncryptFile, downloadFile } = require('../controllers/encryptionController');
const { downloadAndDecryptFile } = require('../controllers/decryptionController');

const router = express.Router();

router.post('/upload', uploadAndEncryptFile); // Upload dan enkripsi
router.post('/decrypt', downloadAndDecryptFile); // Unduh dan dekripsi
router.get('/download/:filename', downloadFile); // Unduh file terenkripsi

module.exports = router;