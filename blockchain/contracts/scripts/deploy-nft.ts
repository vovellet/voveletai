import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ContributionNFT
  const ContributionNFT = await ethers.getContractFactory("ContributionNFT");
  
  // Define parameters
  const name = "ObscuraNet Contributions";
  const symbol = "OBXNFT";
  const baseURI = ""; // Empty as we'll be using IPFS URIs directly
  
  // Deploy contract
  const nft = await ContributionNFT.deploy(name, symbol, baseURI);
  await nft.deployed();
  
  console.log("ContributionNFT deployed to:", nft.address);
  
  // Create deployment info
  const deploymentInfo = {
    contractName: "ContributionNFT",
    address: nft.address,
    name,
    symbol,
    block: nft.deployTransaction.blockNumber,
    timestamp: Math.floor(Date.now() / 1000),
    network: network.name,
    chainId: network.config.chainId,
    abi: JSON.parse(nft.interface.format("json") as string),
  };
  
  // Create deployed directory if it doesn't exist
  const deployedDir = path.join(__dirname, "../deployed");
  if (!fs.existsSync(deployedDir)) {
    fs.mkdirSync(deployedDir);
  }
  
  // Write deployment info to file
  const deploymentPath = path.join(deployedDir, "nft.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment info saved to ${deploymentPath}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});