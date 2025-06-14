import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

// Types
import type { 
  Game, 
  Player, 
  Token, 
  DiceState, 
  GameStatus, 
  PlayerColor,
  GameSettings,
  Position 
} from '../types'

// Hooks
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../hooks/useAuth'

// Game state interface
interface GameState {
  currentGame: Game | null
  isInGame: boolean
  isMyTurn: boolean
  availableMoves: number[]
  gameHistory: Game[]
  spectatingGame: Game | null
  isSpectating: boolean
}

// Game actions
type GameAction =
  | { type: 'SET_GAME'; payload: Game }
  | { type: 'UPDATE_GAME'; payload: Partial<Game> }
  | { type: 'CLEAR_GAME' }
  | { type: 'SET_DICE'; payload: DiceState }
  | { type: 'UPDATE_PLAYER'; payload: { playerId: string; data: Partial<Player> } }
  | { type: 'MOVE_TOKEN'; payload: { tokenId: string; newPosition: number } }
  | { type: 'SET_AVAILABLE_MOVES'; payload: number[] }
  | { type: 'ADD_TO_HISTORY'; payload: Game }
  | { type: 'SET_SPECTATING'; payload: Game | null }

// Game context interface
interface GameContextType {
  state: GameState
  // Game management
  joinGame: (gameId: string, password?: string) => Promise<boolean>
  leaveGame: () => Promise<void>
  createGame: (settings: GameSettings) => Promise<string | null>
  // Game actions
  rollDice: () => Promise<boolean>
  moveToken: (tokenId: string, steps: number) => Promise<boolean>
  skipTurn: () => Promise<boolean>
  // Spectating
  spectateGame: (gameId: string) => Promise<boolean>
  stopSpectating: () => void
  // Utility functions
  canMoveToken: (token: Token, diceValue: number) => boolean
  getTokenPosition: (tokenId: string) => Position | null
  isGameFinished: () => boolean
  getCurrentPlayer: () => Player | null
  getMyPlayer: () => Player | null
}

// Initial state
const initialState: GameState = {
  currentGame: null,
  isInGame: false,
  isMyTurn: false,
  availableMoves: [],
  gameHistory: [],
  spectatingGame: null,
  isSpectating: false,
}

// Game reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_GAME':
      return {
        ...state,
        currentGame: action.payload,
        isInGame: true,
        isMyTurn: false, // Will be calculated separately
      }

    case 'UPDATE_GAME':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          ...action.payload,
        },
      }

    case 'CLEAR_GAME':
      return {
        ...state,
        currentGame: null,
        isInGame: false,
        isMyTurn: false,
        availableMoves: [],
      }

    case 'SET_DICE':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          dice: action.payload,
        },
      }

    case 'UPDATE_PLAYER':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          players: state.currentGame.players.map(player =>
            player.id === action.payload.playerId
              ? { ...player, ...action.payload.data }
              : player
          ),
        },
      }

    case 'MOVE_TOKEN':
      if (!state.currentGame) return state
      return {
        ...state,
        currentGame: {
          ...state.currentGame,
          players: state.currentGame.players.map(player => ({
            ...player,
            tokens: player.tokens.map(token =>
              token.id === action.payload.tokenId
                ? { ...token, position: action.payload.newPosition }
                : token
            ),
          })),
        },
      }

    case 'SET_AVAILABLE_MOVES':
      return {
        ...state,
        availableMoves: action.payload,
      }

    case 'ADD_TO_HISTORY':
      return {
        ...state,
        gameHistory: [action.payload, ...state.gameHistory.slice(0, 9)], // Keep last 10 games
      }

    case 'SET_SPECTATING':
      return {
        ...state,
        spectatingGame: action.payload,
        isSpectating: !!action.payload,
      }

    default:
      return state
  }
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined)

// Game provider props
interface GameProviderProps {
  children: React.ReactNode
}

