const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NjJmZmU0OC0zYjczLTRlNGQtODc2OC1lZDVjY2UxZTViMjciLCJlbWFpbCI6Im5pc3JpbmVnb3JmdGlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjliZjljODAwOWUzNGU1MGMyMTY2Iiwic2NvcGVkS2V5U2VjcmV0IjoiODdmZDJlOGVkMGY1NWU5NTZmNjkxNTBjMDA0NTQ3N2MzYzI0MzUyYWEzZTY1YWY0MDFhN2FkMDJjODI2ZDAyYSIsImV4cCI6MTgwNzMwMjkxM30.3nteYFRiki48rw1ch6hQ_R-n2zYiSR2adF7uGb2VD_Q";

const GATEWAY = "https://gateway.pinata.cloud/ipfs";

export async function uploadToPinata(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error("Pinata upload failed: " + JSON.stringify(err));
  }
  const data = await res.json();
  return data.IpfsHash;
}

export function getIPFSUrl(cid) {
  return `${GATEWAY}/${cid}`;
}