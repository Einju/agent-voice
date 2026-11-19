# Agent Voice

Voting dApp for the Binance Wallet × BNB Chain **Agent ID Hackathon**
(60,000 USDC; submissions close 9 Dec 2026, 15:00 WIB).

Only Agent ID holders (SPACE ID `.ai`, ERC-721, non-transferable, one per
user) can create polls and vote — one Agent ID, one vote. The contract never
handles funds: no payable functions, no owner, no withdrawals.

## Live

- Web dApp: https://einju.github.io/agent-voice/
- Contract (BSC mainnet): `0xFFfb38948e9b5a05c8d0ed8c175Fc27DB5315F7C`
  ([BscScan](https://bscscan.com/address/0xFFfb38948e9b5a05c8d0ed8c175Fc27DB5315F7C))

## Layout

- `contracts/AgentVoice.sol` — the voting contract. The Agent ID contract
  address is a constructor parameter (real one on mainnet, mock on testnet).
- `contracts/MockAgentID.sol` — minimal mock for testnet/local testing only.
- `scripts/compile.mjs` — compile with solcjs into `build/`.
- `scripts/gen-wallet.mjs` — create the deployer wallet (mode 600).
- `scripts/test-local.mjs` — full test on an in-process Ganache chain.
- `scripts/deploy.mjs testnet|mainnet` — deploy (testnet also deploys the mock).
- `frontend/` — static dApp (GitHub Pages).
- `deployments/` — deployment records per network.

## Mainnet addresses

- Agent ID (SPACE ID): `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`

## Run

```sh
npm install
node scripts/gen-wallet.mjs   # fund the printed address with a little BNB
node scripts/compile.mjs
node scripts/test-local.mjs
node scripts/deploy.mjs testnet
node scripts/deploy.mjs mainnet
```
