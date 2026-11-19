# Agent Voice — Working Rules

Standing rules from Zemvah (2026-11-19). These override convenience: follow
them even when a shortcut is available.

## 1. STOP before mainnet deploy

After all code is complete and pushed to GitHub, STOP and notify Zemvah
before deploying to BNB Mainnet. He wants to review the code first.
No mainnet deploy without his explicit go-ahead after that review.

## 2. Contract must be 100% non-custodial

- No owner/admin privileges of any kind (no owner variable, no onlyOwner,
  no pause, no upgrade, no withdraw).
- No payable functions. The contract never holds or moves user funds.
- Access gating is exactly: `agentId.balanceOf(msg.sender) > 0`, where
  `agentId` is the official Agent ID contract on BNB Smart Chain mainnet:
  `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`.
- The deploy script passes that address for mainnet; the mock is testnet
  only and must never be used on mainnet.

## 3. No secrets in the public repo

- Never push private keys, mnemonics, or `.env` files to the public repo.
- `deployer-wallet.json` is gitignored and stored mode 600. It must never
  appear in any push, upload, screenshot, or message.
- Pushes use an explicit file list only: `contracts/`, `frontend/`,
  `skills/`, `scripts/`, `README.md`, `.gitignore`, `RULES.md`.
  Never push `node_modules/`, `build/`, `deployments/`, or any wallet file.
