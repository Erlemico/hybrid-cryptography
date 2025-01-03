const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const RSA_PRIVATE_KEY = fs.readFileSync('private.pem', 'utf8');

exports.downloadAndDecryptFile = async (req, res) => {
    try {
        // 1. Ambil parameter dari request
        const { encryptedFilePath, encryptedAESKey, iv } = req.body;

        // Validasi input
        if (!encryptedFilePath || !encryptedAESKey || !iv) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        console.log('Encrypted AES Key (Base64):', encryptedAESKey);
        console.log('Initialization Vector (Base64):', iv);

        // 2. Dekode AES Key dari Base64 ke Buffer
        const encryptedKeyBuffer = Buffer.from(encryptedAESKey, 'base64');
        console.log('Encrypted Key Buffer:', encryptedKeyBuffer);

        // 3. Dekripsi key AES menggunakan RSA Private Key
        let decryptedAESKey;
        try {
            decryptedAESKey = crypto.privateDecrypt(RSA_PRIVATE_KEY, encryptedKeyBuffer);
            console.log('Decrypted AES Key:', decryptedAESKey.toString('hex'));
        } catch (err) {
            console.error('Error decrypting AES key:', err);
            return res.status(500).json({ message: 'Failed to decrypt AES key', error: err.message });
        }

        // 4. Baca file terenkripsi
        const filePath = path.join(__dirname, `..${encryptedFilePath}`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Encrypted file not found' });
        }
        const encryptedData = fs.readFileSync(filePath);

        // 5. Dekripsi file menggunakan AES
        const ivBuffer = Buffer.from(iv, 'base64');
        let decryptedData;
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', decryptedAESKey, ivBuffer);
            decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
            console.log('File decrypted successfully');
        } catch (err) {
            console.error('Error decrypting file:', err);
            return res.status(500).json({ message: 'Failed to decrypt file', error: err.message });
        }

        // 6. Simpan file hasil dekripsi
        const decryptedFilePath = filePath.replace('.enc', '.decrypted');
        try {
            fs.writeFileSync(decryptedFilePath, decryptedData);
            console.log(`Decrypted file saved to: ${decryptedFilePath}`);
        } catch (err) {
            console.error('Error saving decrypted file:', err);
            return res.status(500).json({ message: 'Failed to save decrypted file', error: err.message });
        }

        // 7. Kembalikan path file hasil dekripsi ke client
        res.json({
            message: 'File decrypted successfully',
            decryptedFilePath: `/uploads/${path.basename(decryptedFilePath)}`,
        });
    } catch (err) {
        console.error('Error during file decryption:', err);
        res.status(500).json({ message: 'Failed to decrypt file', error: err.message });
    }
};