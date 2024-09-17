import hre, { ethers } from "hardhat";
import { Multisig, MultisigFactory, Web3CXI } from "../typechain-types";

async function main() {
	const MultisigFactoryAddress = "0xD8aF8f69ac074939E8ab9A6f04ce2CE9692ED179";
	const Web3CXIAddress = "0x74ABB0CeF64A379e1938b10Cd970397EB8E4dbFA";
	const multisigFactory: MultisigFactory = await ethers.getContractAt(
		"MultisigFactory",
		MultisigFactoryAddress
	);
	const web3CXI: Web3CXI = await ethers.getContractAt(
		"Web3CXI",
		Web3CXIAddress
	);
	const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();
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
	const firstMultisig = multisigClonesBeforeCreating[2];
	const multisig: Multisig = await ethers.getContractAt(
		"Multisig",
		firstMultisig
	);
	const amount = ethers.parseUnits("100", 18);
	const depositTx = await web3CXI.transfer(multisig, amount);
	console.log({ depositTx });

	const quorum = Number(await multisig.quorum());
	const noOfValidSigners = Number(await multisig.noOfValidSigners());
	const txCount = Number(await multisig.txCount());
	console.log("State Variables before transfer", {
		quorum,
		noOfValidSigners,
		txCount,
	});

	const transferAmount = ethers.parseUnits("50", 18);
	const transferTx = await multisig.transfer(
		transferAmount,
		thirdAccount.address,
		Web3CXIAddress
	);
	console.log("Initiate Transfer Transaction", transferTx);
	await transferTx.wait();
	const quorumAfterTransfer = Number(await multisig.quorum());
	const noOfValidSignersAfterTransfer = Number(
		await multisig.noOfValidSigners()
	);
	const txCountAfterTransfer = Number(await multisig.txCount());
	console.log("State Variables after transfer", {
		// quorumAfterTransfer,
		// noOfValidSignersAfterTransfer,
		txCountAfterTransfer,
	});
	const walletBalanceBeforApproval = await web3CXI.balanceOf(firstMultisig);
	const thirdAcctBalBefore = await web3CXI.balanceOf(thirdAccount.address);

	console.log(
		"Wallet balance for token before approval",
		walletBalanceBeforApproval
	);
	console.log({ thirdAcctBalBefore });
	const approveTransferTx = await multisig
		.connect(otherAccount)
		.approveTransferTx(1);

	console.log({ approveTransferTx });
	await approveTransferTx.wait();

	const walletBalanceAfterApproval = await web3CXI.balanceOf(firstMultisig);
	console.log(
		"Wallet balance for token after approval",
		walletBalanceAfterApproval
	);

	const thirdAcctBalAfter = await web3CXI.balanceOf(thirdAccount.address);
	console.log({ thirdAcctBalAfter });

	const approvedTx = await multisig.transactions(1);
	console.log("Approved Transaction", approvedTx);

	const newQuorum = 3;
	const updateQuorumTx = await multisig.updateQuorum(newQuorum);
	const quorumBeforeUpdate = Number(await multisig.quorum());
	console.log("Quorum before updating", quorumBeforeUpdate);
	console.log({ updateQuorumTx });
	await updateQuorumTx.wait();

	const approveQuorumUpdateTx = await multisig
		.connect(otherAccount)
		.approveQuorumUpdate(2);
	console.log({ approveQuorumUpdateTx });
	await approveQuorumUpdateTx.wait();
	const quorumAfterUpdate = Number(await multisig.quorum());
	console.log("Quorum after updating", quorumAfterUpdate);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
