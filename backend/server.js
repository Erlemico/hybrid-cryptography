const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const encryptionRoutes = require('./routes/index');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

require('dotenv').config();


app.use(cors());
app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to serve static files from 'encrypted' folder
app.use('/encrypted', express.static(path.join(__dirname, './encrypted')));

// Middleware to serve static files from 'decrypted' folder
app.use('/decrypted', express.static(path.join(__dirname, './decrypted')));

// Main route for API
app.use('/api', encryptionRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});