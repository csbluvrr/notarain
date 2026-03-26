const { Readable } = require("stream");
const PinataClient = require("@pinata/sdk");

const pinata = new PinataClient(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

function bufferToReadableStream(buffer) {
  // Pinata expects a stream-like input.
  return Readable.from(buffer);
}

async function uploadEncryptedFile(buffer, filename) {
  const readable = bufferToReadableStream(buffer);

  const options = {
    pinataMetadata: {
      name: filename
    }
  };

  const result = await pinata.pinFileToIPFS(readable, options);
  return result.IpfsHash;
}

async function getFile(cid) {
  const gateway = process.env.PINATA_GATEWAY;
  if (!gateway) {
    throw new Error("PINATA_GATEWAY is not set");
  }

  const res = await fetch(`${gateway}/${cid}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = { uploadEncryptedFile, getFile };

