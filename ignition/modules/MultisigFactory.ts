import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MultisigFactoryModule = buildModule("MultisigFactoryModule", (m) => {

    const multisigFactory = m.contract("MultisigFactory");

    return { multisigFactory };
});

export default MultisigFactoryModule;

// Deployed MultisigFactory: 0x99c9565F3769D40641429967604144a7Ba48AAA4
