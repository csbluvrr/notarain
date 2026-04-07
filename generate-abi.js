const fs = require('fs');
const artifact = JSON.parse(fs.readFileSync('./blockchain/artifacts/contracts/TestamentRegistry.sol/TestamentRegistry.json'));
const output = { address: '0x5FbDB2315678afecb367f032d93F642f64180aa3', abi: artifact.abi };
fs.writeFileSync('./frontend/src/contracts/TestamentRegistry.json', JSON.stringify(output, null, 2));
console.log('ABI generated successfully!');