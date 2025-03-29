// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProjectToken
 * @dev ERC20 token for Z-Origin projects on the ObscuraNet platform
 */
contract ProjectToken is ERC20, ERC20Burnable, Ownable {
    // Project ID from ObscuraNet
    string public projectId;
    
    // Total supply cap (immutable)
    uint256 public immutable CAP;
    
    // Deployment timestamp
    uint256 public deployedAt;
    
    /**
     * @dev Constructor that mints the full token supply to the project owner
     */
    constructor(
        string memory name,
        string memory symbol,
        address owner,
        uint256 totalSupply,
        string memory _projectId
    ) ERC20(name, symbol) Ownable(owner) {
        CAP = totalSupply;
        projectId = _projectId;
        deployedAt = block.timestamp;
        
        // Mint the full token supply to the owner
        _mint(owner, totalSupply);
    }
    
    /**
     * @dev Returns the cap on the token's total supply
     */
    function cap() external view returns (uint256) {
        return CAP;
    }
    
    /**
     * @dev Allows the token owner to mint additional tokens up to the cap
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= CAP, "ProjectToken: cap exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Returns the token metadata in JSON format
     */
    function tokenMetadata() external view returns (string memory) {
        return string(
            abi.encodePacked(
                '{"name":"', name(), '",',
                '"symbol":"', symbol(), '",',
                '"projectId":"', projectId, '",',
                '"owner":"', Strings.toHexString(uint256(uint160(owner())), 20), '",',
                '"totalSupply":"', Strings.toString(totalSupply()), '",',
                '"cap":"', Strings.toString(CAP), '",',
                '"deployedAt":"', Strings.toString(deployedAt), '"}'
            )
        );
    }
}