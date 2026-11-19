// Agent Voice configuration — BNB Smart Chain mainnet.
window.AGENT_VOICE_CONFIG = {
  network: "mainnet",
  contractAddress: "0xFFfb38948e9b5a05c8d0ed8c175Fc27DB5315F7C",
  agentIdContract: "0x60b9262456de011f7d15a54cdd8c48baaa8b022f",
  chainId: 56,
  chainName: "BNB Smart Chain",
  rpcUrl: "https://bsc-dataseed.binance.org",
  // Fallback RPCs, tried in order when the primary stalls or fails. All are
  // public BSC mainnet endpoints with CORS enabled (verified 2026-11-19).
  rpcUrls: [
    "https://bsc-dataseed.binance.org",
    "https://bsc-dataseed1.binance.org",
    "https://bsc.publicnode.com",
  ],
  explorer: "https://bscscan.com",
};
