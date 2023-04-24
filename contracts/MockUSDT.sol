// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("MockUSDT", "mUSDT") {
        _mint(msg.sender, 100000000000000000000000);
    }
}
