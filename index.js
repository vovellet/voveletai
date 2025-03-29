// ObscuraNet Discord Onboarding Bot
// requirements: npm install discord.js dotenv ethers axios

const { Client, GatewayIntentBits, MessageEmbed, Permissions } = require('discord.js');
const { ethers } = require('ethers');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Bot configuration
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// ObscuraNet API endpoints
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.obscuranet.io';
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;

// Discord channel and role IDs
const CHANNELS = {
  WELCOME: process.env.WELCOME_CHANNEL_ID,
  ANNOUNCEMENTS: process.env.ANNOUNCEMENTS_CHANNEL_ID,
  VERIFICATION: process.env.VERIFICATION_CHANNEL_ID,
  CORE_PLATFORM: process.env.CORE_PLATFORM_CHANNEL_ID,
  Z_ORIGIN: process.env.Z_ORIGIN_CHANNEL_ID,
  TOKEN_SYSTEM: process.env.TOKEN_SYSTEM_CHANNEL_ID,
  NFT_MINTING: process.env.NFT_MINTING_CHANNEL_ID,
  Z_BORSA_SWAP: process.env.Z_BORSA_SWAP_CHANNEL_ID,
  DAO_GOVERNANCE: process.env.DAO_GOVERNANCE_CHANNEL_ID
};

const ROLES = {
  PRIME: process.env.PRIME_ROLE_ID,
  SAGE: process.env.SAGE_ROLE_ID,
  ORIGIN: process.env.ORIGIN_ROLE_ID,
  CITIZEN: process.env.CITIZEN_ROLE_ID,
  PHASE_1: process.env.PHASE_1_ROLE_ID,
  PHASE_2: process.env.PHASE_2_ROLE_ID,
  PHASE_3: process.env.PHASE_3_ROLE_ID,
  VERIFIED: process.env.VERIFIED_ROLE_ID
};

// Collab.Land integration
const COLLAB_LAND_BOT_ID = process.env.COLLAB_LAND_BOT_ID;

// Connect to Discord
client.once('ready', () => {
  console.log(`ObscuraNet Onboarding Bot is online as ${client.user.tag}`);
});

// Listen for Collab.Land verification events
client.on('messageCreate', async (message) => {
  // Skip non-Collab.Land messages
  if (message.author.id !== COLLAB_LAND_BOT_ID) return;
  
  // Look for verification success messages from Collab.Land
  if (message.embeds.length > 0 && 
      message.embeds[0].description && 
      message.embeds[0].description.includes('wallet verified')) {
    
    // Extract wallet address from the message
    const walletAddressMatch = message.embeds[0].description.match(/wallet verified.*?(0x[a-fA-F0-9]{40})/);
    
    if (!walletAddressMatch) return;
    
    const walletAddress = walletAddressMatch[1];
    const userId = message.mentions.users.first()?.id;
    
    if (userId && walletAddress) {
      try {
        await processVerifiedUser(message.guild, userId, walletAddress);
      } catch (error) {
        console.error('Error processing verified user:', error);
        
        // Send error message to user via DM
        const user = await client.users.fetch(userId);
        user.send('There was an error processing your verification. Please contact an admin for assistance.').catch(console.error);
      }
    }
  }
});

