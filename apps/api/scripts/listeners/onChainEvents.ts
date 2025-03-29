import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

// Ethers v6 syntax
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const run = async () => {
  console.log("⛓ Listening to blockchain events...");

  const contract = new ethers.Contract(
    process.env.NFT_CONTRACT_ADDRESS!,
    [
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    ],
    provider
  );

  contract.on("Transfer", (from, to, tokenId) => {
    console.log(`NFT Transferred: ${tokenId.toString()} from ${from} to ${to}`);
  });
};

run();