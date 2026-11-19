// Compile contracts with solcjs. Usage: node scripts/compile.mjs
// Writes build/<Contract>.json with { abi, bytecode }.
import solc from "solc";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = path.join(root, "contracts");
const buildDir = path.join(root, "build");

const sources = {};
for (const file of fs.readdirSync(contractsDir)) {
  if (!file.endsWith(".sol")) continue;
  sources[file] = { content: fs.readFileSync(path.join(contractsDir, file), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    // Paris (pre-Shanghai) avoids the PUSH0 opcode, so the bytecode runs on
    // any EVM chain including older local test chains.
    evmVersion: "paris",
    // runs=1 minimises deployment bytecode size (deploy gas is dominated by
    // the 200 gas/byte code-deposit cost). Runtime gas is slightly higher,
    // but votes are cheap either way and deployment is the one-off big cost.
    optimizer: { enabled: true, runs: 1 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

const errors = (output.errors || []).filter((e) => e.severity === "error");
for (const e of output.errors || []) {
  console.log(`[${e.severity}] ${e.formattedMessage}`);
}
if (errors.length > 0) {
  console.error(`\nCompilation failed with ${errors.length} error(s).`);
  process.exit(1);
}

fs.mkdirSync(buildDir, { recursive: true });
for (const [file, contracts] of Object.entries(output.contracts)) {
  for (const [name, c] of Object.entries(contracts)) {
    const artifact = { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
    fs.writeFileSync(path.join(buildDir, `${name}.json`), JSON.stringify(artifact, null, 2));
    console.log(`Built ${name} from ${file} (${artifact.bytecode.length / 2 - 1} bytes)`);
  }
}
console.log("Done.");
