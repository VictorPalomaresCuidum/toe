import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors, spacing, typography, rounded, componentStyles } from '../theme';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LEVELS } from '../game/levels';
import { TOWER_DEFINITIONS } from '../game/towers';
import { ENEMY_DEFINITIONS } from '../game/enemies';
import { usePlayerStore } from '../store/playerStore';
import {
  ActiveEnemy,
  GameStatus,
  LevelDefinition,
  PathPoint,
  PlacedTower,
  Projectile,
  TowerType,
} from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Game'>;
  route: RouteProp<RootStackParamList, 'Game'>;
};

const TICK_MS = 50; // 20 fps game loop
const { width: SW } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function uid() {
  return Math.random().toString(36).slice(2);
}

// ─── Game Screen ─────────────────────────────────────────────────────────────

export default function GameScreen({ navigation, route }: Props) {
  const { levelId } = route.params;
  const level = LEVELS.find((l) => l.id === levelId)!;

  const { profile, unlockedTowers, towerLevels, completeLevel, spendCoins, addCoins } =
    usePlayerStore();
  const { saveToCloud, user } = useAuthStore();

  // ── Layout ──────────────────────────────────────────────────────────────
  const CELL = Math.floor((SW - 32) / level.gridCols);
  const GRID_W = CELL * level.gridCols;
  const GRID_H = CELL * level.gridRows;

  // ── Game state ──────────────────────────────────────────────────────────
  const [status, setStatus] = useState<GameStatus>('idle');
  const [lives, setLives] = useState(level.lives);
  const [coins, setCoins] = useState(level.startingCoins);
  const [waveIndex, setWaveIndex] = useState(0);
  const [towers, setTowers] = useState<PlacedTower[]>([]);
  const [enemies, setEnemies] = useState<ActiveEnemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [selectedTower, setSelectedTower] = useState<TowerType>('archer');
  const [score, setScore] = useState(0);

  // Refs for mutable game-loop data
  const enemiesRef = useRef<ActiveEnemy[]>([]);
  const towersRef = useRef<PlacedTower[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const coinsRef = useRef(level.startingCoins);
  const livesRef = useRef(level.lives);
  const scoreRef = useRef(0);
  const statusRef = useRef<GameStatus>('idle');
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnQueueRef = useRef<{ type: string; at: number }[]>([]);
  const gameTimeRef = useRef(0);
  const waveIndexRef = useRef(0);
  const waveActiveRef = useRef(false);
  const waveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync refs with state for path
  const pathRef = useRef<PathPoint[]>(level.path);

  // ── Path to pixel coords ────────────────────────────────────────────────
  const cellCenter = (gx: number, gy: number) => ({
    x: gx * CELL + CELL / 2,
    y: gy * CELL + CELL / 2,
  });

  // ── Start wave ──────────────────────────────────────────────────────────
  const startWave = useCallback(
    (idx: number) => {
      if (idx >= level.waves.length) return;
      const wave = level.waves[idx];
      waveActiveRef.current = true;

      let offset = wave.delayBefore;
      const newEntries: { type: string; at: number }[] = [];

      wave.enemies.forEach(({ type, count, interval }) => {
        for (let i = 0; i < count; i++) {
          newEntries.push({ type, at: gameTimeRef.current + offset });
          offset += interval;
        }
      });

      spawnQueueRef.current = [...spawnQueueRef.current, ...newEntries];
    },
    [level.waves]
  );

  // ── Game loop ───────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    gameTimeRef.current += TICK_MS;
    const now = gameTimeRef.current;
    const dt = TICK_MS / 1000; // seconds

    const path = pathRef.current;

    // --- Spawn enemies from queue ---
    const toSpawn = spawnQueueRef.current.filter((e) => e.at <= now);
    spawnQueueRef.current = spawnQueueRef.current.filter((e) => e.at > now);

    let newEnemies = [...enemiesRef.current];

    toSpawn.forEach(({ type }) => {
      const def = ENEMY_DEFINITIONS[type as keyof typeof ENEMY_DEFINITIONS];
      if (!def) return;
      const startCell = path[0];
      const pos = { x: startCell.x * CELL + CELL / 2, y: startCell.y * CELL + CELL / 2 };
      newEnemies.push({
        id: uid(),
        type: def.type,
        hp: def.hp,
        maxHp: def.hp,
        speed: def.speed,
        reward: def.reward,
        emoji: def.emoji,
        color: def.color,
        size: def.size,
        pathIndex: 0,
        x: pos.x,
        y: pos.y,
        progress: 0,
      });
    });

    // --- Move enemies along path ---
    const reachedEnd: string[] = [];

    newEnemies = newEnemies.map((enemy) => {
      if (enemy.pathIndex >= path.length - 1) {
        reachedEnd.push(enemy.id);
        return enemy;
      }
      const target = cellCenter(path[enemy.pathIndex + 1].x, path[enemy.pathIndex + 1].y);
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = enemy.speed * CELL * dt;

      if (step >= dist) {
        // Reached next waypoint
        if (enemy.pathIndex + 1 >= path.length - 1) {
          reachedEnd.push(enemy.id);
          return { ...enemy, x: target.x, y: target.y, pathIndex: enemy.pathIndex + 1 };
        }
        return { ...enemy, x: target.x, y: target.y, pathIndex: enemy.pathIndex + 1 };
      }

      return {
        ...enemy,
        x: enemy.x + (dx / dist) * step,
        y: enemy.y + (dy / dist) * step,
      };
    });

    // Handle enemies reaching end
    if (reachedEnd.length > 0) {
      newEnemies = newEnemies.filter((e) => !reachedEnd.includes(e.id));
      livesRef.current = Math.max(0, livesRef.current - reachedEnd.length);
      setLives(livesRef.current);

      if (livesRef.current <= 0) {
        statusRef.current = 'defeat';
        setStatus('defeat');
        if (loopRef.current) clearInterval(loopRef.current);
        return;
      }
    }

    // --- Tower shooting ---
    const currentTowers = towersRef.current;
    let currentProjectiles = [...projectilesRef.current];

    currentTowers.forEach((tower) => {
      if (now - tower.lastShot < 1000 / tower.fireRate) return;
      const towerPixel = cellCenter(tower.gridX, tower.gridY);
      const rangePx = tower.range * CELL;

      // Find closest enemy in range
      let target: ActiveEnemy | null = null;
      let bestProgress = -1;

      newEnemies.forEach((enemy) => {
        const d = distance(towerPixel.x, towerPixel.y, enemy.x, enemy.y);
        if (d <= rangePx && enemy.pathIndex > bestProgress) {
          target = enemy;
          bestProgress = enemy.pathIndex;
        }
      });

      if (target) {
        tower.lastShot = now;
        const def = TOWER_DEFINITIONS[tower.type];
        currentProjectiles.push({
          id: uid(),
          x: towerPixel.x,
          y: towerPixel.y,
          targetId: (target as ActiveEnemy).id,
          damage: tower.damage,
          speed: 8,
          color: def.color,
        });
      }
    });

    // --- Move projectiles ---
    const hitEnemyIds: { id: string; damage: number }[] = [];

    currentProjectiles = currentProjectiles.filter((proj) => {
      const enemy = newEnemies.find((e) => e.id === proj.targetId);
      if (!enemy) return false; // target gone

      const dx = enemy.x - proj.x;
      const dy = enemy.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = proj.speed * CELL * dt;

      if (step >= dist) {
        // Hit!
        hitEnemyIds.push({ id: enemy.id, damage: proj.damage });
        return false;
      }

      proj.x += (dx / dist) * step;
      proj.y += (dy / dist) * step;
      return true;
    });

    // Apply damage
    let coinsGained = 0;
    let scoreGained = 0;

    hitEnemyIds.forEach(({ id, damage }) => {
      const idx = newEnemies.findIndex((e) => e.id === id);
      if (idx < 0) return;
      newEnemies[idx] = { ...newEnemies[idx], hp: newEnemies[idx].hp - damage };
      if (newEnemies[idx].hp <= 0) {
        coinsGained += newEnemies[idx].reward;
        scoreGained += newEnemies[idx].reward * 10;
      }
    });

    newEnemies = newEnemies.filter((e) => e.hp > 0);

    if (coinsGained > 0) {
      coinsRef.current += coinsGained;
      scoreRef.current += scoreGained;
      setCoins(coinsRef.current);
      setScore(scoreRef.current);
    }

    // --- Check wave completion ---
    if (
      waveActiveRef.current &&
      spawnQueueRef.current.length === 0 &&
      newEnemies.length === 0
    ) {
      waveActiveRef.current = false;
      const nextWave = waveIndexRef.current + 1;

      if (nextWave >= level.waves.length) {
        // Victory!
        statusRef.current = 'victory';
        setStatus('victory');
        if (loopRef.current) clearInterval(loopRef.current);
      } else {
        statusRef.current = 'wave_clear';
        setStatus('wave_clear');
        waveIndexRef.current = nextWave;
        setWaveIndex(nextWave);
        // Auto-start next wave after 3s
        waveTimeoutRef.current = setTimeout(() => {
          statusRef.current = 'playing';
          setStatus('playing');
          startWave(nextWave);
        }, 3000);
      }
    }

    enemiesRef.current = newEnemies;
    towersRef.current = currentTowers;
    projectilesRef.current = currentProjectiles;

    setEnemies([...newEnemies]);
    setProjectiles([...currentProjectiles]);
  }, [CELL, level.waves, startWave]);

  // ── Start game ───────────────────────────────────────────────────────────
  const startGame = () => {
    statusRef.current = 'playing';
    setStatus('playing');
    waveIndexRef.current = 0;
    setWaveIndex(0);
    startWave(0);
    loopRef.current = setInterval(tick, TICK_MS);
  };

  // ── Place tower ───────────────────────────────────────────────────────────
  const handleCellPress = (gx: number, gy: number) => {
    if (status !== 'playing' && status !== 'wave_clear') return;

    const onPath = level.path.some((p) => p.x === gx && p.y === gy);
    if (onPath) return;

    const occupied = towersRef.current.some((t) => t.gridX === gx && t.gridY === gy);
    if (occupied) return;

    const def = TOWER_DEFINITIONS[selectedTower];
    if (coinsRef.current < def.cost) {
      Alert.alert('Sin monedas', `Necesitas ${def.cost} 🪙 para colocar esta torre.`);
      return;
    }

    const towerLevel = towerLevels[selectedTower];
    const levelMult = 1 + (towerLevel - 1) * 0.3;

    const newTower: PlacedTower = {
      id: uid(),
      type: selectedTower,
      gridX: gx,
      gridY: gy,
      level: towerLevel,
      damage: Math.round(def.damage * levelMult),
      range: def.range + (towerLevel - 1) * 0.5,
      fireRate: def.fireRate,
      lastShot: 0,
    };

    coinsRef.current -= def.cost;
    setCoins(coinsRef.current);
    towersRef.current = [...towersRef.current, newTower];
    setTowers([...towersRef.current]);
  };

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      if (waveTimeoutRef.current) clearTimeout(waveTimeoutRef.current);
    };
  }, []);

  // ── Victory / defeat handling ─────────────────────────────────────────────
  useEffect(() => {
    if (status === 'victory') {
      const earned = Math.round(scoreRef.current / 10);
      completeLevel(levelId, earned, earned);
      // Auto-save to cloud if logged in
      if (user) saveToCloud();
    }
  }, [status]);

  // ── Render ────────────────────────────────────────────────────────────────
  const pathSet = new Set(level.path.map((p) => `${p.x},${p.y}`));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />

      {/* ── HP HUD bar ────────────────────────────────────────────────── */}
      <View style={styles.hud}>
        <TouchableOpacity
          onPress={() => {
            if (loopRef.current) clearInterval(loopRef.current);
            navigation.goBack();
          }}
          style={styles.hudBack}
        >
          <Text style={styles.hudBackText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.hudStats}>
          <View style={styles.hudChip}>
            <Text style={styles.hudChipIcon}>❤️</Text>
            <Text style={[styles.hudChipVal, lives <= 3 && { color: '#e53935' }]}>
              {lives}
            </Text>
          </View>
          <View style={styles.hudChip}>
            <Text style={styles.hudChipIcon}>🪙</Text>
            <Text style={styles.hudChipVal}>{coins}</Text>
          </View>
          <View style={styles.hudChip}>
            <Text style={styles.hudChipIcon}>🌊</Text>
            <Text style={styles.hudChipVal}>
              {waveIndex + 1}/{level.waves.length}
            </Text>
          </View>
          <View style={[styles.hudChip, styles.hudChipPrimary]}>
            <Text style={styles.hudChipIcon}>⭐</Text>
            <Text style={[styles.hudChipVal, { color: colors.onInk }]}>{score}</Text>
          </View>
        </View>
      </View>

      {/* ── Dark Game Grid ────────────────────────────────────────────── */}
      <View style={[styles.gridWrapper, { width: GRID_W, height: GRID_H }]}>
        {Array.from({ length: level.gridRows }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: level.gridCols }).map((_, col) => {
              const isPath = pathSet.has(`${col},${row}`);
              const tower = towers.find((t) => t.gridX === col && t.gridY === row);
              const isStart = level.path[0].x === col && level.path[0].y === row;
              const isEnd =
                level.path[level.path.length - 1].x === col &&
                level.path[level.path.length - 1].y === row;

              return (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.cell,
                    { width: CELL, height: CELL },
                    isPath && styles.cellPath,
                    !isPath && !tower && styles.cellEmpty,
                  ]}
                  onPress={() => handleCellPress(col, row)}
                  activeOpacity={isPath ? 1 : 0.7}
                >
                  {isStart && <Text style={styles.markerText}>▶</Text>}
                  {isEnd && <Text style={styles.markerText}>🏁</Text>}
                  {tower && (
                    <View style={styles.towerInCell}>
                      <Text style={{ fontSize: CELL * 0.5 }}>
                        {TOWER_DEFINITIONS[tower.type].emoji}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Enemies overlay */}
        {enemies.map((enemy) => (
          <View
            key={enemy.id}
            style={[
              styles.enemy,
              {
                left: enemy.x - enemy.size / 2,
                top: enemy.y - enemy.size / 2,
                width: enemy.size,
                height: enemy.size,
              },
            ]}
          >
            <Text style={{ fontSize: enemy.size * 0.65 }}>{enemy.emoji}</Text>
            <View style={[styles.hpBar, { width: enemy.size }]}>
              <View
                style={[
                  styles.hpFill,
                  {
                    width: `${(enemy.hp / enemy.maxHp) * 100}%` as any,
                    backgroundColor:
                      enemy.hp / enemy.maxHp > 0.5 ? '#4CAF50' : '#f44336',
                  },
                ]}
              />
            </View>
          </View>
        ))}

        {/* Projectiles overlay */}
        {projectiles.map((proj) => (
          <View
            key={proj.id}
            style={[
              styles.projectile,
              { left: proj.x - 4, top: proj.y - 4, backgroundColor: proj.color },
            ]}
          />
        ))}
      </View>

      {/* ── HP Tower selector bar ─────────────────────────────────────── */}
      <View style={styles.towerBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {unlockedTowers.map((id) => {
            const def = TOWER_DEFINITIONS[id];
            const canAfford = coins >= def.cost;
            const selected = selectedTower === id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setSelectedTower(id)}
                style={[
                  styles.towerBtn,
                  selected && styles.towerBtnSelected,
                  !canAfford && styles.towerBtnDisabled,
                ]}
              >
                <Text style={{ fontSize: 22 }}>{def.emoji}</Text>
                <Text style={[styles.towerBtnName, selected && styles.towerBtnNameSel]}>
                  {def.name}
                </Text>
                <Text
                  style={[
                    styles.towerBtnCost,
                    !canAfford && { color: '#e53935' },
                    selected && { color: colors.onPrimary },
                  ]}
                >
                  🪙{def.cost}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Start button ─────────────────────────────────────────────── */}
      {status === 'idle' && (
        <TouchableOpacity
          style={[componentStyles.btnPrimary, styles.startBtn]}
          onPress={startGame}
        >
          <Text style={[componentStyles.btnLabel, styles.startBtnText]}>
            ▶  INICIAR OLA {waveIndex + 1}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Wave clear banner ────────────────────────────────────────── */}
      {status === 'wave_clear' && (
        <View style={styles.waveClearBanner}>
          <View style={styles.waveClearAccent} />
          <Text style={styles.waveClearText}>
            ✓  Oleada {waveIndex} completada — siguiente en 3 s
          </Text>
        </View>
      )}

      {/* ── Victory Modal ────────────────────────────────────────────── */}
      <Modal visible={status === 'victory'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalAccentBar} />
            <Text style={styles.modalEmoji}>🏆</Text>
            <Text style={styles.modalTitle}>VICTORIA</Text>
            <Text style={styles.modalScore}>Puntuación: {score}</Text>
            <View style={styles.modalRewardRow}>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardChipText}>+{Math.round(score / 10)} 🪙</Text>
              </View>
              <View style={styles.rewardChip}>
                <Text style={styles.rewardChipText}>+{Math.round(score / 10)} XP</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[componentStyles.btnPrimary, styles.modalBtn]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[componentStyles.btnLabel, { color: colors.onPrimary }]}>
                Volver al mapa
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Defeat Modal ─────────────────────────────────────────────── */}
      <Modal visible={status === 'defeat'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.modalCardDefeat]}>
            <View style={[styles.modalAccentBar, { backgroundColor: '#e53935' }]} />
            <Text style={styles.modalEmoji}>💀</Text>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>DERROTA</Text>
            <Text style={styles.modalScore}>Puntuación: {score}</Text>
            <Text style={styles.modalDefeatSub}>
              Los enemigos alcanzaron tu base…
            </Text>
            <TouchableOpacity
              style={[componentStyles.btnPrimary, styles.modalBtn, styles.modalBtnDefeat]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[componentStyles.btnLabel, { color: colors.onPrimary }]}>
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingTop: 44,
    alignItems: 'center',
  },

  // ── HUD ────────────────────────────────────────────────────────────────
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: colors.canvas,
    gap: spacing.sm,
  },
  hudBack: {
    paddingRight: spacing.sm,
  },
  hudBackText: {
    ...typography.bodyEmphasis,
    color: colors.charcoal,
  },
  hudStats: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  hudChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cloud,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  hudChipPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hudChipIcon: { fontSize: 12 },
  hudChipVal: {
    ...typography.captionBold,
    color: colors.ink,
  },

  // ── Grid (dark game area — intentionally unchanged) ──────────────────
  gridWrapper: {
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: rounded.md,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  gridRow: { flexDirection: 'row' },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a2a1a',
  },
  cellPath: { backgroundColor: '#3d2a00' },
  cellEmpty: { backgroundColor: '#1a2a1a' },
  markerText: { fontSize: 12, color: '#FFD700' },
  towerInCell: { alignItems: 'center', justifyContent: 'center' },
  enemy: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hpBar: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'absolute',
    bottom: -4,
  },
  hpFill: { height: '100%', borderRadius: 2 },
  projectile: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── Tower selector ────────────────────────────────────────────────────
  towerBar: {
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  towerBtn: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    borderRadius: rounded.lg,
    backgroundColor: colors.cloud,
    borderWidth: 1,
    borderColor: colors.hairline,
    minWidth: 68,
  },
  towerBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  towerBtnDisabled: { opacity: 0.4 },
  towerBtnName: { ...typography.captionSm, color: colors.charcoal, marginTop: 2 },
  towerBtnNameSel: { color: colors.onInk },
  towerBtnCost: { ...typography.captionBold, color: colors.ink },

  // ── Start button ──────────────────────────────────────────────────────
  startBtn: { marginHorizontal: spacing.xxl, marginVertical: spacing.sm, width: '80%' },
  startBtnText: { ...typography.buttonMd, color: colors.onPrimary },

  // ── Wave clear ────────────────────────────────────────────────────────
  waveClearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.xs,
    backgroundColor: '#e8f5e9',
    borderRadius: rounded.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#a5d6a7',
    gap: spacing.xs,
  },
  waveClearAccent: {
    width: 3,
    height: 16,
    backgroundColor: '#4CAF50',
    borderRadius: rounded.sm,
  },
  waveClearText: {
    ...typography.captionBold,
    color: '#2e7d32',
    flex: 1,
  },

  // ── Modals ────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.canvas,
    borderRadius: rounded.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '82%',
    maxWidth: 400,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  modalCardDefeat: {
    // inherits from modalCard
  },
  modalAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  modalEmoji: { fontSize: 40, marginTop: spacing.sm },
  modalTitle: {
    ...typography.displaySm,
    color: colors.ink,
    letterSpacing: 2,
  },
  modalScore: { ...typography.priceMd, color: colors.ink },
  modalRewardRow: { flexDirection: 'row', gap: spacing.sm },
  rewardChip: {
    backgroundColor: colors.cloud,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  rewardChipText: { ...typography.captionBold, color: colors.charcoal },
  modalDefeatSub: { ...typography.captionMd, color: colors.graphite },
  modalBtn: { marginTop: spacing.sm, width: '100%' },
  modalBtnDefeat: { backgroundColor: '#e53935', borderColor: '#e53935' },
});
