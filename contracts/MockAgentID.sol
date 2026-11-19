// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal mock of the SPACE ID Agent ID ERC-721, for BSC testnet
///         testing only. Implements balanceOf plus a one-per-address mint.
///         NEVER use on mainnet — mainnet uses the real Agent ID contract
///         at 0x60b9262456de011f7d15a54cdd8c48baaa8b022f.
contract MockAgentID {
    mapping(address => uint256) private _balances;

    event Minted(address indexed to);

    function mint(address to) external {
        require(_balances[to] == 0, "already has id");
        _balances[to] = 1;
        emit Minted(to);
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }
}
