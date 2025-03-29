import { expect } from "chai";
import { ethers } from "hardhat";
import { OBXToken } from "../typechain-types";

describe("OBXToken", function () {
  let obxToken: OBXToken;
  let owner: any;
  let addr1: any;
  let addr2: any;

  const name = "ObscuraNet Token";
  const symbol = "OBX";
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
  const cap = ethers.parseEther("100000000"); // 100 million tokens cap

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const OBXToken = await ethers.getContractFactory("OBXToken");
    obxToken = await OBXToken.deploy(name, symbol, initialSupply, cap);
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await obxToken.name()).to.equal(name);
      expect(await obxToken.symbol()).to.equal(symbol);
    });

    it("Should assign the initial supply to the owner", async function () {
      const ownerBalance = await obxToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should set the cap correctly", async function () {
      expect(await obxToken.cap()).to.equal(cap);
    });

    it("Should set the owner as a minter", async function () {
      expect(await obxToken.minters(owner.address)).to.be.true;
    });
  });

  describe("Minter Management", function () {
    it("Should allow the owner to add a minter", async function () {
      await obxToken.addMinter(addr1.address);
      expect(await obxToken.minters(addr1.address)).to.be.true;
    });

    it("Should allow the owner to remove a minter", async function () {
      await obxToken.addMinter(addr1.address);
      await obxToken.removeMinter(addr1.address);
      expect(await obxToken.minters(addr1.address)).to.be.false;
    });

    it("Should emit MinterAdded event when adding a minter", async function () {
      await expect(obxToken.addMinter(addr1.address))
        .to.emit(obxToken, "MinterAdded")
        .withArgs(addr1.address);
    });

    it("Should fail if non-owner tries to add a minter", async function () {
      await expect(obxToken.connect(addr1).addMinter(addr2.address))
        .to.be.revertedWithCustomError(obxToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token Minting", function () {
    beforeEach(async function () {
      await obxToken.addMinter(addr1.address);
    });

    it("Should allow a minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await obxToken.connect(addr1).mint(addr2.address, mintAmount);
      expect(await obxToken.balanceOf(addr2.address)).to.equal(mintAmount);
    });

    it("Should fail if non-minter tries to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(obxToken.connect(addr2).mint(addr2.address, mintAmount))
        .to.be.revertedWith("OBXToken: caller is not a minter");
    });

    it("Should fail if minting would exceed the cap", async function () {
      const exceedAmount = cap.sub(initialSupply).add(1);
      await expect(obxToken.mint(addr1.address, exceedAmount))
        .to.be.revertedWith("OBXToken: cap exceeded");
    });
  });

  describe("Token Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("100");
      await obxToken.transfer(addr1.address, transferAmount);
      
      const addr1Balance = await obxToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      await obxToken.connect(addr1).transfer(addr2.address, transferAmount);
      const addr2Balance = await obxToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await obxToken.balanceOf(owner.address);
      await expect(obxToken.connect(addr1).transfer(owner.address, 1))
        .to.be.revertedWith("ERC20: transfer amount exceeds balance");
      
      // Owner balance shouldn't have changed
      expect(await obxToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Token Burning", function () {
    it("Should allow token burning", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialSupply = await obxToken.totalSupply();
      
      await obxToken.burn(burnAmount);
      
      const finalSupply = await obxToken.totalSupply();
      expect(finalSupply).to.equal(initialSupply.sub(burnAmount));
    });
  });
});
