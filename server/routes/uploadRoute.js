// // server/routes/uploadRoute.js
// import express from 'express';
// import multer from 'multer';
// import { uploadToPinata } from '../pinata.js';
// import path from 'path';
// import fs from 'fs';

// const router = express.Router();

// // configure multer for file uploads
// const upload = multer({ dest: 'uploads/' }); 
// // 'uploads/' is a local folder in your server folder for storing files temporarily.

// router.post('/', upload.single('file'), async (req, res) => {
//   try {
//     // `req.file` is the file that was uploaded by the front end.
//     const localFilePath = req.file.path;
//     const originalName = req.file.originalname;

//     // Step 1: Upload file to Pinata
//     const ipfsHash = await uploadToPinata(localFilePath, originalName);

//     // Step 2: remove the file from local 'uploads' if you want
//     fs.unlink(localFilePath, (err) => {
//       if (err) console.error('Error deleting temp file:', err);
//     });

//     // Step 3: Return the IPFS hash to the client
//     res.json({ success: true, ipfsHash });
//   } catch (error) {
//     console.error('Error in upload route:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// export default router;

//------------------------------------

// server/routes/uploadRoute.js (CommonJS)
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const { uploadToPinata } = require('../pinata.js'); 

// const router = express.Router();

// // Configure multer for file uploads
// const upload = multer({ dest: 'uploads/' }); 
// // 'uploads/' is a local folder in your server folder for storing files temporarily.

// // Handle POST /upload
// router.post('/', upload.single('file'), async (req, res) => {
//   try {
//     // `req.file` is the file that was uploaded by the front end.
//     const localFilePath = req.file.path;
//     const originalName = req.file.originalname;

//     // 1) Upload file to Pinata
//     const ipfsHash = await uploadToPinata(localFilePath, originalName);

//     // 2) Remove the file from local 'uploads', if desired
//     fs.unlink(localFilePath, (err) => {
//       if (err) console.error('Error deleting temp file:', err);
//     });

//     // 3) Return the IPFS hash to the client
//     res.json({ success: true, ipfsHash });
//   } catch (error) {
//     console.error('Error in upload route:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// module.exports = router;


//------------------------

// server/routes/uploadRoute.js (CommonJS)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { uploadToPinata } = require('../pinata.js');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const localFilePath = req.file.path;
    const originalName = req.file.originalname;

    const ipfsHash = await uploadToPinata(localFilePath, originalName);

    fs.unlink(localFilePath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    return res.json({ success: true, ipfsHash });
  } catch (error) {
    console.error('Error in upload route:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;





