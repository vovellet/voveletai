// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ContributionNFT
 * @dev ERC721 token for representing ObscuraNet contributions as NFTs
 */
contract ContributionNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // Mapping to store minters who can create new tokens
    mapping(address => bool) public minters;
    
    // Optional base URI for token metadata
    string private _baseTokenURI;
    
    // Mapping from contribution ID to token ID
    mapping(string => uint256) private _contributionToTokenId;
    
    // Mapping from token ID to contribution ID
    mapping(uint256 => string) private _tokenIdToContribution;
    
    // Events
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event ContributionMinted(string contributionId, uint256 tokenId, address owner);

    /**
     * @dev Constructor
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        
        // Add deployer as a minter
        minters[msg.sender] = true;
        emit MinterAdded(msg.sender);
    }
    
    /**
     * @dev Modifier that checks if the caller is a minter
     */
    modifier onlyMinter() {
        require(minters[msg.sender], "ContributionNFT: caller is not a minter");
        _;
    }
    
    /**
     * @dev Adds a new minter who can mint tokens
     * @param account Address to add as a minter
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "ContributionNFT: minter is the zero address");
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
     * @dev Sets the base URI for all token metadata
     * @param baseTokenURI The new base URI
     */
    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Mints a new token representing a contribution
     * @param to The address to mint the token to
     * @param contributionId The ID of the contribution in the ObscuraNet system
     * @param tokenURI The URI for the token metadata
     * @return The new token ID
     */
    function mint(
        address to, 
        string memory contributionId,
        string memory tokenURI
    ) external onlyMinter returns (uint256) {
        // Check if contribution ID has already been minted
        require(_contributionToTokenId[contributionId] == 0, "ContributionNFT: contribution already minted");
        
        // Get the next token ID
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint the token
        _safeMint(to, tokenId);
        
        // Set the token URI
        _setTokenURI(tokenId, tokenURI);
        
        // Store the contribution ID mapping
        _contributionToTokenId[contributionId] = tokenId;
        _tokenIdToContribution[tokenId] = contributionId;
        
        // Emit event
        emit ContributionMinted(contributionId, tokenId, to);
        
        return tokenId;
    }
    
    /**
     * @dev Get the token ID for a contribution
     * @param contributionId The ID of the contribution
     * @return The token ID, or 0 if the contribution has not been minted
     */
    function getTokenIdForContribution(string memory contributionId) external view returns (uint256) {
        return _contributionToTokenId[contributionId];
    }
    
    /**
     * @dev Get the contribution ID for a token
     * @param tokenId The token ID
     * @return The contribution ID
     */
    function getContributionIdForToken(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "ContributionNFT: query for nonexistent token");
        return _tokenIdToContribution[tokenId];
    }
    
    /**
     * @dev Check if a contribution has been minted
     * @param contributionId The ID of the contribution
     * @return True if the contribution has been minted, false otherwise
     */
    function isContributionMinted(string memory contributionId) external view returns (bool) {
        return _contributionToTokenId[contributionId] != 0;
    }
    
    // The following functions are overrides required by Solidity
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}