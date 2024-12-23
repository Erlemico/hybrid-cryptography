// Frontend: React.js
// ======================

const crypto = require('crypto');
const axios = require('axios');
const NodeRSA = require('node-rsa');
const fs = require('fs');

// RSA Key Pair Generation
const rsaKey = new NodeRSA({ b: 2048 });
const privateKey = rsaKey.exportKey('private');
const publicKey = rsaKey.exportKey('public');

// Generate AES Key
const generateAESKey = () => crypto.randomBytes(32).toString('hex');

// AES Encryption
const encryptFileWithAES = (filePath, aesKey) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), iv);

  const input = fs.createReadStream(filePath);
  const encryptedPath = `${filePath}.enc`;
  const output = fs.createWriteStream(encryptedPath);

  input.pipe(cipher).pipe(output);
  return { iv: iv.toString('hex'), encryptedPath };
};

// AES Decryption
const decryptFileWithAES = (filePath, aesKey, iv) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), Buffer.from(iv, 'hex'));

  const input = fs.createReadStream(filePath);
  const decryptedPath = filePath.replace('.enc', '.dec');
  const output = fs.createWriteStream(decryptedPath);

  input.pipe(decipher).pipe(output);
  return decryptedPath;
};

// Encrypt AES Key with RSA
const encryptAESKeyWithRSA = (aesKey) => rsaKey.encrypt(aesKey, 'base64');

// Decrypt AES Key with RSA
const decryptAESKeyWithRSA = (encryptedKey) => rsaKey.decrypt(encryptedKey, 'utf8');

// Simulate File Encryption and Key Upload
(async () => {
  const filePath = 'example.txt'; // Replace with your file
  const aesKey = generateAESKey();

  console.log('Encrypting file...');
  const { iv, encryptedPath } = encryptFileWithAES(filePath, aesKey);

  console.log('Encrypting AES key with RSA...');
  const encryptedAESKey = encryptAESKeyWithRSA(aesKey);

  console.log('Uploading encrypted AES key to server...');
  const fileId = 'file123'; // Unique identifier for the file
  await axios.post('http://localhost:3000/upload-key', {
    fileId,
    encryptedAESKey,
  });

  console.log('Encrypted AES key uploaded successfully.');

  console.log('Retrieving encrypted AES key from server...');
  const response = await axios.get(`http://localhost:3000/get-key/${fileId}`);
  const retrievedEncryptedAESKey = response.data.encryptedAESKey;

  console.log('Decrypting AES key...');
  const decryptedAESKey = decryptAESKeyWithRSA(retrievedEncryptedAESKey);

  console.log('Decrypting file...');
  const decryptedFilePath = decryptFileWithAES(encryptedPath, decryptedAESKey, iv);

  console.log(`File decrypted successfully: ${decryptedFilePath}`);
})();
