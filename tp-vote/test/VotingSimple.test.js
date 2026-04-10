import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";

describe("VotingSimple", function () {

    async function deployFixture() {
        const { viem } = await network.connect();
        const [owner, voter1, voter2, voter3] = await viem.getWalletClients();
        const voting = await viem.deployContract("VotingSimple", [["Alice", "Bob", "Charlie"]]);
        return { voting, owner, voter1, voter2, voter3 };
    }

    describe("Déploiement", function () {
        it("doit initialiser les candidats correctement", async function () {
            const { voting, owner } = await deployFixture();

            const count = await voting.read.getCandidateCount();
            assert.equal(count, 3n);

            const ownerAddress = await voting.read.owner();
            assert.equal(ownerAddress.toLowerCase(), owner.account.address.toLowerCase());

            const isOpen = await voting.read.votingOpen();
            assert.equal(isOpen, false);

            const alice = await voting.read.candidates([0n]);
            const bob = await voting.read.candidates([1n]);
            const charlie = await voting.read.candidates([2n]);
            assert.equal(alice[1], 0n);
            assert.equal(bob[1], 0n);
            assert.equal(charlie[1], 0n);
        });
    });

    describe("Gestion des électeurs", function () {
        it("l'admin peut ajouter un electeur", async function () {
            const { voting, owner, voter1 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });

            const isAuthorized = await voting.read.authorizedVoters([voter1.account.address]);
            assert.equal(isAuthorized, true);
        });

        it("un non-admin ne peut pas ajouter un electeur", async function () {
            const { voting, voter1, voter2 } = await deployFixture();

            await assert.rejects(
                async () => {
                    await voting.write.addVoter([voter2.account.address], { account: voter1.account });
                },
                /Pas l'admin/
            );
        });

        it("impossible d'ajouter deux fois le meme electeur", async function () {
            const { voting, owner, voter1 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });
            await assert.rejects(
                async () => {
                    await voting.write.addVoter([voter1.account.address], { account: owner.account });
                },
                /Deja enregistre/
            );
        });
    });

    describe("Ouverture du vote", function () {
        it("l'admin peut ouvrir le vote", async function () {
            const { voting, owner } = await deployFixture();

            await voting.write.startVoting({ account: owner.account });

            const isOpen = await voting.read.votingOpen();
            assert.equal(isOpen, true);
        });

        it("un non-admin ne peut pas ouvrir le vote", async function () {
            const { voting, voter1 } = await deployFixture();

            await assert.rejects(
                async () => {
                    await voting.write.startVoting({ account: voter1.account });
                },
                /Pas l'admin/
            );
        });
    });

    describe("Vote", function () {
        it("un electeur autorise peut voter", async function () {
            const { voting, owner, voter1 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });
            await voting.write.startVoting({ account: owner.account });
            await voting.write.vote([0n], { account: voter1.account });

            const candidate = await voting.read.candidates([0n]);
            assert.equal(candidate[1], 1n);

            const voted = await voting.read.hasVoted([voter1.account.address]);
            assert.equal(voted, true);
        });

        it("un electeur ne peut pas voter deux fois", async function () {
            const { voting, owner, voter1 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });
            await voting.write.startVoting({ account: owner.account });
            await voting.write.vote([0n], { account: voter1.account });

            await assert.rejects(
                async () => {
                    await voting.write.vote([1n], { account: voter1.account });
                },
                /Vous avez deja vote/
            );
        });

        it("un non-electeur ne peut pas voter", async function () {
            const { voting, owner, voter2 } = await deployFixture();

            await voting.write.startVoting({ account: owner.account });

            await assert.rejects(
                async () => {
                    await voting.write.vote([0n], { account: voter2.account });
                },
                /Pas autorise a voter/
            );
        });

        it("impossible de voter si le vote est ferme", async function () {
            const { voting, owner, voter1 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });
            // vote non ouvert : startVoting n'est pas appelé

            await assert.rejects(
                async () => {
                    await voting.write.vote([0n], { account: voter1.account });
                },
                /Le vote est ferme/
            );
        });

        it("impossible de voter pour un candidat inexistant", async function () {
            const { voting, owner, voter1 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });
            await voting.write.startVoting({ account: owner.account });

            await assert.rejects(
                async () => {
                    await voting.write.vote([999n], { account: voter1.account });
                }
            );
        });
    });

    describe("Résultats", function () {
        it("getWinner retourne le bon candidat", async function () {
            const { voting, owner, voter1, voter2, voter3 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });
            await voting.write.addVoter([voter2.account.address], { account: owner.account });
            await voting.write.addVoter([voter3.account.address], { account: owner.account });
            await voting.write.startVoting({ account: owner.account });

            await voting.write.vote([1n], { account: voter1.account }); // Bob
            await voting.write.vote([1n], { account: voter2.account }); // Bob
            await voting.write.vote([0n], { account: voter3.account }); // Alice

            const winner = await voting.read.getWinner();
            assert.equal(winner, "Bob");
        });

        it("en cas d'egalite, retourne le premier candidat avec le plus de votes", async function () {
            const { voting, owner, voter1, voter2 } = await deployFixture();

            await voting.write.addVoter([voter1.account.address], { account: owner.account });
            await voting.write.addVoter([voter2.account.address], { account: owner.account });
            await voting.write.startVoting({ account: owner.account });

            await voting.write.vote([0n], { account: voter1.account }); // Alice
            await voting.write.vote([1n], { account: voter2.account }); // Bob (égalité)

            // getWinner utilise >, donc en cas d'égalité il garde le premier (Alice, index 0)
            const winner = await voting.read.getWinner();
            assert.equal(winner, "Alice");
        });
    });
});
