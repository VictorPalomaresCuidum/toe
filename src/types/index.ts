export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface PlayerProfile {
  coins: number;
  level: number;
  xp: number;
  profileImage: string | null;
}

// ─── Tower Types ────────────────────────────────────────────────────────────

export type TowerType = 'archer' | 'cannon' | 'mage' | 'ice' | 'lightning';

export interface TowerDefinition {
  id: TowerType;
  name: string;
  description: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number; // shots per second
  emoji: string;
  color: string;
  maxLevel: number;
  upgradeCost: number;
  unlocked: boolean;
}

export interface PlacedTower {
  id: string;
  type: TowerType;
  gridX: number;
  gridY: number;
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  lastShot: number;
}

// ─── Enemy Types ─────────────────────────────────────────────────────────────

export type EnemyType = 'goblin' | 'orc' | 'troll' | 'dragon' | 'boss';

export interface EnemyDefinition {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  emoji: string;
  color: string;
  size: number;
}

export interface ActiveEnemy {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  emoji: string;
  color: string;
  size: number;
  pathIndex: number;
  x: number;
  y: number;
  progress: number; // 0-1 along the path segment
}

// ─── Projectile ───────────────────────────────────────────────────────────────

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  color: string;
}

// ─── Level Types ─────────────────────────────────────────────────────────────

export interface PathPoint {
  x: number; // grid column
  y: number; // grid row
}

export interface Wave {
  enemies: { type: EnemyType; count: number; interval: number }[];
  delayBefore: number; // ms before wave starts
}

export interface LevelDefinition {
  id: string;
  name: string;
  difficulty: Difficulty;
  description: string;
  path: PathPoint[];
  waves: Wave[];
  startingCoins: number;
  lives: number;
  gridCols: number;
  gridRows: number;
  unlocked: boolean;
  emoji: string;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type GameStatus = 'idle' | 'playing' | 'paused' | 'wave_clear' | 'victory' | 'defeat';

export interface GameState {
  status: GameStatus;
  level: LevelDefinition | null;
  lives: number;
  coins: number;
  currentWave: number;
  towers: PlacedTower[];
  enemies: ActiveEnemy[];
  projectiles: Projectile[];
  score: number;
}
