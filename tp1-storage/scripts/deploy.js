const { ethers } = require("hardhat");

async function main() {
  console.log("Déploiement de SimpleStorage...\n");

  // Récupérer le déployeur (premier compte Hardhat)
  const [deployer] = await ethers.getSigners();
  console.log("Déployeur :", deployer.address);
  console.log(
    "Solde     :",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH\n"
  );

  // Déployer le contrat
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();
  await simpleStorage.waitForDeployment();

  const address = await simpleStorage.getAddress();
  console.log("SimpleStorage déployé à :", address);

  // Vérification initiale
  const [value, count, owner] = await simpleStorage.getState();
  console.log("\nEtat initial :");
  console.log("  value      :", value.toString());
  console.log("  updateCount:", count.toString());
  console.log("  owner      :", owner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});