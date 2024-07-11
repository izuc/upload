# upload.computer

Secure file sharing with browser-based encryption and post-quantum protection

## Description

upload.computer is a web application that allows users to securely upload and share files. It uses a combination of AES-256 encryption and a post-quantum inspired method to protect files, with all encryption and decryption happening client-side in the browser for enhanced privacy and security.

## Features

- Client-side encryption and decryption
- AES-256 encryption with a 512-bit derived key
- Post-quantum inspired protection
- Secure file sharing via unique links
- Temporary file storage (files are automatically deleted after 6 hours)
- Simple and intuitive user interface

## How It Works

### Encryption Process

1. The user selects a file and enters a password.
2. A 512-bit key is derived from the password using PBKDF2 with 10,000 iterations.
3. The file is encrypted using AES-256 in CBC mode with the derived key.
4. A post-quantum inspired key encapsulation mechanism (KEM) is used to encrypt the AES key.
5. The encrypted file, encapsulated key, and other necessary data are combined and integrity-protected with HMAC.
6. The encrypted data is sent to the server for temporary storage.

### Decryption Process

1. The user enters the file ID and the decryption password.
2. The encrypted data is retrieved from the server.
3. The integrity of the data is verified using HMAC.
4. The post-quantum KEM is used to recover the AES key.
5. The file is decrypted using AES-256 in CBC mode.
6. The decrypted file is made available to the user in the browser.

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/izuc/upload.git
   cd upload
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your API URL:
   ```
   REACT_APP_API_URL=https://your-api-url.com
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Build for production:
   ```
   npm run build
   ```

## Technologies Used

- React
- React Router
- Tailwind CSS
- CryptoJS
- Lucide React (for icons)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

While this application uses strong encryption methods, it is a custom implementation and has not been audited by security professionals. Use at your own risk for sensitive data.

## Contact

Created by [Lance](https://lance.name) - feel free to contact me!
