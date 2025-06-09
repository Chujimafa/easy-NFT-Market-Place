const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const hre = require("hardhat");

const initialSupply = 1000000n * 10n ** 18n;

module.exports = buildModule("NFTMarketPlace", (m) => {
    const networkName = hre.network.name;

    let PaymentToken;
    let NFTMarketPlace;
    let Nft;

    if (networkName === "localhost") {
        //only deploy TestPaymentToken and TestNft for testing
        PaymentToken = m.contract("TestPaymentToken", [initialSupply]);
        Nft = m.contract("TestNft");
        NFTMarketPlace = m.contract("NFTMarketPlace", [PaymentToken]);
    } else if (networkName === "sepolia") {
        //sepolia use usdc as payment token
        const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; //usdc tokenaddress sepolia 
        NFTMarketPlace = m.contract("NFTMarketPlace", [usdcAddress]);
    }

    return { NFTMarketPlace, PaymentToken, Nft };
});
