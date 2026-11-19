// Full local test of AgentVoice on an in-process Ganache chain.
// Usage: node scripts/test-local.mjs
// Covers: deploy mock + contract, mint IDs, create poll, vote, and every
// revert (non-holder create/vote, double vote, bad option, ended poll).
import ganache from "ganache";
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const voiceArtifact = JSON.parse(fs.readFileSync(path.join(root, "build", "AgentVoice.json"), "utf8"));
const mockArtifact = JSON.parse(fs.readFileSync(path.join(root, "build", "MockAgentID.json"), "utf8"));

let passed = 0;
let failed = 0;
function check(name, ok, extra = "") {
  if (ok) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${extra}`); }
}
async function expectRevert(name, fn) {
  try { await fn(); check(name, false, "(no revert)"); }
  catch (e) { check(name, true, `(${String(e?.info?.error?.message || e?.shortMessage || e?.message || e).slice(0, 80)})`); }
}

const server = ganache.server({
  wallet: { totalAccounts: 5 },
  chain: { hardfork: "shanghai" },
  logging: { quiet: true },
});
await server.listen(0);
const port = server.address().port;
const provider = new ethers.JsonRpcProvider(`http://127.0.0.1:${port}`);

// Use ganache unlocked accounts via JsonRpcSigner (no private keys needed).
const sDeployer = await provider.getSigner(0);
const sAlice = await provider.getSigner(1);
const sBob = await provider.getSigner(2);
const sCarol = await provider.getSigner(3);
const sDave = await provider.getSigner(4); // no Agent ID

console.log("Deploying MockAgentID...");
const mockFactory = new ethers.ContractFactory(mockArtifact.abi, mockArtifact.bytecode, sDeployer);
const mock = await mockFactory.deploy();
await mock.waitForDeployment();
console.log("MockAgentID at", await mock.getAddress());

console.log("Deploying AgentVoice...");
const voiceFactory = new ethers.ContractFactory(voiceArtifact.abi, voiceArtifact.bytecode, sDeployer);
const voice = await voiceFactory.deploy(await mock.getAddress());
await voice.waitForDeployment();
console.log("AgentVoice at", await voice.getAddress());

// Mint mock IDs to Alice, Bob, Carol (Dave gets none).
for (const s of [sAlice, sBob, sCarol]) {
  await (await mock.mint(await s.getAddress())).wait();
}
check("isAgent true for ID holders", await voice.isAgent(await sAlice.getAddress()));
check("isAgent false for non-holder", !(await voice.isAgent(await sDave.getAddress())));

// Non-holder cannot create a poll.
await expectRevert("non-holder createPoll reverts", () =>
  voice.connect(sDave).createPoll("Q?", ["A", "B"], 3600));

// Bad polls revert.
await expectRevert("empty question reverts", () =>
  voice.connect(sAlice).createPoll("", ["A", "B"], 3600));
await expectRevert("one option reverts", () =>
  voice.connect(sAlice).createPoll("Q?", ["A"], 3600));
await expectRevert("too-short duration reverts", () =>
  voice.connect(sAlice).createPoll("Q?", ["A", "B"], 60));

// Happy path: Alice creates a poll.
const tx = await voice.connect(sAlice).createPoll(
  "Which skill should Agent Voice add next?",
  ["Poll comments", "Delegated voting", "Weekly digest"],
  7 * 24 * 3600,
);
await tx.wait();
check("pollCount is 1", (await voice.pollCount()) === 1n);
const poll = await voice.getPoll(0);
check("poll question stored", poll.question === "Which skill should Agent Voice add next?");
check("poll has 3 options", poll.options.length === 3);
check("poll creator is Alice", poll.creator.toLowerCase() === (await sAlice.getAddress()).toLowerCase());

// Voting.
await (await voice.connect(sAlice).vote(0, 0)).wait();
await (await voice.connect(sBob).vote(0, 1)).wait();
await (await voice.connect(sCarol).vote(0, 1)).wait();
const after = await voice.getPoll(0);
check("votes counted [1,2,0]", after.votes[0] === 1n && after.votes[1] === 2n && after.votes[2] === 0n);
check("totalVotes is 3", (await voice.totalVotes(0)) === 3n);
check("hasVoted true for Alice", await voice.hasVoted(0, await sAlice.getAddress()));
check("voteOf Bob is 1", (await voice.voteOf(0, await sBob.getAddress())) === 1n);

// Reverts.
await expectRevert("double vote reverts", () => voice.connect(sAlice).vote(0, 2));
await expectRevert("non-holder vote reverts", () => voice.connect(sDave).vote(0, 0));
await expectRevert("bad option reverts", () => voice.connect(sBob).vote(0, 9));
await expectRevert("missing poll reverts", () => voice.connect(sBob).vote(99, 0));

// Ended poll: create a 1-hour poll, fast-forward 2 hours, vote must revert.
await (await voice.connect(sAlice).createPoll("Short?", ["Yes", "No"], 3600)).wait();
await provider.send("evm_increaseTime", [2 * 3600]);
await provider.send("evm_mine", []);
await expectRevert("vote after end reverts", () => voice.connect(sBob).vote(1, 0));

await server.close();
console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed > 0 ? 1 : 0);
