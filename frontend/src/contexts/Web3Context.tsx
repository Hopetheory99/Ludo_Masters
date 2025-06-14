import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAccount, useBalance, useNetwork, useSwitchNetwork } from 'wagmi'
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit'
import toast from 'react-hot-toast'

// Types
import type { TokenBalance, NFTAsset, StakingPool, Transaction } from '../types'

// Config
import { CONTRACT_ADDRESSES, TOKENS, isChainSupported } from '../config/web3'

// Utils
import { web3API } from '../utils/api'

interface Web3ContextType {
  // Connection state
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  isCorrectNetwork: boolean
  
  // Balances
  nativeBalance: string
  tokenBalances: TokenBalance[]
  nftAssets: NFTAsset[]
  
  // Loading states
  isLoadingBalances: boolean
  isLoadingNFTs: boolean
  
  // Actions
  connectWallet: () => void
  disconnectWallet: () => void
  switchToCorrectNetwork: () => void
  openAccountModal: () => void
  openChainModal: () => void
  
  // Token operations
  refreshBalances: () => Promise<void>
  transferToken: (to: string, amount: string, tokenAddress?: string) => Promise<boolean>
  approveToken: (spender: string, amount: string, tokenAddress: string) => Promise<boolean>
  
  // NFT operations
  refreshNFTs: () => Promise<void>
  transferNFT: (to: string, tokenId: string, contractAddress: string) => Promise<boolean>
  
  // Staking operations
  stake: (poolId: string, amount: string) => Promise<boolean>
  unstake: (poolId: string, amount: string) => Promise<boolean>
  claimRewards: (poolId: string) => Promise<boolean>
  
  // Transaction history
  transactions: Transaction[]
  refreshTransactions: () => Promise<void>
}

// Create context
const Web3Context = createContext<Web3ContextType | undefined>(undefined)

// Web3 provider props
interface Web3ProviderProps {
  children: React.ReactNode
}

