//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

contract LlamaSale is Ownable, ReentrancyGuard {
    error WrongBlock();
    error ZeroAmount();
    error WrongHolder();
    error WrongAmount();
    error WrongPersonalBalance();
    error WrongTotalBalance();

    struct Round {
        uint256 startBlock;
        uint256 endBlock;
    }

    uint256 public constant maxTotalBalance = 95 ether;
    uint256 public constant maxPersonalBalance = 6 ether;

    mapping(address => uint256) public collectedAmounts;
    mapping(address => bool) public holders;

    Round public firstRound;
    Round public secondRound;

    event Deposit(address indexed holder, uint256 amount);

    constructor(
        address _initialOwner,
        address[] memory _holders,
        Round memory _firstRound,
        Round memory _secondRound
    ) Ownable(_initialOwner) {
        for (uint256 i = 0; i < _holders.length; i++) {
            holders[_holders[i]] = true;
        }
        firstRound = _firstRound;
        secondRound = _secondRound;
    }

    function deposit() public payable nonReentrant returns (bool success) {
        if (!checkRound(firstRound) && !checkRound(secondRound)) revert WrongBlock();
        if (!holders[msg.sender]) revert WrongHolder();
        if (msg.sender.balance < msg.value || msg.value == 0) revert WrongAmount();
        if (
            checkRound(firstRound) &&
            (msg.value + collectedAmounts[msg.sender] > maxPersonalBalance)
        ) revert WrongPersonalBalance();
        if (msg.value + address(this).balance > maxTotalBalance) revert WrongTotalBalance();
        collectedAmounts[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
        return true;
    }

    function checkRound(Round memory round) public view returns (bool success) {
        return block.number >= round.startBlock && block.number <= round.endBlock;
    }

    function withdraw() public onlyOwner returns (bool success) {
        payable(_msgSender()).transfer(address(this).balance);
        return true;
    }
}
