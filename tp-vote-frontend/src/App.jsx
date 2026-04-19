import { useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import './App.css'

const CONTRACT_ADDRESS = "0x88502d910eF85944f8127fa8671bc3FC2137165f"
const ABI = [
  "function getCandidateCount() view returns (uint)",
  "function candidates(uint) view returns (string name, uint voteCount)",
  "function vote(uint candidateIndex)",
  "function votingOpen() view returns (bool)",
  "function getWinner() view returns (string)",
  "function owner() view returns (address)",
  "function authorizedVoters(address) view returns (bool)",
  "function hasVoted(address) view returns (bool)",
  "function addVoter(address voter)",
  "function startVoting()",
]

function App() {
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [votingOpen, setVotingOpen] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isVoter, setIsVoter] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [newVoterAddress, setNewVoterAddress] = useState('')
  const [error, setError] = useState('')
  const [winner, setWinner] = useState('')

  async function connectWallet() {
    const provider = new BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const c = new Contract(CONTRACT_ADDRESS, ABI, signer)
    setAccount(address)
    setContract(c)
    await loadData(c, address)
  }

  async function loadData(c, address) {
    const count = await c.getCandidateCount()
    const list = []
    for (let i = 0; i < count; i++) {
      const cand = await c.candidates(i)
      list.push({ name: cand.name, voteCount: cand.voteCount.toString(), index: i })
    }
    setCandidates(list)
    setVotingOpen(await c.votingOpen())
    const owner = await c.owner()
    setIsOwner(owner.toLowerCase() === address.toLowerCase())
    setIsVoter(await c.authorizedVoters(address))
    setHasVoted(await c.hasVoted(address))
    setWinner(await c.getWinner())
  }

  async function addVoter() {
    try {
      setError('')
      const tx = await contract.addVoter(newVoterAddress)
      await tx.wait()
      setNewVoterAddress('')
      await loadData(contract, account)
    } catch (e) {
      setError(e.reason || e.message)
    }
  }

  async function startVoting() {
    try {
      setError('')
      const tx = await contract.startVoting()
      await tx.wait()
      await loadData(contract, account)
    } catch (e) {
      setError(e.reason || e.message)
    }
  }

  async function vote(index) {
    try {
      setError('')
      const tx = await contract.vote(index)
      await tx.wait()
      await loadData(contract, account)
    } catch (e) {
      setError(e.reason || e.message)
    }
  }

  if (!account) {
    return (
      <div className="connect-wrapper">
        <h1>Vote DApp</h1>
        <p>Connecte ton wallet pour participer au vote</p>
        <button onClick={connectWallet}>Connecter MetaMask</button>
      </div>
    )
  }

  return (
    <div>
      <h1>Vote DApp</h1>

      <div className="status-bar">
        <span className={`badge ${votingOpen ? 'badge-open' : 'badge-closed'}`}>
          {votingOpen ? 'Vote ouvert' : 'Vote fermé'}
        </span>
        <span className={`badge ${isOwner ? 'badge-admin' : isVoter ? 'badge-voter' : 'badge-visitor'}`}>
          {isOwner ? 'Admin' : isVoter ? 'Électeur' : 'Visiteur'}
        </span>
      </div>

      <div className="card">
        <p>Connecté : {account.slice(0, 6)}...{account.slice(-4)}</p>
      </div>

      {error && <div className="error">{error}</div>}

      {isOwner && (
        <div className="card">
          <h2>Panel Admin</h2>
          <input
            value={newVoterAddress}
            onChange={e => setNewVoterAddress(e.target.value)}
            placeholder="Adresse Ethereum de l'électeur"
          />
          <button onClick={addVoter}>Ajouter électeur</button>
          {!votingOpen && (
            <button onClick={startVoting}>Ouvrir le vote</button>
          )}
        </div>
      )}

      {isVoter && (
        <div className="card">
          <h2>Panel Électeur</h2>
          {hasVoted ? (
            <p>Vous avez déjà voté.</p>
          ) : votingOpen ? (
            <ul>
              {candidates.map(c => (
                <li className="candidate-item" key={c.index}>
                  <span className="candidate-name">{c.name}</span>
                  <span className="candidate-votes">{c.voteCount} votes</span>
                  <button onClick={() => vote(c.index)}>Voter</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Le vote n'est pas encore ouvert.</p>
          )}
        </div>
      )}

      <div className="card">
        <h2>Résultats</h2>
        {winner && (
          <div className="winner-banner">Gagnant actuel : {winner}</div>
        )}
        <ul>
          {candidates.map(c => (
            <li className="candidate-item" key={c.index}>
              <span className="candidate-name">{c.name}</span>
              <span className="candidate-votes">{c.voteCount} votes</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
