// Generate a fresh deployer wallet for Agent Voice.
// Usage: node scripts/gen-wallet.mjs
// Writes deployer-wallet.json (mode 600). Prints ONLY the address.
// NEVER commit this file, NEVER paste the key or mnemonic anywhere.
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "deployer-wallet.json");
if (fs.existsSync(outPath)) {
  const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
  console.log("Wallet already exists:", existing.address);
  process.exit(0);
}

const wallet = ethers.Wallet.createRandom();
const data = {
  address: wallet.address,
  privateKey: wallet.privateKey,
  mnemonic: wallet.mnemonic.phrase,
  created: new Date().toISOString(),
  note: "Agent Voice deployer (BSC). Fund with a small amount of BNB for deployment gas only.",
};
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), { mode: 0o600 });
console.log("New deployer wallet:", wallet.address);
console.log("Saved to deployer-wallet.json (mode 600).");
