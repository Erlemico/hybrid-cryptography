const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { encryptWithAES, encryptAESKeyWithRSA } = require('../utils/cryptoUtils');

const RSA_PUBLIC_KEY = fs.readFileSync('public.pem', 'utf8');

exports.uploadAndEncryptFile = async (req, res) => {
    try {
        // 1. Periksa apakah ada file yang diunggah
        if (!req.files || !req.files.file) {
            console.error('No file uploaded:', req.files);
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const file = req.files.file;

        // Validasi tipe file (opsional)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        console.log(`File uploaded: ${file.name} (${file.mimetype}, ${file.size} bytes)`);

        // 2. Tentukan path tempat menyimpan file
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir); // Buat folder jika belum ada
        }
        const filePath = path.join(uploadsDir, file.name);

        // 3. Simpan file ke folder sementara
        try {
            await file.mv(filePath); // Tunggu file dipindahkan
            console.log(`File saved to: ${filePath}`);
        } catch (err) {
            console.error('Failed to save file:', err);
            return res.status(500).json({ message: 'Failed to save file', error: err.message });
        }

        // 4. Baca file dan enkripsi dengan AES
        const aesKey = crypto.randomBytes(32); // Buat kunci AES 256-bit
        const fileBuffer = fs.readFileSync(filePath); // Baca file

        let encryptedData, iv;
        try {
            ({ encryptedData, iv } = encryptWithAES(fileBuffer, aesKey));
            console.log('File encrypted with AES');
        } catch (err) {
            console.error('Failed to encrypt file with AES:', err);
            return res.status(500).json({ message: 'Failed to encrypt file', error: err.message });
        }

        // 5. Simpan file terenkripsi
        const encryptedFilePath = `${filePath}.enc`;
        try {
            fs.writeFileSync(encryptedFilePath, encryptedData); // Simpan file terenkripsi
            console.log(`Encrypted file saved to: ${encryptedFilePath}`);
        } catch (err) {
            console.error('Failed to save encrypted file:', err);
            return res.status(500).json({ message: 'Failed to save encrypted file', error: err.message });
        }

        // 6. Enkripsi kunci AES dengan RSA
        let encryptedAESKey;
        try {
            encryptedAESKey = encryptAESKeyWithRSA(aesKey, RSA_PUBLIC_KEY);
            console.log('AES key encrypted with RSA');
        } catch (err) {
            console.error('Failed to encrypt AES key with RSA:', err);
            return res.status(500).json({ message: 'Failed to encrypt AES key', error: err.message });
        }

        // 7. Kembalikan respons ke client
        res.json({
            message: 'File encrypted successfully',
            encryptedFilePath: `/uploads/${file.name}.enc`,
            encryptedAESKey: encryptedAESKey.toString('base64'), // Kunci AES terenkripsi
            iv: iv.toString('base64'), // Initialization Vector
        });
    } catch (err) {
        console.error('Error during file upload or encryption:', err); // Log error
        res.status(500).json({ message: 'Failed to process file', error: err.message });
    }
};

exports.downloadFile = (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath);
};