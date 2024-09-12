import {
	time,
	loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { MultisigFactory, MultisigFactory__factory } from "../typechain-types";
import { ContractTransactionResponse } from "ethers";

describe("MultisigFactory", function () {
	async function deployMultisigFactory() {
		const multisigFactory: MultisigFactory__factory =
			await hre.ethers.getContractFactory("MultisigFactory");
		const multiSigFactory = await multisigFactory.deploy();
		return {
			multiSigFactory,
		};
	}

	async function getEvent(
		contract: MultisigFactory,
		tx: ContractTransactionResponse,
		eventName: string
	) {
		const receipt = await tx.wait();
		if (receipt?.logs) {
			for (const log of receipt.logs) {
				const event = contract.interface.parseLog(log);
				if (event?.name === eventName) {
					return event;
				}
			}
		}

		return null;
	}

	describe("Deployment", function () {
		it("Should deploy the MultisigFactory contract", async function () {
			const { multiSigFactory } = await loadFixture(deployMultisigFactory);
			expect(await multiSigFactory.getAddress()).to.be.a("string");
		});
	});
	describe("Create Multisig Wallet", function () {
        it("Should revert if wallet creator is not among the valid signers", async function() {
            const { multiSigFactory } = await loadFixture(deployMultisigFactory);
			const [owner, otherAccount, thirdAccount, invalidSigner] =
				await hre.ethers.getSigners();
			const validSigners = [
				owner.address,
				otherAccount.address,
				thirdAccount.address,
			];
			const _quorum = 2;
			await expect(
				multiSigFactory
					.connect(invalidSigner)
					.createMultisigWallet(_quorum, validSigners)
			).to.be.revertedWith("Wallet creator is not a valid signer");
        })
		it("Should emit an event when deployed", async function () {
			const { multiSigFactory } = await loadFixture(deployMultisigFactory);
			const [owner, otherAccount, thirdAccount, invalidSigner] =
				await hre.ethers.getSigners();
			const validSigners = [
				owner.address,
				otherAccount.address,
				thirdAccount.address,
			];
			const _quorum = 2;
			await expect(
				multiSigFactory.createMultisigWallet(_quorum, validSigners)
			).to.emit(multiSigFactory, "MultisigWalletCreated");
		});
		it("Should deploy the MultisigFactory contract", async function () {
			const { multiSigFactory } = await loadFixture(deployMultisigFactory);
			const [owner, otherAccount, thirdAccount, invalidSigner] =
				await hre.ethers.getSigners();

			const validSigners = [
				owner.address,
				otherAccount.address,
				thirdAccount.address,
			];
			const _quorum = 2;
			const txn = await multiSigFactory.createMultisigWallet(
				_quorum,
				validSigners
			);
			// const receipt = await tx.wait();
			const event = await getEvent(
				multiSigFactory,
				txn,
				"MultisigWalletCreated"
			);

			const newMultisigWallet = event?.args.newMultisig;

			// Add assertions
			expect(newMultisigWallet).to.be.properAddress; // Check if it's a valid address

			// console.log(receipt?.newMulsig_)
			// expect(multiSigFactory.address).to.be.a("string");
		});

		it("Should return correct length of new multisig clones array", async function () {
			const { multiSigFactory } = await loadFixture(deployMultisigFactory);
			const [owner, otherAccount, thirdAccount, invalidSigner] =
				await hre.ethers.getSigners();

			const validSigners = [
				owner.address,
				otherAccount.address,
				thirdAccount.address,
			];
			const _quorum = 2;
			const txn = await multiSigFactory.createMultisigWallet(
				_quorum,
				validSigners
			);
			await txn.wait();
			const response = await multiSigFactory.getMultiSigClones();
			expect(response.length).to.equal(1);
		});

		it("Should return correct quorum count for new contract", async function () {
			const { multiSigFactory } = await loadFixture(deployMultisigFactory);
			const [owner, otherAccount, thirdAccount, invalidSigner] =
				await hre.ethers.getSigners();

			const validSigners = [
				owner.address,
				otherAccount.address,
				thirdAccount.address,
			];
			const _quorum = 2;
			const txn = await multiSigFactory.createMultisigWallet(
				_quorum,
				validSigners
			);
			await txn.wait();
			const response = await multiSigFactory.getMultiSigClones();
			const multisig = await ethers.getContractAt("Multisig", response[0]);

			const quorum = await multisig.quorum();
			expect(quorum).to.equal(_quorum);
		});
	});
});
