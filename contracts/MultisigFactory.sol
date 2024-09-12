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
        // uint256 validSignersLength = _validSigners.length;
        bool isCallerValidSigner;

        for (uint256 i = 0; i < _validSigners.length; i++) {
            if (_validSigners[i] == msg.sender) {
                isCallerValidSigner = true;
            }
        }
        require(isCallerValidSigner, "Wallet creator is not a valid signer");

        newMulsig_ = new Multisig(_quorum, _validSigners);

        multisigClones.push(newMulsig_);

        length_ = multisigClones.length;
        emit MultisigWalletCreated(newMulsig_, length_);
    }

    function getMultiSigClones() external view returns (Multisig[] memory) {
        return multisigClones;
    }
}
