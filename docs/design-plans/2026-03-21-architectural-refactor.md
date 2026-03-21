# Bad Snake Architectural Refactor Design

## Summary

Bad Snake is a local-multiplayer snake game running in the browser, built in TypeScript with Vite. Up to six players share a single canvas, each controlling a snake with a configurable key scheme. As the game progresses, random events (speed boosts, inverted controls, body swaps, meteor strikes, a closing ring of fire) are triggered on food pickup or on a schedule, and the game auto-resets when all but one snake is dead.

The current codebase concentrates game state, the frame loop, grid mutation, event dispatch, and input handling all inside `main.ts`, with no clear ownership boundaries between them. This refactor introduces a layered set of abstractions -- `GameGrid`, `GameState`, `GameLoop`, `EventRegistry`, `GameConfig`/`RuntimeState` -- each with a single well-defined responsibility. The approach is incremental: six ordered phases each produce a playable game, with earlier phases establishing the type-safe foundations (cell enums, control registry, event interface) that later phases (grid mediation, settings split, capstone extraction) build on.

## Definition of Done

1. **main.ts is no longer a god module** -- game state, game loop, and status effects live in their own classes/modules with clear responsibilities
2. **Grid interactions are mediated** -- snakes declare intended moves, a resolver applies them to the grid (single cutover phase)
3. **No magic strings** -- cell types use a CellType enum; grid queries are type-safe
4. **Control schemes are data-driven** -- a registry maps schemes to key bindings, no if-chains
5. **Event effects are self-contained** -- each event type implements a common interface (onTrigger/onTick), discoverable in one place
6. **Known bugs are fixed** -- FREAKY_FRIDAY desync, control double-inversion, and Segment.ts rendering paradigm mixing are resolved as part of the relevant refactoring phases
7. **Game remains playable after each phase** -- verified by manual play-testing

## Glossary

- **God module**: A single file that owns too much -- state, logic, and coordination that should be spread across focused modules. `main.ts` is the god module being dismantled.
- **Move-then-resolve**: A two-phase movement model where snakes declare *where they want to move* (the intent) without touching the grid, then a single resolver applies all intents simultaneously. Makes simultaneous collisions detectable and resolution deterministic.
- **Magic strings**: Bare string literals used as identifiers in code rather than named enum values. The grid currently uses `'f'` for food, `'p'` for special, `'r'` for hazard, `'0'` for empty.
- **Polymorphic dispatch**: Calling a method on an interface without knowing the concrete type -- here, `EventRegistry` calls `onTrigger()` on whatever `EventEffect` is registered for a given event type, replacing a `switch` statement.
- **Lockstep simulation**: A networking model where each peer runs the same deterministic simulation and only transmits inputs (intents), not state. The move-then-resolve pattern is a prerequisite. Not built in this refactor, but the architecture enables it.
- **FREAKY_FRIDAY**: A rare in-game event that rotates all living snakes' bodies onto the next snake. Currently has a desync bug where the swap runs mid-frame inside `addEvent()`.
- **Vite**: The build tool and dev server bundling the TypeScript ES modules into a browser-runnable application.
- **requestAnimationFrame**: The browser API used to schedule the game's draw/tick function. `GameLoop` owns the callback registered with this API.

## Architecture

Bottom-up layering approach: introduce foundational types first, then build structural changes on top, finishing with the capstone extraction of GameState and GameLoop. Each phase produces a playable game. No test suite exists, so verification is manual play-testing after each phase.

The refactoring introduces three new core abstractions:

- **GameGrid** (`src/GameGrid.ts`) -- owns the grid array, mediates all cell access, and implements the move-then-resolve pattern where snakes declare movement intents rather than mutating the grid directly.
- **GameState** (`src/GameState.ts`) -- owns all mutable game state: grid, snakes, runtime parameters, event log, and the event registry.
- **GameLoop** (`src/GameLoop.ts`) -- owns the frame cycle with an explicit tick order: input -> intents -> resolution -> effects -> spawning -> render.

Supporting abstractions:

- **EventEffect** (`src/components/EventEffect.ts`) -- interface for self-contained event handlers with `onTrigger()` and optional `onTick()` methods, plus an `EventRegistry` that maps event types to their effects.
- **GameConfig** vs **RuntimeState** -- settings split into immutable-per-round configuration and mutable runtime state.
- **CellType** enum -- replaces magic strings for grid cell values.
- **Control scheme registry** -- data-driven key mapping replaces repeated if-chains.

Data flow after refactoring:

