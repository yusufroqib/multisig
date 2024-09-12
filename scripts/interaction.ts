import hre, { ethers } from "hardhat";
import {
	Multisig,
	MultisigFactory,
	MultisigFactory__factory,
	Web3CXI,
} from "../typechain-types";
import { ContractTransactionResponse } from "ethers";

async function main() {
	const MultisigFactoryAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
	const Web3CXIAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
	const multisigFactory: MultisigFactory = await ethers.getContractAt(
		"MultisigFactory",
		MultisigFactoryAddress
	);
	const web3CXI: Web3CXI = await ethers.getContractAt(
		"Web3CXI",
		Web3CXIAddress
	);
	const [owner, otherAccount, thirdAccount, invalidSigner] =
		await hre.ethers.getSigners();
	const validSigners = [
		owner.address,
		otherAccount.address,
		thirdAccount.address,
	];
	const _quorum = 2;
	const multisigClonesBeforeCreating =
		await multisigFactory.getMultiSigClones();
	console.log(
		"Multisig clones before creating new wallet",
		multisigClonesBeforeCreating
	);
	const CreateWalletTxn = await multisigFactory.createMultisigWallet(
		_quorum,
		validSigners
	);
	console.log({ CreateWalletTxn });

	await CreateWalletTxn.wait();

	const multisigClonesAfterCreating = await multisigFactory.getMultiSigClones();
	console.log(
		"Multisig clones after creating new wallet",
		multisigClonesAfterCreating
	);
	const firstMultisig = multisigClonesAfterCreating[0];
	const multisig: Multisig = await ethers.getContractAt(
		"Multisig",
		firstMultisig
	);
	const amount = ethers.parseUnits("100", 18);
	const depositTx = await web3CXI.transfer(multisig, amount);
	console.log({ depositTx });
}
// async function getEvent(
// 	contract: OnChainNFT,
// 	tx: ContractTransactionResponse,
// 	eventName: string
// ) {
// 	const receipt = await tx.wait();
// 	if (receipt?.logs) {
// 		for (const log of receipt.logs) {
// 			const event = contract.interface.parseLog(log);
// 			if (event?.name === eventName) {
// 				return event;
// 			}
// 		}
// 	}

// 	return null;
// }
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
