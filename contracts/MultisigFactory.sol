// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Multisig.sol";

contract MultisigFactory {
    Multisig[] multisigClones;
    event MultisigWalletCreated(Multisig indexed newMultisig, uint256 length);

    function createMultisigWallet(
        uint8 _quorum,
        address[] memory _validSigners
    ) external returns (Multisig newMulsig_, uint256 length_) {
        newMulsig_ = new Multisig(_quorum, _validSigners);

        multisigClones.push(newMulsig_);

        length_ = multisigClones.length;
        emit MultisigWalletCreated(newMulsig_, length_);
    }

    function getMultiSigClones() external view returns (Multisig[] memory) {
        return multisigClones;
    }
}
