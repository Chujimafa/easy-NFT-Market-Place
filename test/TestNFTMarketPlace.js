const { ethers } = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


describe("NFTMarketPlace", function () {
    const initialSupply = 1000000n * 10n ** 18n;

    async function deployNFTMarktPlace() {
        const [owner, user1, user2] = await ethers.getSigners();

        //deploy TestPaymentToken
        const TestPaymentTokenFactory = await ethers.getContractFactory("TestPaymentToken");
        const testPaymentToken = await TestPaymentTokenFactory.connect(owner).deploy(initialSupply);
        await testPaymentToken.waitForDeployment();
        const paymentTokenAddress = await testPaymentToken.getAddress();

        //deploy NFTMarketPlace
        const NFTMarketPlaceFactory = await ethers.getContractFactory("NFTMarketPlace");
        const nftMarketPlace = await NFTMarketPlaceFactory.connect(owner).deploy(paymentTokenAddress);
        await nftMarketPlace.waitForDeployment();
        const nftMarketPlaceAddress = await nftMarketPlace.getAddress();


        //deploy TestNft
        const TestNftFactory = await ethers.getContractFactory("TestNft");
        const testNft = await TestNftFactory.connect(owner).deploy();
        await testNft.waitForDeployment();
        const testNftAddress = await testNft.getAddress();

        return {
            nftMarketPlace, testNft, testPaymentToken, paymentTokenAddress,
            nftMarketPlaceAddress, testNftAddress, owner, user1, user2
        };

    }


    let nftMarketPlace, testNft, testPaymentToken, paymentTokenAddress;
    let nftMarketPlaceAddress, testNftAddress, owner, user1, user2;


    beforeEach(async function () {
        ({
            nftMarketPlace, testNft, testPaymentToken, paymentTokenAddress,
            nftMarketPlaceAddress, testNftAddress, owner, user1, user2
        } = await loadFixture(deployNFTMarktPlace));
        await testNft.connect(owner).mint(owner);//owner owns tokenId:1
        await testNft.connect(owner).mint(user1);//user1 owns tokenId:2
    });


    describe("Deployment", function () {
        it("should deploy all contracts successfully", async function () {

            expect(paymentTokenAddress).to.properAddress;
            expect(nftMarketPlaceAddress).to.properAddress;
            expect(testNftAddress).to.properAddress;

            const totalSupply = await testPaymentToken.totalSupply();
            expect(totalSupply).to.equal(initialSupply);

        });

    });

    describe("listNftToMarket", function () {

        it("should success listing", async function () {
            const preis = 10;
            //s_listingId=1
            const result = await nftMarketPlace.connect(user1).listNftToMarket(testNftAddress, 2, preis);

            console.log(await nftMarketPlace.checkIfListed(1));
            console.log(await nftMarketPlace.getNftPrice(1));


            expect(await nftMarketPlace.checkIfListed(1)).to.be.true;
            expect(await nftMarketPlace.getNftPrice(1)).to.equal(preis);
            expect(result).to.emit(nftMarketPlace, "ListNftToMarketSuccess").withArgs(1, testNftAddress, 2, user1, preis);
        })

        it("only authorized user can list nft", async function () {
            const preis = 10;
            await expect(nftMarketPlace.connect(user1).listNftToMarket(testNftAddress, 1, preis)
            ).to.be.revertedWithCustomError(nftMarketPlace, "NFTMarketPlace_CallerNotAuthorized");

        })

        it("can only list nft once", async function () {
            const preis = 10;
            await nftMarketPlace.connect(owner).listNftToMarket(testNftAddress, 1, preis);
            await expect(nftMarketPlace.connect(owner).listNftToMarket(testNftAddress, 1, preis)
            ).to.be.revertedWithCustomError(nftMarketPlace, "NFTMarketPlace_AlreadyListed");
        })

    });

    describe("delistNft", function () {
        it("success delisting NFT", async function () {
            const preis = 10;
            await nftMarketPlace.connect(owner).listNftToMarket(testNftAddress, 1, preis);
            const result = await nftMarketPlace.connect(owner).delistNft(testNftAddress, 1, 1);
            expect(await nftMarketPlace.checkIfListed(1)).to.be.false;
            expect(result).to.emit(nftMarketPlace, "DelistNftFromMarketing").withArgs(1, testNftAddress, 1);
        }
        )

        it("should revert if nft is not exist", async function () {
            const preis = 10;
            const tokenId = 3;
            const listingId = 1;
            await nftMarketPlace.connect(owner).listNftToMarket(testNftAddress, listingId, preis);
            await expect(nftMarketPlace.connect(owner).delistNft(testNftAddress, tokenId, 1)
            ).to.be.reverted;
        })

    })

    describe("buyNft", function () {
        it("success buy NFT", async function () {
            const preis = 10;
            const tokenId = 2;
            const listingId = 1;
            await testNft.connect(user1).approve(nftMarketPlaceAddress, tokenId);
            await nftMarketPlace.connect(user1).listNftToMarket(testNftAddress, tokenId, preis);

            await testPaymentToken.connect(owner).approve(nftMarketPlaceAddress, preis);
            await nftMarketPlace.connect(owner).buyNft(listingId, testNftAddress, tokenId);
            expect(await nftMarketPlace.checkIfListed(1)).to.be.false;

            const newOwnerOfNft = await testNft.ownerOf(tokenId);
            expect(newOwnerOfNft).to.equal(owner);
        })

        it("shoudl fail when it is not enough payment token", async function () {
            const preis = 10;
            const tokenId = 1;
            const listingId = 1;
            await testNft.connect(owner).approve(nftMarketPlaceAddress, tokenId);
            await nftMarketPlace.connect(owner).listNftToMarket(testNftAddress, tokenId, preis);

            await testPaymentToken.connect(user1).approve(nftMarketPlaceAddress, preis);

            await expect(nftMarketPlace.connect(user1).buyNft(listingId, testNftAddress, tokenId)
            ).to.be.revertedWithCustomError(nftMarketPlace, "NFTMarketPlace_Insufficientfunds");
        });

    });
})