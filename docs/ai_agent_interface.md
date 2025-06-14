# AI Agent Interface & Memory/Context Design

## AI Agent Interface
```typescript
interface LudoAIAgent {
  decideMove(gameState: GameState, memory: AgentMemory): Move;
  updateMemory(event: GameEvent): void;
  resetMemory(): void;
}
```
- `decideMove`: Given the current game state and memory, returns the next move.
- `updateMemory`: Updates the agent's memory/context based on game events.
- `resetMemory`: Clears memory for a new game/session.

## Memory/Context Structure
- **Episodic Memory**: Array of recent moves, outcomes, and events.
- **Context Window**: Last N turns, player actions, and board states.
- **Persistent Stats**: Win/loss record, strategy preferences, learning weights.

## Example Usage
```typescript
const agent: LudoAIAgent = ...;
const move = agent.decideMove(currentGameState, agentMemory);
agent.updateMemory({ type: 'move', data: ... });
```

## Extensibility
- Implement new agents by extending the interface.
- Support for difficulty levels, custom strategies, and learning agents.

---
Expand with concrete implementations and advanced memory models as needed.