// Process a user after wallet verification
async function processVerifiedUser(guild, userId, walletAddress) {
  // 1. Get user data from ObscuraNet API
  const userData = await fetchUserData(walletAddress);
  
  // 2. Assign appropriate roles based on card level
  const member = await guild.members.fetch(userId);
  const verifiedRole = guild.roles.cache.get(ROLES.VERIFIED);
  
  if (verifiedRole) {
    await member.roles.add(verifiedRole);
  }
  
  let cardLevelRole = null;
  let betaPhaseRole = null;
  let betaPhaseText = "";
  let channelsAccess = [];
  
  // Assign card level role
  if (userData) {
    switch (userData.cardLevel) {
      case "PRIME":
        cardLevelRole = guild.roles.cache.get(ROLES.PRIME);
        betaPhaseRole = guild.roles.cache.get(ROLES.PHASE_1);
        betaPhaseText = "**Phase 1: Closed Testing** - You have immediate access to all testing modules!";
        channelsAccess = [CHANNELS.CORE_PLATFORM, CHANNELS.Z_ORIGIN, CHANNELS.TOKEN_SYSTEM, 
                          CHANNELS.NFT_MINTING, CHANNELS.Z_BORSA_SWAP, CHANNELS.DAO_GOVERNANCE];
        break;
      case "SAGE":
        cardLevelRole = guild.roles.cache.get(ROLES.SAGE);
        betaPhaseRole = guild.roles.cache.get(ROLES.PHASE_2);
        betaPhaseText = "**Phase 2: Invite Expansion** - Your access begins in Week 2 of the beta!";
        channelsAccess = [CHANNELS.NFT_MINTING, CHANNELS.Z_BORSA_SWAP];
        break;
      case "ORIGIN":
        cardLevelRole = guild.roles.cache.get(ROLES.ORIGIN);
        betaPhaseRole = guild.roles.cache.get(ROLES.PHASE_3);
        betaPhaseText = "**Phase 3: Public Beta** - Your access begins in Week 3 of the beta!";
        channelsAccess = [CHANNELS.DAO_GOVERNANCE];
        break;
      default:
        cardLevelRole = guild.roles.cache.get(ROLES.CITIZEN);
        betaPhaseText = "You currently don't qualify for beta access. Contribute to earn a higher OBX Card level!";
        break;
    }
    
    // Add appropriate roles
    if (cardLevelRole) await member.roles.add(cardLevelRole);
    if (betaPhaseRole) await member.roles.add(betaPhaseRole);
  }
  
  // 3. Send welcome message with beta eligibility
  const welcomeEmbed = {
    color: 0x5865F2,
    title: '🎉 Welcome to ObscuraNet Beta!',
    description: `<@${userId}>, your wallet (${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}) has been successfully verified!`,
    thumbnail: {
      url: 'https://obscuranet.io/images/logo.png'
    },
    fields: [
      {
        name: '🔰 Your OBX Card Level',
        value: userData ? `**${userData.cardLevel}**` : 'No OBX Card found',
        inline: true
      },
      {
        name: '💯 Z-Score',
        value: userData ? `${userData.totalZScore.toFixed(1)} / 10.0` : 'N/A',
        inline: true
      },
      {
        name: '🧪 Beta Eligibility',
        value: betaPhaseText
      },
      {
        name: '🎁 Beta Rewards',
        value: userData?.cardLevel === 'PRIME' ? '• Beta Tester NFT (Phase 1)\n• 500 OBX Token Airdrop\n• Z-Origin Priority Access' :
               userData?.cardLevel === 'SAGE' ? '• Beta Tester NFT (Phase 2)\n• 300 OBX Token Airdrop\n• Z-Origin Priority Access' :
               userData?.cardLevel === 'ORIGIN' ? '• Beta Tester NFT (Phase 3)\n• 150 OBX Token Airdrop' : 'Contribute to earn rewards!'
      }
    ],
    footer: {
      text: 'ObscuraNet Beta Program',
      icon_url: 'https://obscuranet.io/images/icon.png'
    },
    timestamp: new Date()
  };
  
  try {
    // Send welcome message to verification channel
    const verificationChannel = await client.channels.fetch(CHANNELS.VERIFICATION);
    const welcomeMessage = await verificationChannel.send({ 
      content: `<@${userId}>`,
      embeds: [welcomeEmbed] 
    });
    
    // Add reactions to guide user
    await welcomeMessage.react('✅');
    
    // Send private message to user with specific channel invitations
    if (channelsAccess.length > 0) {
      const channelMentions = channelsAccess.map(channelId => `<#${channelId}>`).join(', ');
      const user = await client.users.fetch(userId);
      
      user.send({
        embeds: [{
          color: 0x5865F2,
          title: '🚀 Your ObscuraNet Beta Access',
          description: `Based on your OBX Card level, you have access to the following testing modules:\n\n${channelMentions}\n\nPlease read the announcements in <#${CHANNELS.ANNOUNCEMENTS}> for the latest updates on the beta program.`,
          fields: [
            {
              name: '📝 Getting Started',
              value: 'Check out the pinned messages in each channel for specific testing instructions and tasks.'
            },
            {
              name: '🐞 Reporting Issues',
              value: 'Use the `!report` command in any channel to submit bug reports or feedback.'
            }
          ]
        }]
      }).catch(console.error);
    }
    
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
}

// Helper function to fetch user data from ObscuraNet API
async function fetchUserData(walletAddress) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Function to check NFT ownership using ethers.js
async function checkNFTOwnership(walletAddress) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      [
        'function balanceOf(address owner) view returns (uint256)',
        'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
        'function tokenURI(uint256 tokenId) view returns (string)'
      ],
      provider
    );
    
    const balance = await nftContract.balanceOf(walletAddress);
    
    if (balance.toNumber() > 0) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, 0);
      const tokenURI = await nftContract.tokenURI(tokenId);
      
      // Fetch metadata from tokenURI (assuming IPFS or HTTP URL)
      let metadata;
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '');
        const response = await axios.get(`https://ipfs.io/ipfs/${ipfsHash}`);
        metadata = response.data;
      } else {
        const response = await axios.get(tokenURI);
        metadata = response.data;
      }
      
      return metadata;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    return null;
  }
}

