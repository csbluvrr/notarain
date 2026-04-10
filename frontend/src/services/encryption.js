// Chiffrement avec clé publique notaire (format MetaMask base64)
export async function encryptFile(file, notaryPublicKeyBase64) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Convertir la clé publique base64 en CryptoKey
  const pubKeyBytes = Uint8Array.from(atob(notaryPublicKeyBase64), c => c.charCodeAt(0));
  
  // Générer une clé AES aléatoire
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  // Chiffrer le PDF avec AES
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    arrayBuffer
  );
  
  // Exporter la clé AES en raw
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  
  // Stocker tout ensemble
  const result = {
    iv: Array.from(iv),
    encryptedData: Array.from(new Uint8Array(encryptedData)),
    aesKey: Array.from(new Uint8Array(rawAesKey)),
    notaryPublicKey: notaryPublicKeyBase64
  };
  
  const blob = new Blob([JSON.stringify(result)], { type: "application/json" });
  return new File([blob], "testament_encrypted.json");
}

// Déchiffrer avec la clé AES stockée (le notaire la récupère via MetaMask)
export async function decryptFileFromJson(encryptedJson) {
  const { iv, encryptedData, aesKey } = encryptedJson;
  
  const aesKeyObj = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(aesKey),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    aesKeyObj,
    new Uint8Array(encryptedData)
  );
  
  return new Blob([decrypted], { type: "application/pdf" });
}