const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { EncryptedFile } = require("../models");

const RSA_PRIVATE_KEY = fs.readFileSync('private.pem', 'utf8');

exports.simulateBruteForceById = async (req, res) => {
    try {
        // 1. Retrieve `id` from request
        const { id } = req.body;

        // Validate input
        if (!id) {
            return res.status(400).json({
                status: "error",
                message: 'Missing required parameter: id',
            });
        }

        // 2. Cek data di database berdasarkan `id`
        const fileRecord = await EncryptedFile.findOne({ where: { id } });
        if (!fileRecord) {
            return res.status(404).json({
                status: "error",
                message: 'File record not found in database',
            });
        }

        // Ambil data dari database
        const { fileName, rsaKey, iv } = fileRecord;

        // Decode RSA-encrypted AES key
        const encryptedKeyBuffer = Buffer.from(rsaKey, 'base64');
        let decryptedAESKey;
        try {
            decryptedAESKey = crypto.privateDecrypt(RSA_PRIVATE_KEY, encryptedKeyBuffer);
            console.log('Decrypted AES Key:', decryptedAESKey.toString('hex'));
        } catch (err) {
            console.error('Error decrypting AES key:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to decrypt AES key',
                error: err.message,
            });
        }

        // Read encrypted file
        const filePath = path.join(__dirname, '../encrypted', path.basename(fileName));
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                status: "error",
                message: 'Encrypted file not found',
            });
        }
        const encryptedData = fs.readFileSync(filePath);

        // Decode IV from Base64
        const ivBuffer = Buffer.from(iv, 'base64');

        // 3. Simulate brute-force attack
        const keySpace = 256; // Small key space for simulation
        let foundKey = null;
        let decryptedData = null;

        console.log(`Starting brute-force over ${keySpace} possible keys...`);
        for (let key = 0; key < keySpace; key++) {
            const testKey = Buffer.alloc(32, key); // Pad key to 32 bytes (AES-256-CBC)
            try {
                const decipher = crypto.createDecipheriv('aes-256-cbc', testKey, ivBuffer);
                decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

                console.log(`Key ${key} successfully decrypted the file!`);
                foundKey = key;
                break;
            } catch (err) {
                // Ignore errors, try next key
            }
        }

        if (!foundKey) {
            return res.status(500).json({
                status: "error",
                message: 'Failed to brute-force the encrypted file',
            });
        }

        // 4. Save decrypted file
        const decryptedDir = path.join(__dirname, '../decrypted');
        if (!fs.existsSync(decryptedDir)) {
            fs.mkdirSync(decryptedDir, { recursive: true });
        }

        const decryptedFileName = path.basename(filePath.replace('.enc', ''));
        const decryptedFilePath = path.join(decryptedDir, decryptedFileName);
        fs.writeFileSync(decryptedFilePath, decryptedData);

        console.log(`Decrypted file saved to: ${decryptedFilePath}`);

        // 5. Send response to client
        res.json({
            message: 'Brute-force simulation completed successfully',
            foundKey,
            decryptedFilePath: `/decrypted/${decryptedFileName}`,
        });
    } catch (err) {
        console.error('Error during brute-force simulation:', err);
        res.status(500).json({
            status: "error",
            message: 'An error occurred during brute-force simulation',
            error: err.message,
        });
    }
};