// Game Provider Component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { socket, emit } = useSocket()
  const { user } = useAuth()

  // Calculate if it's user's turn
  const isMyTurn = React.useMemo(() => {
    if (!state.currentGame || !user) return false
    const currentPlayer = state.currentGame.players[state.currentGame.currentPlayer]
    return currentPlayer?.userId === user.id
  }, [state.currentGame, user])

  // Update isMyTurn when it changes
  useEffect(() => {
    if (state.isMyTurn !== isMyTurn) {
      // This will trigger a re-render with the correct turn state
    }
  }, [isMyTurn, state.isMyTurn])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleGameUpdate = (game: Game) => {
      dispatch({ type: 'UPDATE_GAME', payload: game })
    }

    const handleGameStart = (game: Game) => {
      dispatch({ type: 'SET_GAME', payload: game })
      toast.success('Game started!')
    }

    const handleGameEnd = (game: Game) => {
      dispatch({ type: 'UPDATE_GAME', payload: game })
      dispatch({ type: 'ADD_TO_HISTORY', payload: game })
      
      if (game.winner) {
        const winner = game.players.find(p => p.id === game.winner)
        if (winner?.userId === user?.id) {
          toast.success('Congratulations! You won!')
        } else {
          toast.info(`${winner?.username || 'Someone'} won the game!`)
        }
      }
    }

    const handlePlayerJoined = (player: Player) => {
      toast.info(`${player.username} joined the game`)
    }

    const handlePlayerLeft = (player: Player) => {
      toast.info(`${player.username} left the game`)
    }

    const handleDiceRolled = (data: { playerId: string; value: number }) => {
      dispatch({ type: 'SET_DICE', payload: { 
        value: data.value, 
        isRolling: false, 
        canRoll: false,
        rollCount: 0,
        rollHistory: []
      }})
    }

    const handleTokenMoved = (data: { tokenId: string; newPosition: number }) => {
      dispatch({ type: 'MOVE_TOKEN', payload: data })
    }

    const handleTurnChanged = (data: { currentPlayer: number; availableMoves: number[] }) => {
      dispatch({ type: 'UPDATE_GAME', payload: { currentPlayer: data.currentPlayer } })
      dispatch({ type: 'SET_AVAILABLE_MOVES', payload: data.availableMoves })
    }

    const handleGameError = (error: string) => {
      toast.error(error)
    }

    // Register event listeners
    socket.on('game:update', handleGameUpdate)
    socket.on('game:start', handleGameStart)
    socket.on('game:end', handleGameEnd)
    socket.on('player:joined', handlePlayerJoined)
    socket.on('player:left', handlePlayerLeft)
    socket.on('dice:rolled', handleDiceRolled)
    socket.on('token:moved', handleTokenMoved)
    socket.on('turn:changed', handleTurnChanged)
    socket.on('game:error', handleGameError)

    return () => {
      socket.off('game:update', handleGameUpdate)
      socket.off('game:start', handleGameStart)
      socket.off('game:end', handleGameEnd)
      socket.off('player:joined', handlePlayerJoined)
      socket.off('player:left', handlePlayerLeft)
      socket.off('dice:rolled', handleDiceRolled)
      socket.off('token:moved', handleTokenMoved)
      socket.off('turn:changed', handleTurnChanged)
      socket.off('game:error', handleGameError)
    }
  }, [socket, user])

  // Join game
  const joinGame = useCallback(async (gameId: string, password?: string): Promise<boolean> => {
    try {
      const response = await emit('game:join', { gameId, password })
      
      if (response.success) {
        dispatch({ type: 'SET_GAME', payload: response.data })
        return true
      } else {
        toast.error(response.message || 'Failed to join game')
        return false
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to join game')
      return false
    }
  }, [emit])

  // Leave game
  const leaveGame = useCallback(async (): Promise<void> => {
    try {
      if (state.currentGame) {
        await emit('game:leave', { gameId: state.currentGame.id })
      }
      dispatch({ type: 'CLEAR_GAME' })
    } catch (error: any) {
      console.error('Failed to leave game:', error)
    }
  }, [emit, state.currentGame])

  // Create game
  const createGame = useCallback(async (settings: GameSettings): Promise<string | null> => {
    try {
      const response = await emit('game:create', { settings })
      
      if (response.success) {
        dispatch({ type: 'SET_GAME', payload: response.data })
        return response.data.id
      } else {
        toast.error(response.message || 'Failed to create game')
        return null
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create game')
      return null
    }
  }, [emit])

  // Roll dice
  const rollDice = useCallback(async (): Promise<boolean> => {
    if (!state.currentGame || !isMyTurn) return false

    try {
      dispatch({ type: 'SET_DICE', payload: { 
        ...state.currentGame.dice, 
        isRolling: true 
      }})

      const response = await emit('game:rollDice', { 
        gameId: state.currentGame.id 
      })

      if (response.success) {
        return true
      } else {
        toast.error(response.message || 'Failed to roll dice')
        return false
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to roll dice')
      return false
    }
  }, [emit, state.currentGame, isMyTurn])

  // Move token
  const moveToken = useCallback(async (tokenId: string, steps: number): Promise<boolean> => {
    if (!state.currentGame || !isMyTurn) return false

    try {
      const response = await emit('game:moveToken', {
        gameId: state.currentGame.id,
        tokenId,
        steps,
      })

      if (response.success) {
        return true
      } else {
        toast.error(response.message || 'Invalid move')
        return false
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to move token')
      return false
    }
  }, [emit, state.currentGame, isMyTurn])

  // Skip turn
  const skipTurn = useCallback(async (): Promise<boolean> => {
    if (!state.currentGame || !isMyTurn) return false

    try {
      const response = await emit('game:skipTurn', {
        gameId: state.currentGame.id,
      })

      if (response.success) {
        return true
      } else {
        toast.error(response.message || 'Failed to skip turn')
        return false
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to skip turn')
      return false
    }
  }, [emit, state.currentGame, isMyTurn])

  // Spectate game
  const spectateGame = useCallback(async (gameId: string): Promise<boolean> => {
    try {
      const response = await emit('game:spectate', { gameId })
      
      if (response.success) {
        dispatch({ type: 'SET_SPECTATING', payload: response.data })
        return true
      } else {
        toast.error(response.message || 'Failed to spectate game')
        return false
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to spectate game')
      return false
    }
  }, [emit])

  // Stop spectating
  const stopSpectating = useCallback(() => {
    if (state.spectatingGame) {
      emit('game:stopSpectating', { gameId: state.spectatingGame.id })
      dispatch({ type: 'SET_SPECTATING', payload: null })
    }
  }, [emit, state.spectatingGame])

  // Utility functions
  const canMoveToken = useCallback((token: Token, diceValue: number): boolean => {
    if (token.isFinished) return false
    
    // Token in home can only move with 6
    if (token.isHome && diceValue !== 6) return false
    
    // Check if move would exceed finish line
    const newPosition = token.position + diceValue
    if (newPosition > 56) return false // Assuming 56 is the finish position
    
    return true
  }, [])

  const getTokenPosition = useCallback((tokenId: string): Position | null => {
    if (!state.currentGame) return null
    
    for (const player of state.currentGame.players) {
      const token = player.tokens.find(t => t.id === tokenId)
      if (token) {
        // Convert linear position to board coordinates
        // This would need to be implemented based on your board layout
        return { x: 0, y: 0, row: 0, col: 0 } // Placeholder
      }
    }
    
    return null
  }, [state.currentGame])

  const isGameFinished = useCallback((): boolean => {
    return state.currentGame?.status === 'finished'
  }, [state.currentGame])

  const getCurrentPlayer = useCallback((): Player | null => {
    if (!state.currentGame) return null
    return state.currentGame.players[state.currentGame.currentPlayer] || null
  }, [state.currentGame])

  const getMyPlayer = useCallback((): Player | null => {
    if (!state.currentGame || !user) return null
    return state.currentGame.players.find(p => p.userId === user.id) || null
  }, [state.currentGame, user])

  // Context value
  const value: GameContextType = {
    state: { ...state, isMyTurn },
    joinGame,
    leaveGame,
    createGame,
    rollDice,
    moveToken,
    skipTurn,
    spectateGame,
    stopSpectating,
    canMoveToken,
    getTokenPosition,
    isGameFinished,
    getCurrentPlayer,
    getMyPlayer,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

// Hook to use game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext)
  
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  
  return context
}

export default GameProvider