// Event reactions for verified role
client.on('messageReactionAdd', async (reaction, user) => {
  // Ignore bot reactions
  if (user.bot) return;
  
  // Make sure the reaction is fully fetched
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }
  
  // Check if reaction is on a welcome message and is the checkmark
  if (reaction.emoji.name === '✅' && 
      reaction.message.channel.id === CHANNELS.VERIFICATION &&
      reaction.message.author.id === client.user.id) {
    
    // Check if the message mentions the user who reacted
    if (reaction.message.mentions.users.has(user.id)) {
      // Get the guild and member
      const guild = reaction.message.guild;
      const member = await guild.members.fetch(user.id);
      
      // Check if member has any of the phase roles
      const hasPhase1 = member.roles.cache.has(ROLES.PHASE_1);
      const hasPhase2 = member.roles.cache.has(ROLES.PHASE_2);
      const hasPhase3 = member.roles.cache.has(ROLES.PHASE_3);
      
      // If they have any phase role, send a message to guide them
      if (hasPhase1 || hasPhase2 || hasPhase3) {
        const phaseName = hasPhase1 ? "Phase 1" : hasPhase2 ? "Phase 2" : "Phase 3";
        const channels = hasPhase1 ? 
          `<#${CHANNELS.CORE_PLATFORM}>, <#${CHANNELS.Z_ORIGIN}>, <#${CHANNELS.TOKEN_SYSTEM}>` :
          hasPhase2 ? 
          `<#${CHANNELS.NFT_MINTING}>, <#${CHANNELS.Z_BORSA_SWAP}>` :
          `<#${CHANNELS.DAO_GOVERNANCE}>`;
        
        try {
          await user.send({
            embeds: [{
              color: 0x4CAF50,
              title: `🚀 You're all set for ${phaseName}!`,
              description: `Head over to ${channels} to start your beta testing journey!\n\nMake sure to check the pinned messages in each channel for specific instructions.`,
              footer: {
                text: 'ObscuraNet Beta Program',
                icon_url: 'https://obscuranet.io/images/icon.png'
              }
            }]
          });
        } catch (error) {
          console.error('Error sending DM to user:', error);
        }
      }
    }
  }
});

