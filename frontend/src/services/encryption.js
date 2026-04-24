import nacl from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";

// Chiffre un fichier avec la clé publique MetaMask (x25519-xsalsa20-poly1305)
export async function encryptFileForAddress(file, publicKeyBase64) {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const dataHex = Array.from(uint8)
    .map(b => b.toString(16).padStart(2, "0")).join("");

  const recipientPublicKey = decodeBase64(publicKeyBase64);
  const ephemeralKeyPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = new TextEncoder().encode(dataHex);

  const encryptedMessage = nacl.box(
    messageUint8,
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

// Déchiffre via MetaMask eth_decrypt (clé privée reste dans MetaMask)
export async function decryptWithMetaMask(encryptedObj, walletAddress) {
  const encryptedStr = JSON.stringify(encryptedObj);
  const encryptedHex = "0x" + Array.from(new TextEncoder().encode(encryptedStr))
    .map(b => b.toString(16).padStart(2, "0")).join("");

  const decryptedHex = await window.ethereum.request({
    method: "eth_decrypt",
    params: [encryptedHex, walletAddress],
  });

  const bytes = new Uint8Array(
    decryptedHex.match(/.{1,2}/g).map(b => parseInt(b, 16))
  );
  return new Blob([bytes], { type: "application/pdf" });
}