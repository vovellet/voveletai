// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OBXToken
 * @dev ERC20 token for the ObscuraNet platform
 */
contract OBXToken is ERC20, ERC20Burnable, Ownable {
    // Maximum supply cap
    uint256 public immutable CAP;
    
    // Mapping to store minters who can create new tokens
    mapping(address => bool) public minters;

    // Events
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);

    /**
     * @dev Constructor that gives the msg.sender all existing tokens.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 cap
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(cap > 0, "OBXToken: cap is 0");
        require(initialSupply <= cap, "OBXToken: initial supply exceeds cap");
        
        CAP = cap;
        
        // Add deployer as a minter
        minters[msg.sender] = true;
        emit MinterAdded(msg.sender);
        
        // Mint initial supply to the deployer
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    /**
     * @dev Modifier that checks if the caller is a minter
     */
    modifier onlyMinter() {
        require(minters[msg.sender], "OBXToken: caller is not a minter");
        _;
    }

    /**
     * @dev Adds a new minter who can mint tokens
     * @param account Address to add as a minter
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "OBXToken: minter is the zero address");
        minters[account] = true;
        emit MinterAdded(account);
    }

    /**
     * @dev Removes a minter
     * @param account Address to remove as a minter
     */
    function removeMinter(address account) external onlyOwner {
        minters[account] = false;
        emit MinterRemoved(account);
    }

    /**
     * @dev Creates `amount` new tokens for `to`.
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= CAP, "OBXToken: cap exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() external view returns (uint256) {
        return CAP;
    }
}
