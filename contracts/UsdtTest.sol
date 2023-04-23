// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UsdtTest is ERC20 {
    constructor() ERC20("UsdtTest", "USDT") {
        _mint(msg.sender, 100000000000000000000000);
    }
}
