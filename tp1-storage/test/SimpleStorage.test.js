const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStorage", function () {

  // Fixture : déploie le contrat une fois, réutilise l'état pour chaque test
  async function deploySimpleStorageFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy();

    return { simpleStorage, owner, otherAccount };
  }

  // --- Déploiement ---

  describe("Déploiement", function () {

    it("Doit initialiser le owner à l'adresse du déployeur", async function () {
      const { simpleStorage, owner } = await deploySimpleStorageFixture();
      expect(await simpleStorage.owner()).to.equal(owner.address);
    });

    it("Doit initialiser la valeur stockée à 0", async function () {
      const { simpleStorage } = await deploySimpleStorageFixture();
      expect(await simpleStorage.retrieve()).to.equal(0n);
    });

    it("Doit initialiser updateCount à 0", async function () {
      const { simpleStorage } = await deploySimpleStorageFixture();
      expect(await simpleStorage.updateCount()).to.equal(0n);
    });

  });

  // --- Fonction store() ---

  describe("store()", function () {

    it("Doit stocker une nouvelle valeur", async function () {
      const { simpleStorage } = await deploySimpleStorageFixture();
      await simpleStorage.store(42n);
      expect(await simpleStorage.retrieve()).to.equal(42n);
    });

    it("Doit incrémenter updateCount à chaque appel", async function () {
      const { simpleStorage } = await deploySimpleStorageFixture();
      await simpleStorage.store(1n);
      await simpleStorage.store(2n);
      await simpleStorage.store(3n);
      expect(await simpleStorage.updateCount()).to.equal(3n);
    });

    it("Doit émettre l'event ValueUpdated avec les bons paramètres", async function () {
      const { simpleStorage, owner } = await deploySimpleStorageFixture();
      await expect(simpleStorage.store(99n))
        .to.emit(simpleStorage, "ValueUpdated")
        .withArgs(0n, 99n, owner.address);
    });

    it("Doit rejeter un appel depuis un compte non-owner", async function () {
      const { simpleStorage, otherAccount } = await deploySimpleStorageFixture();
      await expect(
        simpleStorage.connect(otherAccount).store(42n)
      ).to.be.revertedWithCustomError(simpleStorage, "NotOwner");
    });

  });

  // --- Fonction getState() ---

  describe("getState()", function () {

    it("Doit retourner l'état complet du contrat", async function () {
      const { simpleStorage, owner } = await deploySimpleStorageFixture();
      await simpleStorage.store(77n);

      const [value, count, ownerAddr] = await simpleStorage.getState();
      expect(value).to.equal(77n);
      expect(count).to.equal(1n);
      expect(ownerAddr).to.equal(owner.address);
    });

  });

});
