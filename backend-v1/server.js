const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const encryptionRoutes = require('./routes/index');
const PORT = 3000;

const app = express();

app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Folder file terenkripsi

app.use('/api/encryption', encryptionRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});