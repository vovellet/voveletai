import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  contractName: string;
  address: string;
  name: string;
  symbol: string;
  owner: string;
  projectId: string;
  totalSupply: string;
  block: number;
  timestamp: number;
  network: string;
  chainId: number;
  txHash: string;
  abi: any[];
}

/**
 * Deploys a new Project Token contract
 * @param name Token name
 * @param symbol Token symbol
 * @param owner Address of the project owner (who receives the tokens)
 * @param totalSupply Total supply of tokens to mint
 * @param projectId ID of the project in the ObscuraNet system
 */
export async function deployProjectToken(
  name: string,
  symbol: string,
  owner: string,
  totalSupply: string,
  projectId: string
): Promise<DeploymentInfo> {
  console.log(`Deploying Project Token for ${name} (${symbol})`);
  console.log(`Owner: ${owner}`);
  console.log(`Total Supply: ${totalSupply}`);
  console.log(`Project ID: ${projectId}`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the network info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (${network.chainId})`);

  // Convert total supply to wei (18 decimals)
  const totalSupplyWei = ethers.utils.parseEther(totalSupply);

  // Deploy the token contract
  const ProjectToken = await ethers.getContractFactory("ProjectToken");
  const token = await ProjectToken.deploy(
    name, 
    symbol, 
    owner, 
    totalSupplyWei,
    projectId
  );

  // Wait for the contract to be mined
  await token.deployed();
  console.log(`${symbol} token deployed to:`, token.address);

  // Get the block info
  const receipt = await token.deployTransaction.wait();
  const block = await ethers.provider.getBlock(receipt.blockNumber);

  // Create deployment info
  const deploymentInfo: DeploymentInfo = {
    contractName: "ProjectToken",
    address: token.address,
    name,
    symbol,
    owner,
    projectId,
    totalSupply: totalSupplyWei.toString(),
    block: receipt.blockNumber,
    timestamp: block.timestamp,
    network: network.name,
    chainId: network.chainId,
    txHash: token.deployTransaction.hash,
    abi: JSON.parse(ProjectToken.interface.format("json") as string),
  };

  // Create deployed directory if it doesn't exist
  const deployedDir = path.join(__dirname, "../deployed");
  if (!fs.existsSync(deployedDir)) {
    fs.mkdirSync(deployedDir);
  }

  // Write deployment info to file
  const deploymentPath = path.join(deployedDir, `${projectId}.json`);
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`Deployment info saved to ${deploymentPath}`);
  return deploymentInfo;
}

// Allow running this script directly using ts-node
if (require.main === module) {
  const [name, symbol, owner, totalSupply, projectId] = process.argv.slice(2);
  
  if (!name || !symbol || !owner || !totalSupply || !projectId) {
    console.error("Missing arguments. Usage: ts-node deployProjectToken.ts <name> <symbol> <owner> <totalSupply> <projectId>");
    process.exit(1);
  }
  
  deployProjectToken(name, symbol, owner, totalSupply, projectId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}