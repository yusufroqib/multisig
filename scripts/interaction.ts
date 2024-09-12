import hre, { ethers } from "hardhat";
import { MultisigFactory, MultisigFactory__factory } from "../typechain-types";
import { ContractTransactionResponse } from "ethers";

async function main() {
	const MultisigFactoryAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
	const multisigFactory: MultisigFactory = await ethers.getContractAt(
		"MultisigFactory",
		MultisigFactoryAddress
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
		"Multisig clones before creating new",
		multisigClonesBeforeCreating
	);
	const CreateWalletTxn = await multisigFactory.createMultisigWallet(
		_quorum,
		validSigners
	);
	console.log({ CreateWalletTxn });

	await CreateWalletTxn.wait();



	
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
