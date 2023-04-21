// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct Participant {
    address selfAddress;
    address firstReferrerAddress;
    address secondReferrerAddress;
    bool ido;
    uint256 tokenAmount;
    bool withdrawal;
}
