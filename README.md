# Hybrid Cryptography File Sharing System

A secure file sharing system that uses hybrid cryptography, combining AES and RSA algorithms, to encrypt and decrypt files for secure communication between two parties.

# Features
## Hybrid Cryptography:
- **AES for encrypting files (efficient for large data).**
- **RSA for encrypting AES keys (ensures secure key exchange).**

## File Upload and Encryption:
- **Upload a file to encrypt it using AES.**
- **Encrypt the AES key using RSA.**

## File Decryption:
- **Decrypt the RSA-encrypted AES key using the private key.**
- **Decrypt the file using the decrypted AES key.**

## Performance Metrics:
- **Measure encryption and decryption time.**
- **Monitor resource usage (CPU and RAM).**

# Installation

## Prerequisites
- **Node.js installed on your system.**

## Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/repository-name.git
   cd repository-name
   ```

2. **Install library:**
   ```bash
   npm install express body-parser express-fileupload path fs
   ```

3. **Generate RSA Key Pair:** Run the following script to generate RSA key pairs (public.pem and private.pem):
   ```bash
   openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
   openssl rsa -pubout -in private.pem -out public.pem
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

# API Endpoints
  **1. Upload and Encrypt File**
  POST /api/encryption/upload
  - **Description:** Upload a file, encrypt it using AES, and encrypt the AES key using RSA.
  - **Request:**
      - **Form-data**
          - **file:** upload file
  - **Response**
    ```bash
    {
      "message": "File encrypted successfully",
      "encryptedFilePath": "/uploads/filename.enc",
      "encryptedAESKey": "Base64EncodedAESKey",
      "iv": "Base64EncodedIV"
    }
    ```

  **2. Decrypt File**
  POST /api/encryption/decrypt
  - **Description:** Decrypt an encrypted file using AES and RSA.
  - **Request:**
      - **JSON Body**
          ```bash
          {
            "encryptedFilePath": "/uploads/filename.enc",
            "encryptedAESKey": "Base64EncodedAESKey",
            "iv": "Base64EncodedIV"
          }
          ```
  - **Response:**
    ```bash
    {
      "message": "File decrypted successfully",
      "decryptedFilePath": "/uploads/filename.decrypted"
    }

# How It Works

1. **Upload File:**
- The file is uploaded and encrypted using AES.
- An AES key is generated and encrypted using RSA.

2. **Encryption:**
- AES-encrypted file is saved as filename.enc.
- AES key is encrypted using RSA and stored as a Base64 string.

3. **Decryption:**
- The AES key is decrypted using the private RSA key.
- The file is decrypted using the decrypted AES key and the provided IV.

# Contributors

- **Moammar Saddam - Backend Development**
- **Putri Cellyenda - Frontend Development**
- **Aira Putri Deninta - Documentation**
