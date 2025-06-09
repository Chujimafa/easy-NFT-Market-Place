// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19; 


import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import{SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title NFTMarketPlace
 * @author Mafa
 * @notice An NFT trading platform based on ERC20 token payments, 
 * @dev supporting listing/delisting und buy NFT functionality
 * - only allowed use the ERC20
 */


contract NFTMarketPlace is ReentrancyGuard {



    using SafeERC20 for IERC20;

/////////Storages/////////
    IERC20 public immutable i_paymentToken;
    uint256 public s_listingId=0;


    struct NftInfo {
    address tokenAddress;
    uint256 tokenId;
    uint256 price;
    address seller;
    bool isListed;
}
    mapping(uint256 s_listingId => NftInfo) public ListingIdToNft;
    mapping(address tokenaddress => mapping(uint256 tokenid => uint256 s_listingId )) public TokenToListingId;

/////////Errors/////////

    error NFTMarketPlace_AlreadyListed();
    error NFTMarketPlace_CallerNotAuthorized();
    error NFTMarketPlace_NFTNotExists();
    error NFTMarketPlace_Insufficientfunds();
    error NFTMarketPlace_NFTNotListed();

/////////Events/////////

    event ListNftToMarketSuccess(uint256 indexed listingId, address indexed tokenAddress, 
    uint256 indexed tokenId ,address seller,uint256 price);
    event DelistNftFromMarketing(uint256 listingId, address tokenAddress, uint256 tokenId);
    event BuyNftSuccess(uint256 indexed listingId, address indexed tokenAddress, uint256 indexed tokenId,
    address buyer,address seller,uint256 price);


/////////Constructor/////////

/**
 * @dev Initialize the marketplace with the ERC20 token to be used for payments
 * @param tokenAddress The contract address of the ERC20 token accepted for payments
 * @notice All NFT transactions will use this designated token
 */
    constructor (IERC20 tokenAddress) {
        i_paymentToken = tokenAddress;
}


/////////modifier/////////

    modifier onlyTokenAuthorized(address _tokenAddress, uint256 _tokenId) {
        address ownerNft= IERC721(_tokenAddress).ownerOf(_tokenId);       
        if(msg.sender != ownerNft
        && msg.sender != IERC721(_tokenAddress).getApproved(_tokenId)
        && ! IERC721(_tokenAddress).isApprovedForAll(ownerNft, msg.sender))
         {
            revert NFTMarketPlace_CallerNotAuthorized();
        }
        _;
    }

    modifier nftExistAndAlreadyListed(address tokenaddress, uint256 tokenId) {
        uint256 listingId= TokenToListingId[tokenaddress][tokenId];
        if(IERC721(tokenaddress).ownerOf(tokenId) == address(0)){
        revert NFTMarketPlace_NFTNotExists();
        }
        if(ListingIdToNft[listingId].isListed == true) {
            revert NFTMarketPlace_AlreadyListed();
        }
        _;
    }

    modifier onlyExistAndListedNft(uint256 _listingId,address tokenAddress, uint256 tokenId) {
        if(IERC721(tokenAddress).ownerOf(tokenId) == address(0)){
            revert NFTMarketPlace_NFTNotExists();
        }
        if(ListingIdToNft[_listingId].isListed == false) {
            revert NFTMarketPlace_NFTNotListed();
        }
        _;
    }



////////external & Public functions////////

/**
 * @dev Lists an NFT on the marketplace for sale
 * - Requires caller to be NFT owner or approved operator
 * - Validates that the NFT exists and isn't already listed
 * - Assigns a new listing ID and stores NFT details
 */
    function listNftToMarket(address _tokenAddress, uint256 _tokenId,uint256 _price) external 
    onlyTokenAuthorized(_tokenAddress, _tokenId) nftExistAndAlreadyListed(_tokenAddress, _tokenId) {
        address ownerNft= IERC721(_tokenAddress).ownerOf(_tokenId);
        
        s_listingId++;

        NftInfo memory newNft = NftInfo(_tokenAddress, _tokenId, _price, ownerNft, true); 
        ListingIdToNft[s_listingId] = newNft;
        TokenToListingId[_tokenAddress][_tokenId] = s_listingId;
        emit ListNftToMarketSuccess(s_listingId, _tokenAddress, _tokenId, ownerNft, _price);

    }
    
/**
 * @dev delist an NFT from the marketplace
 * - Requires caller to be NFT owner or approved operator
 * - Validates that the NFT exists and is listed
 * - set isListed to false
 */

    function delistNft(address _tokenAddress, uint256 _tokenId,uint256 _listingId) external 
    onlyTokenAuthorized(_tokenAddress, _tokenId) onlyExistAndListedNft(_listingId, _tokenAddress, _tokenId) {
        ListingIdToNft[_listingId].isListed = false;    
        emit DelistNftFromMarketing (_listingId, _tokenAddress, _tokenId);
    }

/**
 * @dev buy an NFT from the marketplace
 * - Requires the listId is true, and the buyer has enough funds
 * - buyer transfer the ERC20 token to the seller
 * - seller transfer the NFT to the buyer
 * - set the listingId to false
 */
    function buyNft(uint256 _listingId,address tokenaddress, uint256 tokenId) external nonReentrant
    onlyExistAndListedNft(_listingId, tokenaddress, tokenId) {
        address currentOwner= ListingIdToNft[_listingId].seller;
        uint256 price = ListingIdToNft[_listingId].price;
        uint256 balanceOfBuyer = IERC20(i_paymentToken).balanceOf(msg.sender);

        if(getNftPrice(_listingId) > balanceOfBuyer) {
            revert NFTMarketPlace_Insufficientfunds();
        }

        IERC20(i_paymentToken).safeTransferFrom(msg.sender,currentOwner,price);
        IERC721(tokenaddress).safeTransferFrom(currentOwner, msg.sender, tokenId);
        ListingIdToNft[_listingId].isListed = false;
        emit BuyNftSuccess(_listingId, tokenaddress, tokenId, msg.sender, currentOwner, price);

    }


///////////View Function////////// 
    function checkIfListed(uint256 _listingId) public view returns(bool) {
        return ListingIdToNft[_listingId].isListed;       
    }

    function getNftPrice(uint256 _listingId) public view returns(uint256) {
        return ListingIdToNft[_listingId].price;       
    }
    
    


}