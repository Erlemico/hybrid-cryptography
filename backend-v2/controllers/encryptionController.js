const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { encryptWithAES, encryptAESKeyWithRSA } = require('../utils/cryptoUtils');

const RSA_PUBLIC_KEY = fs.readFileSync('public.pem', 'utf8');

exports.uploadAndEncryptFile = async (req, res) => {
    try {
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
        try {
            await file.mv(filePath); // Wait for the file to move
            console.log(`File saved to: ${filePath}`);
        } catch (err) {
            console.error('Failed to save file:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to save file',
                error: err.message
            });
        }

        // 4. Read files and encrypt with AES
        const aesKey = crypto.randomBytes(32); // Generate 256-bit AES key
        const fileBuffer = fs.readFileSync(filePath); // Read file

        let encryptedData, iv;
        try {
            ({ encryptedData, iv } = encryptWithAES(fileBuffer, aesKey));
            console.log('File encrypted with AES');
        } catch (err) {
            console.error('Failed to encrypt file with AES:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to encrypt file',
                error: err.message
            });
        }

        // 5. Save encrypted file
        const encryptedFileName = `${file.name}.enc`;
        const encryptedFilePath = path.join(uploadsDir, encryptedFileName);
        try {
            fs.writeFileSync(encryptedFilePath, encryptedData);
            console.log(`Encrypted file saved to: ${encryptedFilePath}`);
        } catch (err) {
            console.error('Failed to save encrypted file:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to save encrypted file',
                error: err.message
            });
        }

        // 6. Encrypt AES key with RSA
        let rsaKey;
        try {
            rsaKey = encryptAESKeyWithRSA(aesKey, RSA_PUBLIC_KEY);
            console.log('AES key encrypted with RSA');
        } catch (err) {
            console.error('Failed to encrypt AES key with RSA:', err);
            return res.status(500).json({
                status: "error",
                message: 'Failed to encrypt AES key',
                error: err.message
            });
        }

        // 7. Return response to the client
        res.status(201).json({
            status: "success",
            message: 'File encrypted successfully',
            data: {
                fileName: `/encrypted/${encryptedFileName}`, // Tambahkan path relatif di sini
                rsaKey: rsaKey.toString('base64'), // Encrypted AES key
                iv: iv.toString('base64'), // Initialization vector
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


// API untuk mendapatkan daftar semua file terenkripsi
exports.getAllEncryptedFiles = (req, res) => {
    const encryptedDir = path.join(__dirname, '../encrypted'); // Path folder encrypted

    // Cek apakah direktori encrypted ada
    if (!fs.existsSync(encryptedDir)) {
        return res.status(404).json({
            status: "error",
            message: "Encrypted directory not found",
        });
    }

    try {
        // Baca isi direktori
        const files = fs.readdirSync(encryptedDir).filter(file => file.endsWith('.enc')); // Hanya file .enc

        // Kirim daftar file sebagai respons
        res.status(200).json({
            status: "success",
            message: "List of encrypted files",
            data: files.map((file, index) => ({
                id: index + 1, // ID increment dimulai dari 1
                fileName: file,
            })),
        });
    } catch (err) {
        console.error('Error reading encrypted directory:', err);
        res.status(500).json({
            status: "error",
            message: "Failed to retrieve encrypted files",
            error: err.message,
        });
    }
};