// Command for bug reporting
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!report')) {
    const reportContent = message.content.slice('!report'.length).trim();
    
    if (reportContent.length < 10) {
      message.reply('Please provide more details for your report (minimum 10 characters).');
      return;
    }
    
    // Create embed for bug report
    const reportEmbed = {
      color: 0xF44336,
      title: '🐞 Bug Report',
      author: {
        name: message.author.tag,
        icon_url: message.author.displayAvatarURL()
      },
      description: reportContent,
      fields: [
        {
          name: 'Channel',
          value: `<#${message.channel.id}>`,
          inline: true
        },
        {
          name: 'Timestamp',
          value: new Date().toISOString(),
          inline: true
        }
      ],
      footer: {
        text: `User ID: ${message.author.id}`
      }
    };
    
    // Forward report to bug-reports channel
    try {
      const bugReportsChannel = await client.channels.fetch(process.env.BUG_REPORTS_CHANNEL_ID);
      await bugReportsChannel.send({ embeds: [reportEmbed] });
      
      // React to original message to confirm receipt
      await message.react('📨');
      await message.reply('Your report has been submitted. Thank you for helping improve ObscuraNet!');
    } catch (error) {
      console.error('Error submitting bug report:', error);
      await message.reply('There was an error submitting your report. Please try again later.');
    }
  }
});

// Help command
client.on('messageCreate', async (message) => {
  if (message.content === '!help') {
    const helpEmbed = {
      color: 0x2196F3,
      title: '📚 ObscuraNet Bot Commands',
      description: 'Here are the available commands:',
      fields: [
        {
          name: '!help',
          value: 'Shows this help message'
        },
        {
          name: '!report [details]',
          value: 'Submit a bug report or feedback'
        },
        {
          name: '!status',
          value: 'Check your current OBX Card level and beta access'
        },
        {
          name: '!schedule',
          value: 'View the beta testing schedule'
        }
      ],
      footer: {
        text: 'For additional help, contact an admin or ask in #help-desk'
      }
    };
    
    await message.reply({ embeds: [helpEmbed] });
  }
});

// Status command to check user's current level and access
client.on('messageCreate', async (message) => {
  if (message.content === '!status') {
    const member = message.member;
    if (!member) return;
    
    const cardLevel = member.roles.cache.has(ROLES.PRIME) ? 'PRIME' :
                      member.roles.cache.has(ROLES.SAGE) ? 'SAGE' :
                      member.roles.cache.has(ROLES.ORIGIN) ? 'ORIGIN' :
                      member.roles.cache.has(ROLES.CITIZEN) ? 'CITIZEN' : 'None';
    
    const betaPhase = member.roles.cache.has(ROLES.PHASE_1) ? 'Phase 1 (Immediate Access)' :
                      member.roles.cache.has(ROLES.PHASE_2) ? 'Phase 2 (Week 2)' :
                      member.roles.cache.has(ROLES.PHASE_3) ? 'Phase 3 (Week 3)' : 'No beta access';
    
    const statusEmbed = {
      color: 0x9C27B0,
      title: '📊 Your ObscuraNet Status',
      thumbnail: {
        url: message.author.displayAvatarURL()
      },
      fields: [
        {
          name: '🔰 OBX Card Level',
          value: cardLevel,
          inline: true
        },
        {
          name: '🧪 Beta Access',
          value: betaPhase,
          inline: true
        },
        {
          name: '🔓 Available Testing Modules',
          value: member.roles.cache.has(ROLES.PHASE_1) ? 'All modules' :
                 member.roles.cache.has(ROLES.PHASE_2) ? 'NFT Minting, Z-Borsa Swap' :
                 member.roles.cache.has(ROLES.PHASE_3) ? 'DAO Governance' : 'None'
        }
      ],
      footer: {
        text: 'To upgrade your access, increase your OBX Card level through contributions'
      }
    };
    
    await message.reply({ embeds: [statusEmbed] });
  }
});

// Login to Discord
client.login(process.env.DISCORD_BOT_TOKEN);

console.log("✅ Bot initialized and waiting for Discord connection...");