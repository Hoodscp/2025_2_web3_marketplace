// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OpenNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event NFTMinted(address indexed minter, uint256 tokenId, string tokenURI);

    constructor() ERC721("OpenArtNFT", "OAN") Ownable(msg.sender) {}

    // 기능 2: 누구나 새로운 NFT를 등록(발행)할 수 있는 기능
    function mintNFT(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit NFTMinted(msg.sender, tokenId, tokenURI);

        return tokenId;
    }
}