```
HTML checkboxes -> GameConfig (immutable)
GameConfig + RuntimeState -> GameState
GameLoop.tick():
  1. Controller resolves input -> snake direction (via registry lookup)
  2. Snake.move() returns MoveIntent (no grid mutation)
  3. GameGrid.queueMove() collects all intents
  4. GameGrid.resolveAll() applies intents, returns CollisionResults
  5. EventRegistry dispatches triggered events (onTrigger)
  6. EventRegistry ticks ongoing effects (onTick)
  7. GameState.spawnFood() if needed
  8. Drawer renders from GameState + GameConfig
```

### Key Contracts

```typescript
interface EventEffect {
  type: SnakeEventType;
  onTrigger(context: EventContext): void;
  onTick?(context: EventContext): void;
}

interface EventContext {
  grid: GameGrid;
  snakes: Snake[];
  runtime: RuntimeState;
  config: GameConfig;
  frame: number;
  triggeringSnake?: Snake;
}

interface MoveIntent {
  from: [number, number];
  to: [number, number];
  trail: [number, number][];
}

interface CollisionResult {
  snake: Snake;
  outcome: 'moved' | 'ate_food' | 'ate_special' | 'died_wall' | 'died_snake';
  eventType?: SnakeEventType;
}

interface GameConfig {
  gridSize: number;
  squareSize: number;
  colours: ColourSet;
  enabledEvents: SnakeEventType[];
  enabledSettings: SettingsType[];
  controlSchemes: ControlScheme[];
}

interface RuntimeState {
  fps: number;
  status: Status;
  meteors: Meteor[];
  invertedControls: boolean;
  specialOnly: boolean;
  deadScore: boolean;
  frame: number;
  frozenUntilFrame: number;
}
```

## Existing Patterns

Investigation found established TypeScript patterns already in use:

- **Enums** for domain constants: `Direction`, `Rarity`, `SnakeEventType`, `SettingsType`, `Status` in `src/utilities.ts` and `src/components/SnakeEvent.ts`. The new `CellType` enum follows this pattern.
- **Class-based entities**: `Snake` in `src/snake.ts`, `Meteor` in `src/components/Meteor.ts`. The new `GameGrid`, `GameState`, and `GameLoop` classes extend this pattern.
- **ES module structure**: all files are ES modules bundled by Vite. New files follow the same pattern with no bundler config changes.

Divergence from existing patterns:

- **Event dispatch**: currently a bare `Function` callback (`addEvent`) with inline switch logic in `main.ts`. Replaced by `EventRegistry` with polymorphic `EventEffect` objects. Divergence justified because the current approach scatters event logic across three files and makes adding new events error-prone.
- **Grid access**: currently direct `grid[][]` mutation from multiple call sites (18 identified). Replaced by `GameGrid` class mediating all access. Divergence justified because direct mutation prevents move-then-resolve, makes collision priority implicit, and blocks future networking.
- **Settings**: currently a single shared mutable object passed by reference. Split into immutable `GameConfig` and mutable `RuntimeState`. Divergence justified because mixing config and runtime state makes it unclear what can change during gameplay.

## Implementation Phases

### Phase 1: CellType Enum & Score Display Fix

**Goal:** Replace magic strings with type-safe cell values and decouple score rendering from grid mutation.

**Components:**
- `CellType` enum added to `src/utilities.ts` with values `EMPTY`, `FOOD`, `SPECIAL`, `HAZARD`
- `CellValue` type alias (`CellType | string`) applied to grid typing across all files
- All 18 grid mutation sites updated to use `CellType` constants instead of raw strings
- `src/draw/Segment.ts` refactored to render score digits directly to canvas context instead of writing snake ID markers into the grid array

**Dependencies:** None (first phase)

**Done when:** Game plays identically to current behavior. No raw string literals (`'0'`, `'f'`, `'p'`, `'r'`) remain in grid operations. Score display renders without mutating the game grid.

### Phase 2: Control Scheme Registry

**Goal:** Replace repeated if-chains in input handling with a data-driven registry and fix the double-inversion bug.

**Components:**
- `CONTROL_SCHEMES: Map<ControlScheme, KeyMap>` and `DASH_KEYS: Map<ControlScheme, string>` in `src/components/controller.ts`
- `resolveDirection()` function that applies inversion exactly once
- Unified handler: look up scheme, look up key, resolve direction, apply to snake

**Dependencies:** None (independent of Phase 1)

**Done when:** All 5 control schemes work correctly. Inverted controls apply once regardless of input timing. Controller code has a single handler path instead of repeated if-chains.

### Phase 3: Event Effect Consolidation

**Goal:** Unify scattered event handling into self-contained effect objects and fix the FREAKY_FRIDAY desync.

