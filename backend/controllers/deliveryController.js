const crypto = require("crypto");
const { EncryptedFile } = require("../models");

exports.saveData = async (req, res, next) => {
  try {
    // 1. Check parameters for request
    const { fileName, rsaKey, iv } = req.body;

    // Validate input
    if (!fileName || !rsaKey || !iv) {
      return res.status(400).json({
        status: "error",
        message: "Field is empty. All fields are required.",
      });
    }

    // 2. Convert IV to Buffer
    const ivBuffer = Buffer.from(iv, "base64");
    if (ivBuffer.length !== 16) {
      return res.status(400).json({
        status: "error",
        message: "IV invalid. Must be 16 bytes when decoded.",
      });
    }

    // 3. Use SECRET_KEY from environment or fallback (optional, not used for keyRSA here)
    const SECRET_KEY = process.env.SECRET_KEY
      ? Buffer.from(process.env.SECRET_KEY, "hex")
      : Buffer.from("12345678901234567890123456789012");

    if (SECRET_KEY.length !== 32) {
      throw new Error("SECRET_KEY must be 32 bytes for AES-256.");
    }

    // 4. Save data to database (without modifying keyRSA)
    const newFile = await EncryptedFile.create({
      fileName,
      rsaKey: rsaKey, // Save keyRSA exactly as received
      iv, // Save IV in Base64 form
    });

    // 5. Return response to the client
    res.status(201).json({
      status: "success",
      message: "Data saved successfully.",
    });
  } catch (error) {
    console.error("Error:", error.message);
    next(error); // Send error to middleware for further handling
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    // 1. Fetch all data from the database
    const files = await EncryptedFile.findAll();

    // 2. Check if data is available
    if (!files || files.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No data found.",
        data: {}, // Return an empty array for consistency
      });
    }

    // 3. Map data to format the objects
    const data = files.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      rsaKey: file.rsaKey,
      iv: file.iv,
      createdAt: file.createdAt,
    }));

    // 4. Return the response to the client
    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully.",
      data: data, // Array of objects
    });
  } catch (error) {
    console.error("Error while fetching data:", error.message);
    next(error); // Send error to middleware for further handling
  }
};

exports.getById = async (req, res, next) => {
  try {
    // 1. Retrieve the ID from request parameters
    const { id } = req.params;

    // 2. Fetch the record from the database
    const file = await EncryptedFile.findByPk(id);

    // 3. Check if the record exists
    if (!file) {
      return res.status(404).json({
        status: "error",
        message: "Record not found.",
      });
    }

    // 4. Format the data
    const data = {
      id: file.id,
      fileName: file.fileName,
      rsaKey: file.rsaKey,
      iv: file.iv,
      createdAt: file.createdAt,
    };

    // 5. Return the response to the client
    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully.",
      data: data,
    });
  } catch (error) {
    console.error("Error while fetching data by ID:", error.message);
    next(error); // Send error to middleware for further handling
  }
};
