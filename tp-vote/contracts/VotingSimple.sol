// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSimple {

        struct Candidate {
        string name;
        uint voteCount;
    }

    Candidate[] public candidates;
    mapping(address => bool) public authorizedVoters;
    mapping(address => bool) public hasVoted;
    address public owner;
    bool public votingOpen;

    modifier onlyOwner() {
    require(msg.sender == owner, "Pas l'admin");
    _;
    }

    modifier onlyVoter() {
    require(authorizedVoters[msg.sender] == true, "Pas autorise a voter");
    _;
    }

    modifier votingIsOpen() {
    require(votingOpen == true, "Le vote est ferme");
    _;
    }

    event VoterAdded(address indexed voter);

    event VotingOpened();

    event Voted(address indexed voter, uint candidateIndex);

    constructor(string[] memory candidateNames) {
        owner = msg.sender;
        for (uint i = 0; i < candidateNames.length; i++) {
            candidates.push(Candidate({
                name: candidateNames[i],
                voteCount: 0
            }));
        }
    }

    function addVoter(address voter) public onlyOwner {
    require(authorizedVoters[voter] == false, "Deja enregistre");
    authorizedVoters[voter] = true;
    emit  VoterAdded(voter);
    }

    function startVoting() public onlyOwner {
    require(votingOpen == false, "Le vote est deja ouvert");
    votingOpen = true;
    emit VotingOpened();
    }

    function vote(uint candidateIndex) public onlyVoter votingIsOpen {
    require(hasVoted[msg.sender] == false, "Vous avez deja vote");
    hasVoted[msg.sender] = true;
    candidates[candidateIndex].voteCount++;
    emit Voted(msg.sender, candidateIndex);
    }

    function getCandidateCount() public view returns (uint) {
    return candidates.length;
    }

    function getWinner() public view returns (string memory) {
        uint winnerIndex = 0;
        for (uint i = 1; i < candidates.length; i++) {
            if (candidates[i].voteCount > candidates[winnerIndex].voteCount) {
                winnerIndex = i;
            }
        }
        return candidates[winnerIndex].name;
    }



}
