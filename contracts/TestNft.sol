// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import{Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestNft
 * @author mafa
 * @notice a simple ERC721 NFT used for testing the NFTMarketplace contract
 * @dev
 * - Compliant with the ERC721 standard
 * - owner can mint NFT
 */

contract TestNft is ERC721, Ownable {

    uint256 public s_tokenId;

    constructor()ERC721("Test NFT", "TN")Ownable(msg.sender) {
        s_tokenId = 0;
    }

    function mint(address to) public onlyOwner {
        s_tokenId++;
        _safeMint(to, s_tokenId);

    }
}