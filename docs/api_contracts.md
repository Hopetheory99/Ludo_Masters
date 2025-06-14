# API Contracts

## REST API
### `/api/auth/login`
- **POST**: Authenticate user (wallet signature or credentials)
- **Request**: `{ walletAddress: string, signature?: string }`
- **Response**: `{ token: string, user: User }`

### `/api/game/create`
- **POST**: Create a new game room
- **Request**: `{ userId: string, rules: GameRules }`
- **Response**: `{ roomId: string, gameState: GameState }`

### `/api/game/join`
- **POST**: Join an existing game
- **Request**: `{ userId: string, roomId: string }`
- **Response**: `{ gameState: GameState }`

### `/api/game/state`
- **GET**: Get current game state
- **Query**: `roomId`
- **Response**: `{ gameState: GameState }`

### `/api/game/move`
- **POST**: Submit a move
- **Request**: `{ userId: string, roomId: string, move: Move }`
- **Response**: `{ gameState: GameState, result: MoveResult }`

### `/api/leaderboard`
- **GET**: Fetch leaderboard
- **Response**: `{ leaderboard: LeaderboardEntry[] }`

## WebSocket Events
- `game:state` (broadcast): `{ gameState: GameState }`
- `game:move` (player move): `{ userId, move }`
- `game:chat` (chat message): `{ userId, message }`
- `game:join`/`game:leave`: `{ userId, roomId }`

## Smart Contract ABIs
- **LudoToken (ERC-20)**: `transfer`, `approve`, `balanceOf`, `stake`, `burn`
- **LudoNFT (ERC-721/1155)**: `mint`, `transferFrom`, `ownerOf`, `setApprovalForAll`
- **TournamentPool**: `createPool`, `joinPool`, `distributePrizes`

(Include full ABI JSONs as contracts are finalized)

---
Keep this file updated as APIs and contracts evolve.
