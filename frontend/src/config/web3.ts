import { configureChains, createConfig } from 'wagmi'
import { polygon, polygonMumbai, hardhat } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { infuraProvider } from 'wagmi/providers/infura'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { getDefaultWallets } from '@rainbow-me/rainbowkit'

// Chain configuration
const isDevelopment = import.meta.env.DEV
const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '137')

// Define chains based on environment
export const chains = isDevelopment
  ? [hardhat, polygonMumbai, polygon]
  : [polygon, polygonMumbai]

// Configure providers
const providers = []

// Add Alchemy provider if API key is available
if (import.meta.env.VITE_ALCHEMY_API_KEY) {
  providers.push(
    alchemyProvider({
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
    })
  )
}

// Add Infura provider if API key is available
if (import.meta.env.VITE_INFURA_API_KEY) {
  providers.push(
    infuraProvider({
      apiKey: import.meta.env.VITE_INFURA_API_KEY,
    })
  )
}

// Add custom RPC provider if URL is available
if (import.meta.env.VITE_RPC_URL) {
  providers.push(
    jsonRpcProvider({
      rpc: (chain) => ({
        http: import.meta.env.VITE_RPC_URL,
      }),
    })
  )
}

// Always add public provider as fallback
providers.push(publicProvider())

// Configure chains with providers
const { publicClient, webSocketPublicClient } = configureChains(
  chains,
  providers
)

// Configure wallets
const { connectors } = getDefaultWallets({
  appName: 'Ludo Masters Web3',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains,
})

// Create wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

// Contract addresses
export const CONTRACT_ADDRESSES = {
  LUDO_TOKEN: import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  LUDO_NFT: import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  STAKING_POOL: import.meta.env.VITE_STAKING_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  TOURNAMENT: import.meta.env.VITE_TOURNAMENT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  MARKETPLACE: import.meta.env.VITE_MARKETPLACE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
} as const

// Token configuration
export const TOKENS = {
  LUDO: {
    symbol: 'LUDO',
    name: 'Ludo Masters Token',
    decimals: 18,
    address: CONTRACT_ADDRESSES.LUDO_TOKEN,
    icon: '/tokens/ludo.png',
  },
  MATIC: {
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    address: '0x0000000000000000000000000000000000001010',
    icon: '/tokens/matic.png',
  },
} as const

// Network configuration
export const NETWORK_CONFIG = {
  [polygon.id]: {
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  [polygonMumbai.id]: {
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  [hardhat.id]: {
    name: 'Hardhat Local',
    rpcUrl: 'http://localhost:8545',
    blockExplorer: 'http://localhost:8545',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const

// Gas configuration
export const GAS_LIMITS = {
  TRANSFER: 21000,
  TOKEN_TRANSFER: 65000,
  NFT_TRANSFER: 85000,
  STAKE: 120000,
  UNSTAKE: 100000,
  CLAIM_REWARDS: 80000,
  MINT_NFT: 150000,
  TOURNAMENT_ENTRY: 100000,
} as const

// Transaction configuration
export const TX_CONFIG = {
  confirmations: 1,
  timeout: 300000, // 5 minutes
  retries: 3,
  gasMultiplier: 1.1,
} as const

// Utility functions
export const getChainById = (chainId: number) => {
  return chains.find(chain => chain.id === chainId)
}

export const getNetworkConfig = (chainId: number) => {
  return NETWORK_CONFIG[chainId as keyof typeof NETWORK_CONFIG]
}

export const isChainSupported = (chainId: number) => {
  return chains.some(chain => chain.id === chainId)
}

export const getBlockExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx') => {
  const config = getNetworkConfig(chainId)
  if (!config) return ''
  
  return `${config.blockExplorer}/${type}/${hash}`
}

export const formatTokenAmount = (amount: string | number, decimals: number = 18) => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return (value / Math.pow(10, decimals)).toFixed(4)
}

export const parseTokenAmount = (amount: string | number, decimals: number = 18) => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return (value * Math.pow(10, decimals)).toString()
}

// Contract ABIs (simplified - in production these would be imported from generated files)
export const ABIS = {
  ERC20: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
  ],
  ERC721: [
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function approve(address to, uint256 tokenId)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function setApprovalForAll(address operator, bool approved)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function tokenURI(uint256 tokenId) view returns (string)',
  ],
  LUDO_TOKEN: [
    ...ABIS.ERC20,
    'function mint(address to, uint256 amount)',
    'function burn(uint256 amount)',
    'function burnFrom(address account, uint256 amount)',
  ],
  LUDO_NFT: [
    ...ABIS.ERC721,
    'function mint(address to, string memory tokenURI) returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function tokenByIndex(uint256 index) view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  ],
  STAKING_POOL: [
    'function stake(uint256 amount)',
    'function unstake(uint256 amount)',
    'function claimRewards()',
    'function getStakedAmount(address user) view returns (uint256)',
    'function getPendingRewards(address user) view returns (uint256)',
    'function getTotalStaked() view returns (uint256)',
    'function getAPY() view returns (uint256)',
  ],
  TOURNAMENT: [
    'function enterTournament(uint256 tournamentId) payable',
    'function createTournament(uint256 entryFee, uint256 prizePool, uint256 maxParticipants)',
    'function getTournament(uint256 tournamentId) view returns (tuple)',
    'function getUserTournaments(address user) view returns (uint256[])',
  ],
} as const

// Error messages
export const WEB3_ERRORS = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WRONG_NETWORK: 'Please switch to the correct network',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_REJECTED: 'Transaction was rejected by user',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  CONTRACT_ERROR: 'Smart contract error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection',
} as const

export default wagmiConfig