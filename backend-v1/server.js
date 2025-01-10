const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const encryptionRoutes = require('./routes/index');
const PORT = 3000;

require('dotenv').config();

const app = express();

app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', encryptionRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});