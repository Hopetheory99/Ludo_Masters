// ============================================================================
// CORE TYPES
// ============================================================================

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  walletAddress?: string
  createdAt: string
  updatedAt: string
  profile: UserProfile
  stats: UserStats
  subscription: SubscriptionTier
  preferences: UserPreferences
}

export interface UserProfile {
  displayName: string
  bio?: string
  country?: string
  timezone?: string
  language: string
  isVerified: boolean
  badges: Badge[]
  achievements: Achievement[]
}

export interface UserStats {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  winRate: number
  currentStreak: number
  longestStreak: number
  totalPlayTime: number
  ranking: number
  experience: number
  level: number
  tokensEarned: number
  tokensSpent: number
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  soundEnabled: boolean
  musicEnabled: boolean
  notificationsEnabled: boolean
  autoPlayEnabled: boolean
  animationsEnabled: boolean
  language: string
  timezone: string
}

// ============================================================================
// GAME TYPES
// ============================================================================

export interface Game {
  id: string
  roomCode: string
  status: GameStatus
  mode: GameMode
  settings: GameSettings
  players: Player[]
  currentPlayer: number
  board: GameBoard
  dice: DiceState
  winner?: string
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export type GameStatus = 
  | 'waiting'
  | 'starting'
  | 'playing'
  | 'paused'
  | 'finished'
  | 'cancelled'

export type GameMode = 
  | 'classic'
  | 'quick'
  | 'tournament'
  | 'custom'
  | 'ai'
  | 'practice'

export interface GameSettings {
  maxPlayers: number
  timeLimit?: number
  turnTimeout: number
  allowSpectators: boolean
  isPrivate: boolean
  password?: string
  rules: GameRules
  stakes?: GameStakes
}

export interface GameRules {
  variant: 'classic' | 'modern' | 'custom'
  requireExactRoll: boolean
  captureRule: 'standard' | 'safe' | 'none'
  homeRule: 'standard' | 'exact' | 'any'
  doubleRollOn6: boolean
  maxConsecutiveRolls: number
  customRules?: Record<string, any>
}

export interface GameStakes {
  entryFee: number
  tokenType: 'LUDO' | 'ETH' | 'MATIC'
  prizePool: number
  distribution: number[]
}

export interface Player {
  id: string
  userId?: string
  username: string
  avatar?: string
  color: PlayerColor
  isAI: boolean
  aiDifficulty?: AIdifficulty
  tokens: Token[]
  isReady: boolean
  isConnected: boolean
  position: number
  score: number
  moves: number
  timeUsed: number
}

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow'

export type AIdifficulty = 'easy' | 'medium' | 'hard' | 'expert'

export interface Token {
  id: string
  playerId: string
  color: PlayerColor
  position: number
  isHome: boolean
  isSafe: boolean
  isFinished: boolean
  canMove: boolean
  possibleMoves: number[]
}

export interface GameBoard {
  size: number
  cells: BoardCell[]
  homes: HomeArea[]
  finishLines: FinishLine[]
  safeSpots: number[]
  startPositions: Record<PlayerColor, number>
}

export interface BoardCell {
  id: number
  type: CellType
  color?: PlayerColor
  isSafe: boolean
  tokens: string[]
  position: Position
}

export type CellType = 
  | 'path'
  | 'home'
  | 'start'
  | 'finish'
  | 'safe'
  | 'center'

export interface Position {
  x: number
  y: number
  row: number
  col: number
}

export interface HomeArea {
  color: PlayerColor
  cells: number[]
  startPosition: number
}

export interface FinishLine {
  color: PlayerColor
  cells: number[]
}

export interface DiceState {
  value: number
  isRolling: boolean
  canRoll: boolean
  rollCount: number
  lastRolledBy?: string
  rollHistory: number[]
}

// ============================================================================
// WEB3 TYPES
// ============================================================================

export interface TokenBalance {
  symbol: string
  name: string
  address: string
  balance: string
  decimals: number
  usdValue?: number
}

export interface NFTAsset {
  id: string
  tokenId: string
  contractAddress: string
  name: string
  description: string
  image: string
  attributes: NFTAttribute[]
  rarity: NFTRarity
  collection: NFTCollection
  owner: string
  isListed: boolean
  price?: string
  lastSale?: NFTSale
}

export interface NFTAttribute {
  trait_type: string
  value: string | number
  rarity?: number
}

export type NFTRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface NFTCollection {
  id: string
  name: string
  symbol: string
  description: string
  image: string
  contractAddress: string
  totalSupply: number
  floorPrice?: string
  volume24h?: string
}

export interface NFTSale {
  price: string
  currency: string
  buyer: string
  seller: string
  timestamp: string
  transactionHash: string
}

export interface StakingPool {
  id: string
  name: string
  tokenAddress: string
  rewardTokenAddress: string
  totalStaked: string
  totalRewards: string
  apy: number
  lockPeriod: number
  minStake: string
  maxStake?: string
  isActive: boolean
  userStake?: UserStake
}

export interface UserStake {
  amount: string
  rewards: string
  stakedAt: string
  unlockAt: string
  canWithdraw: boolean
}

export interface Transaction {
  hash: string
  type: TransactionType
  status: TransactionStatus
  amount?: string
  token?: string
  from: string
  to: string
  gasUsed?: string
  gasPrice?: string
  timestamp: string
  blockNumber: number
}

export type TransactionType = 
  | 'transfer'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'mint'
  | 'burn'
  | 'approve'
  | 'game'

export type TransactionStatus = 
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'cancelled'

// ============================================================================
// SUBSCRIPTION & MONETIZATION TYPES
// ============================================================================

export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum'

export interface Subscription {
  tier: SubscriptionTier
  isActive: boolean
  startDate: string
  endDate?: string
  autoRenew: boolean
  paymentMethod?: PaymentMethod
  benefits: SubscriptionBenefit[]
}

export interface SubscriptionBenefit {
  id: string
  name: string
  description: string
  isActive: boolean
  tier: SubscriptionTier
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'crypto' | 'paypal'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  walletAddress?: string
}

export interface ShopItem {
  id: string
  name: string
  description: string
  category: ShopCategory
  type: ItemType
  price: number
  currency: 'LUDO' | 'USD' | 'ETH'
  image: string
  rarity: NFTRarity
  isLimited: boolean
  stock?: number
  requirements?: ItemRequirement[]
  benefits?: string[]
}

export type ShopCategory = 
  | 'avatars'
  | 'boards'
  | 'tokens'
  | 'themes'
  | 'emotes'
  | 'badges'
  | 'boosters'

export type ItemType = 'cosmetic' | 'functional' | 'consumable' | 'nft'

export interface ItemRequirement {
  type: 'level' | 'achievement' | 'subscription' | 'tokens'
  value: number | string
}

// ============================================================================
// TOURNAMENT & LEADERBOARD TYPES
// ============================================================================

export interface Tournament {
  id: string
  name: string
  description: string
  type: TournamentType
  format: TournamentFormat
  status: TournamentStatus
  entryFee: number
  prizePool: number
  maxParticipants: number
  currentParticipants: number
  startDate: string
  endDate: string
  rules: TournamentRules
  prizes: TournamentPrize[]
  participants: TournamentParticipant[]
  brackets?: TournamentBracket[]
  leaderboard?: LeaderboardEntry[]
}

export type TournamentType = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'special'
  | 'community'

export type TournamentFormat = 
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'swiss'
  | 'ladder'

export type TournamentStatus = 
  | 'upcoming'
  | 'registration'
  | 'starting'
  | 'active'
  | 'finished'
  | 'cancelled'

export interface TournamentRules {
  gameMode: GameMode
  gameSettings: GameSettings
  advancementRules: string[]
  tiebreakers: string[]
}

export interface TournamentPrize {
  position: number
  amount: number
  currency: string
  nftReward?: string
  title?: string
}

export interface TournamentParticipant {
  userId: string
  username: string
  avatar?: string
  registeredAt: string
  status: 'registered' | 'active' | 'eliminated' | 'winner'
  currentRound?: number
  wins: number
  losses: number
}

export interface TournamentBracket {
  round: number
  matches: TournamentMatch[]
}

export interface TournamentMatch {
  id: string
  round: number
  participants: string[]
  winner?: string
  gameId?: string
  scheduledAt?: string
  completedAt?: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatar?: string
  score: number
  gamesPlayed: number
  winRate: number
  change: number
}

// ============================================================================
// SOCIAL & COMMUNICATION TYPES
// ============================================================================

export interface ChatMessage {
  id: string
  userId: string
  username: string
  avatar?: string
  content: string
  type: MessageType
  timestamp: string
  gameId?: string
  isSystem: boolean
  reactions?: MessageReaction[]
}

export type MessageType = 
  | 'text'
  | 'emote'
  | 'system'
  | 'game_action'
  | 'achievement'

export interface MessageReaction {
  emoji: string
  count: number
  users: string[]
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: string
  expiresAt?: string
}

export type NotificationType = 
  | 'game_invite'
  | 'game_start'
  | 'game_end'
  | 'tournament_start'
  | 'achievement'
  | 'friend_request'
  | 'system'
  | 'promotion'

export interface Friend {
  id: string
  username: string
  avatar?: string
  status: FriendStatus
  isOnline: boolean
  lastSeen?: string
  addedAt: string
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  rarity: NFTRarity
  points: number
  requirements: AchievementRequirement[]
  unlockedAt?: string
  progress?: number
}

export type AchievementCategory = 
  | 'games'
  | 'social'
  | 'collection'
  | 'tournament'
  | 'special'

export interface AchievementRequirement {
  type: string
  target: number
  current?: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  isRare: boolean
  earnedAt: string
}

// ============================================================================
// API & RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  id?: string
}

// ============================================================================
// UI & COMPONENT TYPES
// ============================================================================

export interface Theme {
  name: string
  colors: Record<string, string>
  fonts: Record<string, string>
  spacing: Record<string, string>
  borderRadius: Record<string, string>
  shadows: Record<string, string>
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
}

export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type EventHandler<T = any> = (event: T) => void

export type AsyncEventHandler<T = any> = (event: T) => Promise<void>

// ============================================================================
// ENVIRONMENT & CONFIG TYPES
// ============================================================================

export interface AppConfig {
  apiUrl: string
  wsUrl: string
  chainId: number
  rpcUrl: string
  contractAddresses: {
    token: string
    nft: string
    staking: string
    tournament: string
  }
  features: {
    web3: boolean
    tournaments: boolean
    nftMarketplace: boolean
    staking: boolean
  }
  limits: {
    maxPlayersPerRoom: number
    gameTimeout: number
    turnTimeout: number
  }
}

export interface FeatureFlag {
  name: string
  enabled: boolean
  rolloutPercentage?: number
  conditions?: Record<string, any>
}