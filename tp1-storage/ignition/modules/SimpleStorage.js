const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

/**
 * Module Hardhat Ignition pour SimpleStorage
 * Gère le déploiement de façon idempotente :
 * si le contrat est déjà déployé, Ignition ne le redéploie pas
 */
const SimpleStorageModule = buildModule("SimpleStorageModule", (m) => {
  // Déployer SimpleStorage
  const simpleStorage = m.contract("SimpleStorage");

  return { simpleStorage };
});

module.exports = SimpleStorageModule;