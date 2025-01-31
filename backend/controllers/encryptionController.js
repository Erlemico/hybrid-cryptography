const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const osutils = require('os-utils');
const pidusage = require('pidusage');
const { encryptWithAES, encryptAESKeyWithRSA } = require('../utils/cryptoUtils');

const RSA_PUBLIC_KEY = fs.readFileSync('public.pem', 'utf8');

exports.uploadAndEncryptFile = async (req, res) => {
    try {
        const startTime = process.hrtime(); // Mulai pencatatan waktu
        const initialMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // RAM awal dalam MB

        // 1. Check if there is an uploaded file
        if (!req.files || !req.files.file) {
            console.error('No file uploaded:', req.files);
            return res.status(400).json({
                status: "error",
                message: 'No file uploaded'
            });
        }

        const file = req.files.file;

        console.log(`File uploaded: ${file.name} (${file.mimetype}, ${file.size} bytes)`);

        // 2. Specify the path where to save the file
        const uploadsDir = path.join(__dirname, '../encrypted');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir); // Create a folder if it doesn't exist
        }
        const filePath = path.join(uploadsDir, file.name);

        // 3. Save file to temporary folder
        await file.mv(filePath);
        console.log(`File saved to: ${filePath}`);

        // 4. Read files and encrypt with AES
        const aesKey = crypto.randomBytes(32); // Generate 256-bit AES key
        const fileBuffer = fs.readFileSync(filePath); // Read file

        let encryptedData, iv;
        ({ encryptedData, iv } = encryptWithAES(fileBuffer, aesKey));
        console.log('File encrypted with AES');

        // 5. Save encrypted file
        const encryptedFileName = `${file.name}.enc`;
        const encryptedFilePath = path.join(uploadsDir, encryptedFileName);
        fs.writeFileSync(encryptedFilePath, encryptedData);
        console.log(`Encrypted file saved to: ${encryptedFilePath}`);

        // 6. Encrypt AES key with RSA
        const rsaKey = encryptAESKeyWithRSA(aesKey, RSA_PUBLIC_KEY);
        console.log('AES key encrypted with RSA');

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

        console.log(`Encryption Time: ${elapsedTime} ms`);
        console.log(`Memory Usage: ${memoryDifference} MB`);
        console.log(`CPU Usage: ${cpuUsage.toFixed(2)}%`);

        // 7. Return response to the client
        res.status(201).json({
            status: "success",
            message: 'File encrypted successfully',
            data: {
                fileName: encryptedFileName, // Tambahkan path relatif di sini
                rsaKey: rsaKey.toString('base64'), // Encrypted AES key
                iv: iv.toString('base64'), // Initialization vector
                performance: {
                    elapsedTime: `${elapsedTime} ms`,
                    memoryUsed: `${memoryDifference} MB`,
                    cpuUsage: `${cpuUsage.toFixed(2)}%`,
                },
            }
        });
    } catch (err) {
        console.error('Error during file upload or encryption:', err); // Log error
        res.status(500).json({
            status: "error",
            message: 'Failed to process file',
            error: err.message
        });
    }
};