// // server/pinata.js
// import pinataSDK from '@pinata/sdk';
// import fs from 'fs';

// const pinata = pinataSDK(
//   process.env.PINATA_API_KEY,
//   process.env.PINATA_SECRET_API_KEY
// );

// // Export a function to pin a file to IPFS via Pinata
//  async function uploadToPinata(filePath, fileName) {
//   try {
//     // Convert the local file path to a readable stream
//     const readableStreamForFile = fs.createReadStream(filePath);

//     // Optional metadata (the 'name' will appear in your Pinata dashboard)
//     const options = {
//       pinataMetadata: {
//         name: fileName || 'UnnamedFile',
//       },
//       pinataOptions: {
//         cidVersion: 0
//       }
//     };

//     // Pin the file to Pinata (which pins it on IPFS)
//     const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
//     // The result has an `IpfsHash` property containing the CID.
//     return result.IpfsHash;

//   } catch (error) {
//     console.error('Error uploading to Pinata:', error);
//     throw error;
//   }
// }
// module.exports = { uploadToPinata };



//-----------------------------
// pinata.js (CommonJS)
// const pinataSDK = require('@pinata/sdk');
// const fs = require('fs');

// const pinata = pinataSDK(
//   process.env.PINATA_API_KEY,
//   process.env.PINATA_SECRET_API_KEY
// );

// async function uploadToPinata(filePath, fileName) {
//   try {
//     const readableStreamForFile = fs.createReadStream(filePath);
//     const options = {
//       pinataMetadata: { name: fileName || "UnnamedFile" },
//       pinataOptions: { cidVersion: 0 }
//     };

//     const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
//     return result.IpfsHash;
//   } catch (error) {
//     console.error('Error uploading to Pinata:', error);
//     throw error;
//   }
// }

// module.exports = { uploadToPinata };

//----------------------


// server/pinata.js (CommonJS)
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');

const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

async function uploadToPinata(filePath, fileName) {
  try {
    const readableStreamForFile = fs.createReadStream(filePath);
    const options = {
      pinataMetadata: {
        name: fileName || 'UnnamedFile'
      },
      pinataOptions: { cidVersion: 0 }
    };
    const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
    return result.IpfsHash; // the IPFS CID
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw error;
  }
}

module.exports = { uploadToPinata };
