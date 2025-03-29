import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const name = "ObscuraNet Token";
  const symbol = "OBX";
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens
  const cap = ethers.parseEther("100000000"); // 100 million tokens cap

  const OBXToken = await ethers.getContractFactory("OBXToken");
  const obxToken = await OBXToken.deploy(name, symbol, initialSupply, cap);

  await obxToken.waitForDeployment();

  const contractAddress = await obxToken.getAddress();
  console.log("OBXToken deployed to:", contractAddress);

  // Get the ABI from the compiled contract
  const artifact = require("../artifacts/contracts/OBXToken.sol/OBXToken.json");
  
  // Create deployment info
  const deploymentInfo = {
    network: process.env.HARDHAT_NETWORK || "development",
    contractAddress,
    name,
    symbol,
    initialSupply: initialSupply.toString(),
    cap: cap.toString(),
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
    deployerAddress: deployer.address,
    chainId: await obxToken.runner.provider.getNetwork().then(n => n.chainId)
  };

  // Create deployed directory if it doesn't exist
  const deployedDir = path.join(__dirname, "../deployed");
  if (!fs.existsSync(deployedDir)) {
    fs.mkdirSync(deployedDir, { recursive: true });
  }

  // Write deployment info to file
  const deploymentPath = path.join(deployedDir, "obx.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`Deployment info saved to ${deploymentPath}`);
  
  // Write a simple contract info file for the frontend to use
  const contractInfo = {
    contractAddress,
    chainId: deploymentInfo.chainId,
    abi: artifact.abi
  };
  
  const contractInfoPath = path.join(deployedDir, "contract-info.json");
  fs.writeFileSync(
    contractInfoPath,
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log(`Contract info for frontend saved to ${contractInfoPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
