import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenAddress = "0xfc04Cb7392147636162c660c144783763538fe69";

const MultisigModule = buildModule("MultisigModule", (m) => {

    const multisig = m.contract("Multisig", [tokenAddress]);

    return { multisig };
});

export default MultisigModule;

// Deployed Multisig: 0x99c9565F3769D40641429967604144a7Ba48AAA4
