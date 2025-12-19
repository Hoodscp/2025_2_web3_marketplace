// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentToken is ERC20, Ownable {
    // 1회 지급량 (1000 토큰, 18 decimals 기준)
    uint256 public constant DROP_AMOUNT = 1000 * 10**18;
    // 드랍 쿨타임 (예: 1일)
    uint256 public constant LOCK_TIME = 1 days;

    // 사용자의 마지막 클레임 시간을 저장
    mapping(address => uint256) public lastClaimedTime;

    event TokensClaimed(address indexed user, uint256 amount);

    constructor() ERC20("MarketToken", "MKT") Ownable(msg.sender) {
        // 배포자에게 초기 물량 발행
        _mint(msg.sender, 1000000 * 10**18);
    }

    // 기능 1: 토큰 드랍 기능 (누구나 호출 가능)
    function claimTokens() external {
        require(
            block.timestamp >= lastClaimedTime[msg.sender] + LOCK_TIME,
            "Cool down time has not passed yet."
        );

        lastClaimedTime[msg.sender] = block.timestamp;
        _mint(msg.sender, DROP_AMOUNT);

        emit TokensClaimed(msg.sender, DROP_AMOUNT);
    }
}