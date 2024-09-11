import {
	time,
	loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { Multisig__factory, Web3CXI__factory } from "../typechain-types";

describe("Multisig", function () {
	async function deployToken() {
		const erc20Token: Web3CXI__factory = await hre.ethers.getContractFactory(
			"Web3CXI"
		);
		const token = await erc20Token.deploy();

		return { token };
	}

	async function deployMultisig() {
		const [owner, otherAccount, thirdAccount, invalidSigner] =
			await hre.ethers.getSigners();

		const { token } = await loadFixture(deployToken);
		const _quorum = 2;
		const validSigners = [
			owner.address,
			otherAccount.address,
			thirdAccount.address,
		];

		const multisig: Multisig__factory = await hre.ethers.getContractFactory(
			"Multisig"
		);
		const multiSig = await multisig.deploy(_quorum, validSigners);

		return {
			multiSig,
			owner,
			otherAccount,
			token,
			thirdAccount,
			invalidSigner,
		};
	}

	describe("Deployment", function () {
		it("Should check if quorum is less than or equal to valid signers", async function () {
			const { multiSig } = await loadFixture(deployMultisig);
			const noOfValidSigners = await multiSig.noOfValidSigners();

			expect(await multiSig.quorum()).to.lessThanOrEqual(noOfValidSigners);
		});

		it("should check if quorum is greater than 1", async function () {
			const { multiSig } = await loadFixture(deployMultisig);
			expect(await multiSig.quorum()).to.greaterThan(1);
		});

		it("Should check if valid signers is greater than 1", async function () {
			const { multiSig } = await loadFixture(deployMultisig);
			const validSigners = await multiSig.noOfValidSigners();
			expect(validSigners).to.greaterThan(1);
		});
	});

	describe("Transfer", function () {
		it("Should create a new transfer transaction", async function () {
			const { multiSig, owner, otherAccount, token } = await loadFixture(
				deployMultisig
			);
			const amount = ethers.parseUnits("1", 18);

			await token.transfer(multiSig, amount);
			await multiSig.transfer(amount, otherAccount.address, token);

			const txCount = await multiSig.txCount();
			expect(txCount).to.equal(1);

			const tx = await multiSig.transactions(1);
			expect(tx.trxType).to.equal(0); // 0 represents TrxType.transferFund
		});

		it("Should revert if contract doesn't have enough balance", async function () {
			const { multiSig, owner, otherAccount, thirdAccount, token } =
				await loadFixture(deployMultisig);
			const amount = ethers.parseUnits("1", 18);
			const transferredAmount = ethers.parseUnits("2", 18);

			await token.transfer(multiSig, amount);

			await expect(
				multiSig.transfer(transferredAmount, otherAccount.address, token)
			).to.be.revertedWith("insufficient funds");
		});

		it("Should revert if sender is not a valid signer", async function () {
			const { multiSig, owner, otherAccount, invalidSigner, token } =
				await loadFixture(deployMultisig);
			const amount = ethers.parseUnits("1", 18);

			await token.transfer(multiSig, amount);
			await expect(
				multiSig
					.connect(invalidSigner)
					.transfer(amount, otherAccount.address, token)
			).to.be.revertedWith("invalid signer");
		});
	});

	describe("Approve Transfer Tx", function () {
		it("Should approve a transfer transaction", async function () {
			const { multiSig, owner, otherAccount, token, thirdAccount } =
				await loadFixture(deployMultisig);
			const amount = ethers.parseUnits("1", 18);

			await token.transfer(multiSig, amount);
			await multiSig.transfer(amount, otherAccount.address, token);

			await multiSig.connect(thirdAccount).approveTransferTx(1);

			const tx = await multiSig.transactions(1);
			expect(tx.noOfApproval).to.equal(2);
			expect(tx.isCompleted).to.be.true;
		});

		it("Should revert if trying to approve twice", async function () {
			const { multiSig, owner, otherAccount, token } = await loadFixture(
				deployMultisig
			);
			const amount = ethers.parseUnits("1", 18);

			await token.transfer(multiSig, amount);
			await multiSig.transfer(amount, otherAccount.address, token);

			await expect(multiSig.approveTransferTx(1)).to.be.revertedWith(
				"can't sign twice"
			);
		});

		it("Should revert if trying to approve completed transfer", async function () {
			const { multiSig, owner, otherAccount, thirdAccount, token } =
				await loadFixture(deployMultisig);
			const amount = ethers.parseUnits("100", 18);
			await token.transfer(multiSig, amount);
			const transferAmount = ethers.parseUnits("10", 18);
			await multiSig.transfer(transferAmount, otherAccount.address, token);
			await multiSig.connect(otherAccount).approveTransferTx(1);
			await expect(
				multiSig.connect(thirdAccount).approveTransferTx(1)
			).to.be.revertedWith("transaction already completed");
		});

		it("Should revert if trying to approve a quorum update transaction", async function () {
			const { multiSig, owner } = await loadFixture(deployMultisig);
			const newQuorum = 3;

			await multiSig.updateQuorum(newQuorum);

			await expect(multiSig.approveTransferTx(1)).to.be.revertedWith(
				"Invalid transaction type"
			);
		});
	});

	describe("Update Quorum", function () {
		it("Should create a new quorum update transaction", async function () {
			const { multiSig, owner } = await loadFixture(deployMultisig);
			const newQuorum = 3;

			await multiSig.updateQuorum(newQuorum);

			const txCount = await multiSig.txCount();
			expect(txCount).to.equal(1);

			const tx = await multiSig.transactions(1);
			expect(tx.trxType).to.equal(1); // 1 represents TrxType.updateQuorum
			expect(tx.newQuorum).to.equal(newQuorum);
		});

		it("Should revert if quorum is not greater than 1", async function () {
			const { multiSig, owner } = await loadFixture(deployMultisig);
			const invalidQuorum = 1;

			await expect(multiSig.updateQuorum(invalidQuorum)).to.be.revertedWith(
				"quorum is too small"
			);
		});

		it("Should revert if new quorum is less than or equal to valid signers", async function () {
			const { multiSig, owner, otherAccount } = await loadFixture(
				deployMultisig
			);
			const invalidQuorum = 5;

			await expect(multiSig.updateQuorum(invalidQuorum)).to.be.revertedWith(
				"quorum greater than valid signers"
			);
		});

		it("Should revert if new quorum is greater than valid signers", async function () {
			const { multiSig, owner } = await loadFixture(deployMultisig);
			const invalidQuorum = 5;

			await expect(multiSig.updateQuorum(invalidQuorum)).to.be.revertedWith(
				"quorum greater than valid signers"
			);
		});
	});

	describe("Approve Quorum Update", function () {
		it("Should approve a quorum update transaction", async function () {
			const { multiSig, owner, otherAccount } = await loadFixture(
				deployMultisig
			);
			const newQuorum = 3;

			await multiSig.updateQuorum(newQuorum);
			await multiSig.connect(otherAccount).approveQuorumUpdate(1);

			const tx = await multiSig.transactions(1);
			expect(tx.noOfApproval).to.equal(2);
			expect(tx.isCompleted).to.be.true;

			const updatedQuorum = await multiSig.quorum();
			expect(updatedQuorum).to.equal(newQuorum);
		});

		it("Should revert if trying to approve twice", async function () {
			const { multiSig, owner } = await loadFixture(deployMultisig);
			const newQuorum = 3;

			await multiSig.updateQuorum(newQuorum);
			await expect(multiSig.approveQuorumUpdate(1)).to.be.revertedWith(
				"can't sign twice"
			);
		});

		it("Should revert if trying to approve completed quorum update", async function () {
			const { multiSig, owner, otherAccount, thirdAccount } = await loadFixture(
				deployMultisig
			);
			const newQuorum = 3;
			await multiSig.updateQuorum(newQuorum);
			await multiSig.connect(otherAccount).approveQuorumUpdate(1);
			await expect(
				multiSig.connect(thirdAccount).approveQuorumUpdate(1)
			).to.be.revertedWith("quorum update already completed");
		});

		it("Should revert if trying to approve a transfer transaction", async function () {
			const { multiSig, owner, otherAccount, token } = await loadFixture(
				deployMultisig
			);
			const amount = ethers.parseUnits("1", 18);

			await token.transfer(multiSig, amount);
			await multiSig.transfer(amount, otherAccount.address, token);

			await expect(multiSig.approveQuorumUpdate(1)).to.be.revertedWith(
				"Invalid transaction type"
			);
		});
	});
});
