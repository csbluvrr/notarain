import nacl from "tweetnacl";
import util from "tweetnacl-util";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";

// Chiffre un fichier avec la clé publique MetaMask (x25519-xsalsa20-poly1305)
export async function encryptFileForAddress(file, publicKeyBase64) {
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  const recipientPublicKey = decodeBase64(publicKeyBase64);
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encryptedMessage = nacl.box(
    fileBytes,
    nonce,
    recipientPublicKey,
    ephemeralKeyPair.secretKey
  );

  const result = {
    version: "x25519-xsalsa20-poly1305",
    nonce: encodeBase64(nonce),
    ephemPublicKey: encodeBase64(ephemeralKeyPair.publicKey),
    ciphertext: encodeBase64(encryptedMessage),
  };

  const blob = new Blob([JSON.stringify(result)], { type: "application/json" });
  return new File([blob], "testament_encrypted.json");
}

// Decrypt using stored secret key from localStorage
export async function decryptWithStoredKey(
  encryptedDataBase64,
  nonceBase64,
  senderPublicKeyBase64
) {
  // 1. Get the secret key from localStorage
  const storedKeys = localStorage.getItem("notaryKeys");
  if (!storedKeys) {
    throw new Error(
      "No encryption keys found. Please import your notary key first."
    );
  }

  const { secretKey: secretKeyBase64 } = JSON.parse(storedKeys);

  // 2. Convert from base64 to Uint8Array
  const secretKey = util.decodeBase64(secretKeyBase64);
  const senderPublicKey = util.decodeBase64(senderPublicKeyBase64);
  const nonce = util.decodeBase64(nonceBase64);
  const encryptedData = util.decodeBase64(encryptedDataBase64);

  // 3. Decrypt using nacl.box.open
  const decrypted = nacl.box.open(
    encryptedData,
    nonce,
    senderPublicKey,
    secretKey
  );

  if (!decrypted) {
    throw new Error("Decryption failed. Invalid key or corrupted data.");
  }

  // 4. Convert to Blob (for PDF)
  return new Blob([decrypted], { type: "application/pdf" });
}
