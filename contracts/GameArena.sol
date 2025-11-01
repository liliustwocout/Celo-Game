// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameToken.sol";

contract GameArena {
    GameToken public token;
    address public owner;

    event Played(address indexed player, bool won, uint256 amount);

    constructor(address tokenAddress) {
        token = GameToken(tokenAddress);
        owner = msg.sender;
    }

    function playGame(uint256 betAmount) external {
        require(token.balanceOf(msg.sender) >= betAmount, "Not enough tokens");
        // kiểu chơi đơn giản: random thắng 50%
        bool won = (uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 2) == 0;
        if (won) {
            uint256 prize = betAmount * 2;
            token.mint(msg.sender, prize);
            emit Played(msg.sender, true, prize);
        } else {
            token.transfer(owner, betAmount);
            emit Played(msg.sender, false, betAmount);
        }
    }
}
