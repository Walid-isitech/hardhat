// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/**
 * @title SimpleStorage
 * @notice Contrat de démonstration : stockage d'une valeur uint256
 * @dev Illustre les concepts fondamentaux de Solidity :
 *      variables d'état, visibilité, events, modifiers, constructor
 */
contract SimpleStorage {

    // --- Variables d'état ---

    /// @notice Adresse du déployeur — seul autorisé à écrire
    address public owner;

    /// @notice La valeur stockée sur la blockchain
    uint256 private storedValue;

    /// @notice Compteur du nombre total de modifications
    uint256 public updateCount;

    // --- Events ---

    /// @notice Emis à chaque modification de la valeur stockée
    /// @param oldValue Ancienne valeur
    /// @param newValue Nouvelle valeur
    /// @param updatedBy Adresse qui a effectué la modification
    event ValueUpdated(
        uint256 indexed oldValue,
        uint256 newValue,
        address indexed updatedBy
    );

    // --- Errors ---

    /// @notice Erreur levée si l'appelant n'est pas le owner
    error NotOwner(address caller, address owner);

    // --- Modifiers ---

    /// @dev Restreint l'accès au owner du contrat
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner(msg.sender, owner);
        }
        _;
    }

    // --- Constructor ---

    /// @notice Initialise le contrat avec le déployeur comme owner
    constructor() {
        owner = msg.sender;
        storedValue = 0;
        updateCount = 0;
    }

    // --- Fonctions d'écriture ---

    /**
     * @notice Modifie la valeur stockée
     * @dev Seul le owner peut appeler cette fonction
     * @param newValue La nouvelle valeur à stocker
     */
    function store(uint256 newValue) external onlyOwner {
        uint256 oldValue = storedValue;
        storedValue = newValue;
        updateCount += 1;
        emit ValueUpdated(oldValue, newValue, msg.sender);
    }

    // --- Fonctions de lecture ---

    /**
     * @notice Retourne la valeur actuellement stockée
     * @return La valeur uint256 stockée
     */
    function retrieve() external view returns (uint256) {
        return storedValue;
    }

    /**
     * @notice Retourne un résumé de l'état du contrat
     * @return _value La valeur stockée
     * @return _updateCount Nombre de modifications
     * @return _owner Adresse du owner
     */
    function getState() external view returns (
        uint256 _value,
        uint256 _updateCount,
        address _owner
    ) {
        return (storedValue, updateCount, owner);
    }
}