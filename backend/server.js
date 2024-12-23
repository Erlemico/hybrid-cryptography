// Hybrid Cryptography File Sharing System

// Backend: Express.js
// ======================

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Storage for encrypted AES keys
let encryptedAESKeyStore = {};

// Endpoint to upload encrypted AES key
app.post('/upload-key', (req, res) => {
  const { fileId, encryptedAESKey } = req.body;

  if (!fileId || !encryptedAESKey) {
    return res.status(400).json({ error: 'fileId and encryptedAESKey are required' });
  }

  // Store the encrypted AES key
  encryptedAESKeyStore[fileId] = encryptedAESKey;

  res.status(200).json({ message: 'Encrypted AES key uploaded successfully.' });
});

// Endpoint to retrieve encrypted AES key
app.get('/get-key/:fileId', (req, res) => {
  const { fileId } = req.params;

  const encryptedAESKey = encryptedAESKeyStore[fileId];
  if (!encryptedAESKey) {
    return res.status(404).json({ error: 'Encrypted AES key not found.' });
  }

  res.status(200).json({ encryptedAESKey });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});