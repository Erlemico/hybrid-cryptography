const crypto = require("crypto");
const { EncryptedFile } = require("../models");

exports.saveData = async (req, res, next) => {
  try {
    // 1. Check parameters for request
    const { encryptedFilePath, encryptedAESKey, iv } = req.body;

    // Validate input
    if (!encryptedFilePath || !encryptedAESKey || !iv) {
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

    // 3. Use SECRET_KEY from environment or fallback
    const SECRET_KEY = process.env.SECRET_KEY
      ? Buffer.from(process.env.SECRET_KEY, "hex")
      : Buffer.from("12345678901234567890123456789012");

    if (SECRET_KEY.length !== 32) {
      throw new Error("SECRET_KEY must be 32 bytes for AES-256.");
    }

    // 4. Encryption process
    const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, ivBuffer);
    const encryptedKey =
      cipher.update(encryptedAESKey, "utf8", "hex") + cipher.final("hex");

    // 5. Save data to database
    const newFile = await EncryptedFile.create({
      filePath: encryptedFilePath,
      encryptedKey,
      iv, // Save IV in Base64 form
    });

    // 6. Return response to the client
    res.status(201).json({
      status: "success",
      message: "Data saved successfully.",
    });
  } catch (error) {
    console.error("Error:", error.message);
    next(error); // Send error to middleware for further handling
  }
};

exports.getData = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch data by id
    const file = await EncryptedFile.findByPk(id);

    // If data is not found
    if (!file) {
      return res.status(404).json({
        status: "error",
        message: "Data not found",
      });
    }

    // Validate important data
    if (!file.encryptedKey || !file.iv) {
      return res.status(400).json({
        status: "error",
        message: "Data invalid for decryption",
      });
    }

    // 2. Retrieve SECRET_KEY from environment or fallback
    const SECRET_KEY = process.env.SECRET_KEY
      ? Buffer.from(process.env.SECRET_KEY, "hex")
      : Buffer.from("12345678901234567890123456789012"); // Fallback for development

    // Validate SECRET_KEY length
    if (SECRET_KEY.length !== 32) {
      throw new Error("SECRET_KEY must be 32 bytes for AES-256.");
    }

    // 3. Convert IV from Base64 to Buffer
    const ivBuffer = Buffer.from(file.iv, "base64");

    // 4. Decryption process
    const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, ivBuffer);
    const decryptedKey =
      decipher.update(file.encryptedKey, "hex", "utf8") + decipher.final("utf8");

    // 5. Return response to the client
    return res.status(200).json({
      status: "success",
      message: "Data successfully retrieved",
      data: {
        encryptedFilePath: file.filePath,
        decryptedAESKey: decryptedKey,
        iv: file.iv,
      },
    });
  } catch (error) {
    console.error("Error occurred while retrieving data:", error.message);
    next(error); // Send error to middleware for further handling
  }
};