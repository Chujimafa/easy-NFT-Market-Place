import React, { useState } from 'react';
import { ethers, isAddress } from 'ethers';
import DappNFTMarketPlaceABI from './DappNFTMarketPlaceABI.json';
import './styles.css';

const NFT_ABI = [
  "function approve(address to, uint256 tokenId) external"
];

const DappNFTMarketplace = () => {
  const [account, setAccount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');

  const MARKETPLACE_ADDRESS = '0xFe0390184ff040CB2e9d7EF9922D67369d794484'; //sepolia 
  //hardhat testnet deploy address: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0


  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    setAccount((await signer.getAddress()).slice(0, 6));
    return signer;
  };

  const approveNFT = async (signer) => {
    if (!isAddress(tokenAddress)) {
      alert('Invalid NFT contract address');
      return;
    }
    if (!tokenId) {
      alert('Please enter tokenId');
      return;
    }
    const nftContract = new ethers.Contract(tokenAddress, NFT_ABI, signer);
    const tx = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
    await tx.wait();
  };

  const listNFT = async () => {
    if (!tokenAddress || !tokenId || !price) {
      alert('Please fill in all fields');
      return;
    }
    const signer = await connectWallet();
    if (!signer) return;
    await approveNFT(signer);
    const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, DappNFTMarketPlaceABI, signer);
    const priceParsed = ethers.parseUnits(price, 18);
    const tx = await marketplace.listNftToMarket(tokenAddress, tokenId, priceParsed);
    await tx.wait();
    alert('NFT listed successfully!');
  };

  const buyNFT = async () => {
    if (!tokenAddress || !tokenId) {
      alert('Please fill in NFT contract address and tokenId');
      return;
    }
    const signer = await connectWallet();
    if (!signer) return;
    const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, DappNFTMarketPlaceABI, signer);
    const listingId = await marketplace.TokenToListingId(tokenAddress, tokenId);
    const tx = await marketplace.buyNft(listingId, tokenAddress, tokenId);
    await tx.wait();
    alert('NFT purchased successfully!');
  };

  const delistNFT = async () => {
    if (!tokenAddress || !tokenId) {
      alert('Please fill in NFT contract address and tokenId');
      return;
    }
    const signer = await connectWallet();
    if (!signer) return;
    const marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, DappNFTMarketPlaceABI, signer);
    const listingId = await marketplace.TokenToListingId(tokenAddress, tokenId);
    const tx = await marketplace.delistNft(listingId, tokenAddress, tokenId);
    await tx.wait();
    alert('NFT delisted successfully!');
  };

  return (
    <div className="nft-marketplace">
      <div className="marketplace-header">
        <h1>NFT Marketplace</h1>
        <p className="marketplace-subheader">ERC20 Payments Only</p>
      </div>

      {!account ? (
        <button className="connect-button" onClick={connectWallet}>
          Connect Wallet
        </button>
      ) : (
        <div className="actions-container">
          <div>
            <input
              className="token-input"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="NFT Contract Address"
            />
            <input
              className="token-input"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Token ID"
            />
            <input
              className="token-input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price (ERC20 tokens)"
            />
          </div>

          <div className="action-buttons">
            <button className="action-button list-button" onClick={listNFT}>
              List NFT
            </button>
            <button className="action-button buy-button" onClick={buyNFT}>
              Buy NFT
            </button>
            <button className="action-button delist-button" onClick={delistNFT}>
              Delist NFT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DappNFTMarketplace;
