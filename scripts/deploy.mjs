// Deploy AgentVoice. Usage: node scripts/deploy.mjs testnet|mainnet
// testnet: deploys MockAgentID, mints a mock ID to the deployer, then
//          deploys AgentVoice pointing at the mock.
// mainnet: deploys AgentVoice pointing at the real Agent ID contract.
// Writes deployments/<network>.json. Aborts if the deployer has 0 balance.
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AGENT_ID_MAINNET = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";

const NETWORKS = {
  testnet: { rpc: "https://data-seed-prebsc-1-s1.bnbchain.org:8545", chainId: 97, name: "BSC Testnet" },
  mainnet: { rpc: "https://bsc-dataseed.binance.org", chainId: 56, name: "BNB Smart Chain" },
};

const network = process.argv[2];
if (!NETWORKS[network]) {
  console.error("Usage: node scripts/deploy.mjs testnet|mainnet");
  process.exit(1);
}
const net = NETWORKS[network];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const walletData = JSON.parse(fs.readFileSync(path.join(root, "deployer-wallet.json"), "utf8"));
const voiceArtifact = JSON.parse(fs.readFileSync(path.join(root, "build", "AgentVoice.json"), "utf8"));

const provider = new ethers.JsonRpcProvider(net.rpc);
const wallet = new ethers.Wallet(walletData.privateKey, provider);

const chain = await provider.getNetwork();
if (Number(chain.chainId) !== net.chainId) {
  console.error(`Wrong chain: connected to ${chain.chainId}, expected ${net.chainId}`);
  process.exit(1);
}

const balance = await provider.getBalance(wallet.address);
console.log(`Network: ${net.name} (chain ${net.chainId})`);
console.log(`Deployer: ${wallet.address}`);
console.log(`Balance: ${ethers.formatEther(balance)} BNB`);
if (balance === 0n) {
  console.error("Deployer has 0 balance — fund it first, then re-run.");
  process.exit(1);
}

const deployment = { network, chainId: net.chainId, deployer: wallet.address, deployedAt: new Date().toISOString() };

let agentIdAddress = AGENT_ID_MAINNET;
if (network === "testnet") {
  const mockArtifact = JSON.parse(fs.readFileSync(path.join(root, "build", "MockAgentID.json"), "utf8"));
  const mockFactory = new ethers.ContractFactory(mockArtifact.abi, mockArtifact.bytecode, wallet);
  const mock = await mockFactory.deploy();
  await mock.waitForDeployment();
  agentIdAddress = await mock.getAddress();
  console.log(`MockAgentID deployed: ${agentIdAddress}`);
  const mintTx = await mock.mint(wallet.address);
  await mintTx.wait();
  console.log(`Mock Agent ID minted to deployer (tx ${mintTx.hash})`);
  deployment.mockAgentId = agentIdAddress;
}

console.log(`Agent ID contract: ${agentIdAddress}`);
const factory = new ethers.ContractFactory(voiceArtifact.abi, voiceArtifact.bytecode, wallet);
const voice = await factory.deploy(agentIdAddress);
await voice.waitForDeployment();
const voiceAddress = await voice.getAddress();
console.log(`AgentVoice deployed: ${voiceAddress} (tx ${voice.deploymentTransaction().hash})`);
deployment.agentVoice = voiceAddress;
deployment.agentIdContract = agentIdAddress;

const outDir = path.join(root, "deployments");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${network}.json`), JSON.stringify(deployment, null, 2));
console.log(`Saved deployments/${network}.json`);
