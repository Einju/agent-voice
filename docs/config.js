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
  // Public endpoints are flaky — any one of them can time out or rate-limit
  // at any moment (observed 2026-11-19 ~21:30 WIB: all three original
  // endpoints failed at once) — so the list is long: the FallbackProvider
  // races them and the first good answer wins.
  rpcUrls: [
    "https://bsc-dataseed.binance.org",
    "https://bsc-dataseed1.binance.org",
    "https://bsc-dataseed2.binance.org",
    "https://bsc-dataseed3.binance.org",
    "https://bsc-dataseed4.binance.org",
    "https://bsc.publicnode.com",
    "https://bsc-rpc.publicnode.com",
  ],
  explorer: "https://bscscan.com",
};