// Web3 Provider Component
export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { openChainModal } = useChainModal()

  // Balance data
  const { data: nativeBalanceData } = useBalance({
    address,
    watch: true,
  })

  // State
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [nftAssets, setNftAssets] = useState<NFTAsset[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  // Computed values
  const chainId = chain?.id
  const isCorrectNetwork = chainId ? isChainSupported(chainId) : false
  const nativeBalance = nativeBalanceData?.formatted || '0'

  // Connect wallet
  const connectWallet = useCallback(() => {
    if (openConnectModal) {
      openConnectModal()
    }
  }, [openConnectModal])

  // Disconnect wallet (handled by wagmi)
  const disconnectWallet = useCallback(() => {
    // Wagmi handles disconnection through useDisconnect hook
    // This is mainly for UI consistency
  }, [])

  // Switch to correct network
  const switchToCorrectNetwork = useCallback(() => {
    if (switchNetwork && !isCorrectNetwork) {
      switchNetwork(137) // Polygon mainnet
    } else if (openChainModal) {
      openChainModal()
    }
  }, [switchNetwork, isCorrectNetwork, openChainModal])

  // Refresh token balances
  const refreshBalances = useCallback(async () => {
    if (!address || !isConnected) return

    try {
      setIsLoadingBalances(true)
      const response = await web3API.getTokenBalances(address)
      
      if (response.success && response.data) {
        setTokenBalances(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error)
      toast.error('Failed to load token balances')
    } finally {
      setIsLoadingBalances(false)
    }
  }, [address, isConnected])

  // Refresh NFTs
  const refreshNFTs = useCallback(async () => {
    if (!address || !isConnected) return

    try {
      setIsLoadingNFTs(true)
      const response = await web3API.getNFTs(address)
      
      if (response.success && response.data) {
        setNftAssets(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh NFTs:', error)
      toast.error('Failed to load NFTs')
    } finally {
      setIsLoadingNFTs(false)
    }
  }, [address, isConnected])

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    if (!address || !isConnected) return

    try {
      const response = await web3API.getTransactions(address)
      
      if (response.success && response.data) {
        setTransactions(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
    }
  }, [address, isConnected])

  // Transfer token
  const transferToken = useCallback(async (
    to: string, 
    amount: string, 
    tokenAddress?: string
  ): Promise<boolean> => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet')
      return false
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network')
      return false
    }

    try {
      const response = await web3API.transferToken({
        from: address,
        to,
        amount,
        tokenAddress: tokenAddress || CONTRACT_ADDRESSES.LUDO_TOKEN,
      })

      if (response.success) {
        toast.success('Transfer initiated')
        await refreshBalances()
        await refreshTransactions()
        return true
      } else {
        toast.error(response.message || 'Transfer failed')
        return false
      }
    } catch (error: any) {
      console.error('Transfer error:', error)
      toast.error(error.message || 'Transfer failed')
      return false
    }
  }, [address, isConnected, isCorrectNetwork, refreshBalances, refreshTransactions])

  // Approve token
  const approveToken = useCallback(async (
    spender: string,
    amount: string,
    tokenAddress: string
  ): Promise<boolean> => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet')
      return false
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network')
      return false
    }

    try {
      const response = await web3API.approveToken({
        owner: address,
        spender,
        amount,
        tokenAddress,
      })

      if (response.success) {
        toast.success('Approval successful')
        return true
      } else {
        toast.error(response.message || 'Approval failed')
        return false
      }
    } catch (error: any) {
      console.error('Approval error:', error)
      toast.error(error.message || 'Approval failed')
      return false
    }
  }, [address, isConnected, isCorrectNetwork])

  // Transfer NFT
  const transferNFT = useCallback(async (
    to: string,
    tokenId: string,
    contractAddress: string
  ): Promise<boolean> => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet')
      return false
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network')
      return false
    }

    try {
      const response = await web3API.transferNFT({
        from: address,
        to,
        tokenId,
        contractAddress,
      })

      if (response.success) {
        toast.success('NFT transfer initiated')
        await refreshNFTs()
        await refreshTransactions()
        return true
      } else {
        toast.error(response.message || 'NFT transfer failed')
        return false
      }
    } catch (error: any) {
      console.error('NFT transfer error:', error)
      toast.error(error.message || 'NFT transfer failed')
      return false
    }
  }, [address, isConnected, isCorrectNetwork, refreshNFTs, refreshTransactions])

  // Stake tokens
  const stake = useCallback(async (poolId: string, amount: string): Promise<boolean> => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet')
      return false
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network')
      return false
    }

    try {
      const response = await web3API.stake({
        user: address,
        poolId,
        amount,
      })

      if (response.success) {
        toast.success('Staking successful')
        await refreshBalances()
        await refreshTransactions()
        return true
      } else {
        toast.error(response.message || 'Staking failed')
        return false
      }
    } catch (error: any) {
      console.error('Staking error:', error)
      toast.error(error.message || 'Staking failed')
      return false
    }
  }, [address, isConnected, isCorrectNetwork, refreshBalances, refreshTransactions])

  // Unstake tokens
  const unstake = useCallback(async (poolId: string, amount: string): Promise<boolean> => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet')
      return false
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network')
      return false
    }

    try {
      const response = await web3API.unstake({
        user: address,
        poolId,
        amount,
      })

      if (response.success) {
        toast.success('Unstaking successful')
        await refreshBalances()
        await refreshTransactions()
        return true
      } else {
        toast.error(response.message || 'Unstaking failed')
        return false
      }
    } catch (error: any) {
      console.error('Unstaking error:', error)
      toast.error(error.message || 'Unstaking failed')
      return false
    }
  }, [address, isConnected, isCorrectNetwork, refreshBalances, refreshTransactions])

  // Claim rewards
  const claimRewards = useCallback(async (poolId: string): Promise<boolean> => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet')
      return false
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to the correct network')
      return false
    }

    try {
      const response = await web3API.claimRewards({
        user: address,
        poolId,
      })

      if (response.success) {
        toast.success('Rewards claimed successfully')
        await refreshBalances()
        await refreshTransactions()
        return true
      } else {
        toast.error(response.message || 'Failed to claim rewards')
        return false
      }
    } catch (error: any) {
      console.error('Claim rewards error:', error)
      toast.error(error.message || 'Failed to claim rewards')
      return false
    }
  }, [address, isConnected, isCorrectNetwork, refreshBalances, refreshTransactions])

  // Load data when wallet connects
  useEffect(() => {
    if (isConnected && address && isCorrectNetwork) {
      refreshBalances()
      refreshNFTs()
      refreshTransactions()
    }
  }, [isConnected, address, isCorrectNetwork, refreshBalances, refreshNFTs, refreshTransactions])

  // Clear data when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setTokenBalances([])
      setNftAssets([])
      setTransactions([])
    }
  }, [isConnected])

  // Show network warning
  useEffect(() => {
    if (isConnected && chainId && !isCorrectNetwork) {
      toast.error('Please switch to a supported network', {
        duration: 5000,
        id: 'network-warning',
      })
    }
  }, [isConnected, chainId, isCorrectNetwork])

  // Context value
  const value: Web3ContextType = {
    // Connection state
    isConnected,
    address,
    chainId,
    isCorrectNetwork,
    
    // Balances
    nativeBalance,
    tokenBalances,
    nftAssets,
    
    // Loading states
    isLoadingBalances,
    isLoadingNFTs,
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    openAccountModal: openAccountModal || (() => {}),
    openChainModal: openChainModal || (() => {}),
    
    // Token operations
    refreshBalances,
    transferToken,
    approveToken,
    
    // NFT operations
    refreshNFTs,
    transferNFT,
    
    // Staking operations
    stake,
    unstake,
    claimRewards,
    
    // Transaction history
    transactions,
    refreshTransactions,
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

// Hook to use Web3 context
export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context)
  
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  
  return context
}

// Web3 utilities
export const web3Utils = {
  // Format token amount for display
  formatTokenAmount: (amount: string, decimals: number = 18, precision: number = 4): string => {
    const value = parseFloat(amount) / Math.pow(10, decimals)
    return value.toFixed(precision)
  },

  // Parse token amount for transactions
  parseTokenAmount: (amount: string, decimals: number = 18): string => {
    const value = parseFloat(amount) * Math.pow(10, decimals)
    return value.toString()
  },

  // Shorten address for display
  shortenAddress: (address: string, chars: number = 4): string => {
    if (!address) return ''
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
  },

  // Get token info by address
  getTokenInfo: (address: string) => {
    return Object.values(TOKENS).find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    )
  },

  // Check if address is valid
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  // Get explorer URL for transaction
  getExplorerUrl: (hash: string, chainId: number): string => {
    const explorers: Record<number, string> = {
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com',
      31337: 'http://localhost:8545',
    }
    
    const explorer = explorers[chainId] || explorers[137]
    return `${explorer}/tx/${hash}`
  },
}

export default Web3Provider