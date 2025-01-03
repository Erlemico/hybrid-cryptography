const crypto = require('crypto');
const fs = require('fs');

// Fungsi untuk enkripsi menggunakan AES
function encryptWithAES(fileBuffer, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    return { encryptedData, iv };
}

// Fungsi untuk enkripsi kunci AES menggunakan RSA
function encryptAESKeyWithRSA(key, publicKey) {
    return crypto.publicEncrypt(publicKey, key);
}

// Fungsi dekripsi kunci AES menggunakan RSA
function decryptAESKeyWithRSA(encryptedKey, privateKey) {
    return crypto.privateDecrypt(privateKey, encryptedKey);
}

// Fungsi dekripsi file menggunakan AES
function decryptWithAES(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decryptedData;
}

module.exports = { decryptAESKeyWithRSA, decryptWithAES };
module.exports = { encryptWithAES, encryptAESKeyWithRSA };