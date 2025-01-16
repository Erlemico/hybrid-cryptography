const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { EncryptedFile } = require("../models");
const pidusage = require('pidusage');

const RSA_PRIVATE_KEY = fs.readFileSync('private.pem', 'utf8');

exports.downloadAndDecryptFile = async (req, res) => {
    try {
        const startTime = process.hrtime(); // Mulai pencatatan waktu
        const initialMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // RAM awal dalam MB

        // 1. Retrieve parameters from request
        const { fileName, rsaKey, iv } = req.body;

        // Validate input
        if (!fileName || !rsaKey || !iv) {
            return res.status(400).json({
                status: "error",
                message: 'Missing required parameters'
            });
        }

        console.log('Encrypted AES Key (Base64):', rsaKey);
        console.log('Initialization Vector (Base64):', iv);

        // 2. Decode AES Key from Base64 to Buffer
        const encryptedKeyBuffer = Buffer.from(rsaKey, 'base64');
        console.log('Encrypted Key Buffer:', encryptedKeyBuffer);

        // 3. AES key decryption using RSA Private Key
        let decryptedAESKey;
        try {
            decryptedAESKey = crypto.privateDecrypt(RSA_PRIVATE_KEY, encryptedKeyBuffer);
            console.log('Decrypted AES Key:', decryptedAESKey.toString('hex'));
        } catch (err) {
            console.error('Error decrypting AES key:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to decrypt AES key',
                error: err.message
            });
        }

        // 4. Read encrypted file
        const filePath = path.join(__dirname, '../encrypted', path.basename(fileName));
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                status: "error",
                message: 'Encrypted file not found'
            });
        }

        const encryptedData = fs.readFileSync(filePath);

        // 5. Decrypt files using AES
        const ivBuffer = Buffer.from(iv, 'base64');
        let decryptedData;
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', decryptedAESKey, ivBuffer);
            decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
            console.log('File decrypted successfully');
        } catch (err) {
            console.error('Error decrypting file:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to decrypt file',
                error: err.message
            });
        }

        // 6. Save decrypted file
        const decryptedDir = path.join(__dirname, '../decrypted');
        if (!fs.existsSync(decryptedDir)) {
            fs.mkdirSync(decryptedDir, { recursive: true });
        }
        const decryptedFileName = path.basename(filePath.replace('.enc', ''));
        const decryptedFilePath = path.join(decryptedDir, decryptedFileName);
        try {
            fs.writeFileSync(decryptedFilePath, decryptedData);
            console.log(`Decrypted file saved to: ${decryptedFilePath}`);
        } catch (err) {
            console.error('Error saving decrypted file:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to save decrypted file',
                error: err.message
            });
        }

        // End time
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const elapsedTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2); // Waktu dalam ms
        const finalMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // RAM akhir dalam MB
        const memoryDifference = (finalMemoryUsage - initialMemoryUsage).toFixed(2); // RAM yang digunakan dalam MB

        // CPU Usage
        const cpuUsage = await new Promise((resolve, reject) => {
            pidusage(process.pid, (err, stats) => {
                if (err) return reject(err);
                resolve(stats.cpu); // CPU usage dalam persen
            });
        });

        console.log(`Decryption Time: ${elapsedTime} ms`);
        console.log(`Memory Usage: ${memoryDifference} MB`);
        console.log(`CPU Usage: ${cpuUsage.toFixed(2)}%`);

        // 7. Return decrypted file path to client
        res.json({
            message: 'File decrypted successfully',
            decryptedFilePath: `/decrypted/${decryptedFileName}`, // URL relatif
            performance: {
                elapsedTime: `${elapsedTime} ms`,
                memoryUsed: `${memoryDifference} MB`,
                cpuUsage: `${cpuUsage.toFixed(2)}%`,
            },
        });
    } catch (err) {
        console.error('Error during file decryption:', err);
        res.status(500).json({
            status: "error",
            message: 'Failed to decrypt file',
            error: err.message
        });
    }
};

exports.decryptById = async (req, res) => {
    try {
        const startTime = process.hrtime();
        const initialMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

        // 1. Retrieve the ID from request parameters
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                status: "error",
                message: "Missing ID parameter",
            });
        }

        // 2. Fetch the record from the database
        const fileRecord = await EncryptedFile.findByPk(id);

        if (!fileRecord) {
            return res.status(404).json({
                status: "error",
                message: "Record not found",
            });
        }

        const { fileName, rsaKey, iv } = fileRecord;

        if (!fileName || !rsaKey || !iv) {
            return res.status(400).json({
                status: "error",
                message: "File record is missing required fields",
            });
        }

        console.log('File Record:', { fileName, rsaKey, iv });

        // 3. Decode AES Key from Base64 to Buffer
        const encryptedKeyBuffer = Buffer.from(rsaKey, 'base64');
        console.log('Encrypted Key Buffer:', encryptedKeyBuffer);

        // 4. Decrypt AES Key using RSA Private Key
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

        // 5. Read encrypted file
        const filePath = path.join(__dirname, '../encrypted', path.basename(fileName));
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                status: "error",
                message: 'Encrypted file not found',
            });
        }

        const encryptedData = fs.readFileSync(filePath);

        // 6. Decrypt files using AES
        const ivBuffer = Buffer.from(iv, 'base64');
        let decryptedData;
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', decryptedAESKey, ivBuffer);
            decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
            console.log('File decrypted successfully');
        } catch (err) {
            console.error('Error decrypting file:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to decrypt file',
                error: err.message,
            });
        }

        // 7. Save decrypted file
        const decryptedDir = path.join(__dirname, '../decrypted');
        if (!fs.existsSync(decryptedDir)) {
            fs.mkdirSync(decryptedDir, { recursive: true });
        }
        const decryptedFileName = path.basename(filePath.replace('.enc', ''));
        const decryptedFilePath = path.join(decryptedDir, decryptedFileName);
        try {
            fs.writeFileSync(decryptedFilePath, decryptedData);
            console.log(`Decrypted file saved to: ${decryptedFilePath}`);
        } catch (err) {
            console.error('Error saving decrypted file:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to save decrypted file',
                error: err.message,
            });
        }

        // End time
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const elapsedTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
        const finalMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        const memoryDifference = (finalMemoryUsage - initialMemoryUsage).toFixed(2);

        // CPU Usage
        const cpuUsage = await new Promise((resolve, reject) => {
            pidusage(process.pid, (err, stats) => {
                if (err) return reject(err);
                resolve(stats.cpu);
            });
        });

        console.log(`Decryption Time: ${elapsedTime} ms`);
        console.log(`Memory Usage: ${memoryDifference} MB`);
        console.log(`CPU Usage: ${cpuUsage.toFixed(2)}%`);

        // 8. Return decrypted file path to client
        res.json({
            status: "success",
            message: 'File decrypted successfully',
            data: {
                decryptedFilePath: `/decrypted/${decryptedFileName}`,
                performance: {
                    elapsedTime: `${elapsedTime} ms`,
                    memoryUsed: `${memoryDifference} MB`,
                    cpuUsage: `${cpuUsage.toFixed(2)}%`,
                },
            },
        });
    } catch (err) {
        console.error('Error during file decryption:', err);
        res.status(500).json({
            status: "error",
            message: 'Failed to decrypt file',
            error: err.message,
        });
    }
};