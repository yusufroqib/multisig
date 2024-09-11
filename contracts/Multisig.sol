// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Multisig {
    uint8 public quorum;
    uint8 public noOfValidSigners;
    uint256 public txCount;

    enum TrxType {
        transferFund,
        updateQuorum
    }

    struct Transaction {
        uint256 id;
        TrxType trxType;
        uint256 amount;
        uint8 newQuorum;
        address sender;
        address recipient;
        bool isCompleted;
        uint256 timestamp;
        uint256 noOfApproval;
        address tokenAddress;
        address[] transactionSigners;
    }

    mapping(address => bool) public isValidSigner;
    mapping(uint256 => Transaction) public transactions; // txId -> Transaction
    // signer -> transactionId -> bool (checking if an address has signed)
    mapping(address => mapping(uint256 => bool)) public hasSigned;

    constructor(uint8 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers");
        require(_quorum > 1, "quorum is too small");

        for (uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed");
            require(!isValidSigner[_validSigners[i]], "signer already exist");

            isValidSigner[_validSigners[i]] = true;
        }

        noOfValidSigners = uint8(_validSigners.length);

        if (!isValidSigner[msg.sender]) {
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }

        require(
            _quorum <= noOfValidSigners,
            "quorum greater than valid signers"
        );
        quorum = _quorum;
    }

    function transfer(
        uint256 _amount,
        address _recipient,
        address _tokenAddress
    ) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");

        require(_amount > 0, "can't send zero amount");
        require(_recipient != address(0), "address zero found");
        require(_tokenAddress != address(0), "address zero found");

        require(
            IERC20(_tokenAddress).balanceOf(address(this)) >= _amount,
            "insufficient funds"
        );

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];

        trx.id = _txId;
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = _tokenAddress;
        trx.noOfApproval += 1;
        trx.trxType = TrxType.transferFund;
        trx.transactionSigners.push(msg.sender);
        hasSigned[msg.sender][_txId] = true;
        txCount += 1;
    }

    function approveTransferTx(uint8 _txId) external {
        Transaction storage trx = transactions[_txId];

        require(trx.id != 0, "invalid tx id");

        require(
            trx.trxType == TrxType.transferFund,
            "Invalid transaction type"
        );
        require(
            IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount,
            "insufficient funds"
        );
        require(!trx.isCompleted, "transaction already completed");
        require(trx.noOfApproval < quorum, "approvals already reached");

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_txId], "can't sign twice");

        hasSigned[msg.sender][_txId] = true;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);

        if (trx.noOfApproval == quorum) {
            trx.isCompleted = true;
            IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
        }
    }

    function updateQuorum(uint8 _quorum) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");
        require(
            _quorum <= noOfValidSigners,
            "quorum greater than valid signers"
        );
        require(_quorum > 1, "quorum is too small");
        uint256 updateId = txCount + 1;
        Transaction storage updateRequest = transactions[updateId];
        updateRequest.id = updateId;
        updateRequest.transactionSigners.push(msg.sender);
        updateRequest.sender = msg.sender;
        updateRequest.timestamp = block.timestamp;
        updateRequest.trxType = TrxType.updateQuorum;
        updateRequest.noOfApproval += 1;
        updateRequest.newQuorum = _quorum;
        hasSigned[msg.sender][updateId] = true;
        txCount += 1;
    }

    function approveQuorumUpdate(uint8 _trxId) external {
        Transaction storage updateRequest = transactions[_trxId];
        require(updateRequest.id != 0, "invalid update id");
        require(
            updateRequest.trxType == TrxType.updateQuorum,
            "Invalid transaction type"
        );

        require(!updateRequest.isCompleted, "quorum update already completed");
        require(
            updateRequest.noOfApproval < quorum,
            "approvals already reached"
        );

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_trxId], "can't sign twice");
        hasSigned[msg.sender][_trxId] = true;
        updateRequest.noOfApproval += 1;
        updateRequest.transactionSigners.push(msg.sender);

        if (updateRequest.noOfApproval == quorum) {
            updateRequest.isCompleted = true;
            quorum = updateRequest.newQuorum;
        }
    }
}
