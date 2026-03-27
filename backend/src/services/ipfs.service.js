const { Readable } = require("stream");
const PinataClient = require("@pinata/sdk");

const pinata = new PinataClient(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

function bufferToReadableStream(buffer) {
  return Readable.from(buffer);
}

async function uploadEncryptedFile(buffer, filename) {
  if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET_API_KEY) {
    throw new Error("Pinata API credentials are not configured");
  }

  const readable = bufferToReadableStream(buffer);
  // Required by Pinata/form-data internals to infer a filename.
  readable.path = filename || "testament.enc";

  const options = {
    pinataMetadata: {
      name: filename
    }
  };

  try {
    const result = await pinata.pinFileToIPFS(readable, options);
    return result.IpfsHash;
  } catch (err) {
    const apiError =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "IPFS upload failed";
    throw new Error(`IPFS upload failed: ${apiError}`);
  }
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