**Components:**
- `EventEffect` interface and `EventContext` type in `src/components/EventEffect.ts`
- Individual effect implementations: `SpeedEffect`, `RingOfFireEffect`, `MeteorEffect`, `FreakFridayEffect`, `CurseEffect`, `DashBoostEffect`, `DashFrenzyEffect`, `LengthEffect`
- `EventRegistry` class mapping `SnakeEventType` to `EventEffect`, with `dispatch()` and `tickAll()` methods
- `FreakFridayEffect` explicitly freezes all snakes for a tunable number of frames via `frozenUntilFrame` on the settings/runtime state
- `handleStatus()` logic from `main.ts` migrated into `onTick()` methods on `RingOfFireEffect` and `MeteorEffect`

**Dependencies:** Phase 1 (CellType enum used in EventContext)

**Done when:** All event types trigger correctly. `addEvent()` in `main.ts` delegates to `EventRegistry` instead of inline switch logic. `handleStatus()` is removed from `main.ts`. FREAKY_FRIDAY produces an intentional multi-frame freeze.

### Phase 4: Grid Mediation Layer

**Goal:** Introduce `GameGrid` class and switch to move-then-resolve pattern. This is the atomic cutover phase.

**Components:**
- `GameGrid` class in `src/GameGrid.ts` with `getCell()`, `setCell()`, `findEmpty()`, `isOccupied()`, `queueMove()`, `resolveAll()`
- `MoveIntent` and `CollisionResult` types in `src/GameGrid.ts`
- `Snake.move()` and `Snake.dash()` in `src/snake.ts` refactored to return `MoveIntent` instead of mutating the grid
- Food spawning and hazard placement in `main.ts` updated to use `GameGrid.setCell()`
- `EventEffect` implementations updated to use `GameGrid` instead of raw grid array

**Dependencies:** Phase 1 (CellType), Phase 3 (EventEffect uses GameGrid in context)

**Done when:** No code directly accesses `grid[][]`. All snake movement goes through `queueMove()`/`resolveAll()`. Simultaneous head-on collisions are detected correctly. Game plays correctly with the new resolution order.

### Phase 5: Settings Split

**Goal:** Separate immutable round configuration from mutable runtime state.

**Components:**
- `GameConfig` interface in `src/components/Settings.ts` for immutable-per-round values
- `RuntimeState` interface in `src/components/Settings.ts` for mutable values including `frozenUntilFrame`
- `Snake` constructor updated to receive `GameConfig` (read-only) instead of full settings reference
- `EventContext` updated to provide both `config` and `runtime` instead of single `settings`
- `setSettings()` in `main.ts` refactored to produce a `GameConfig` object

**Dependencies:** Phase 3 (EventContext references), Phase 4 (GameGrid uses config for dimensions)

**Done when:** `GameConfig` is constructed once per round and never mutated. `RuntimeState` is the only mutable settings object. Snake instances cannot modify configuration values.

### Phase 6: GameState & GameLoop Extraction

**Goal:** Extract game state ownership and frame cycle from `main.ts` into dedicated classes. Capstone phase.

**Components:**
- `GameState` class in `src/GameState.ts` owning `GameGrid`, `Snake[]`, `RuntimeState`, `SnakeEvent[]`, `EventRegistry` with `addEvent()`, `reset()`, `spawnFood()` methods
- `GameLoop` class in `src/GameLoop.ts` owning the `requestAnimationFrame` cycle, FPS management, and explicit tick order (input -> intents -> resolution -> effects -> spawning -> render)
- `main.ts` reduced to entry point: read HTML checkboxes, build `GameConfig`, construct `GameState` and `GameLoop`, call `loop.start()`
- `src/draw/draw.ts` updated to read from `GameState` and `GameConfig` instead of loose variables

**Dependencies:** All previous phases

**Done when:** `main.ts` is under 50 lines. `GameState` owns all mutable state. `GameLoop.tick()` has a clear, readable sequence. Game plays identically to pre-refactor behavior.

## Additional Considerations

**Networking readiness:** The move-then-resolve pattern (Phase 4) creates the key architectural seam for future networking. `MoveIntent` objects are serializable and could be transmitted over a wire. `GameGrid.resolveAll()` is deterministic given the same intents, enabling lockstep simulation. No networking code is built in this refactor.

**Phase verification without tests:** Since there is no test suite and adding one is a separate initiative, each phase is verified by manual play-testing. Phases are ordered so that regressions are immediately visible during play (wrong cell colors, broken controls, missing events, movement glitches). TypeScript strict mode provides compile-time safety for type changes.
