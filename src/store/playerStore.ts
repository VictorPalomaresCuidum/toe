import { create } from 'zustand';
import { PlayerProfile, TowerType } from '../types';
import { TOWER_DEFINITIONS } from '../game/towers';

interface ShopItem {
  towerId: TowerType;
  upgradeLevel: number; // 0 = not owned unlock, 1-3 = upgrade levels
}

interface PlayerStore {
  profile: PlayerProfile;
  unlockedTowers: TowerType[];
  towerLevels: Record<TowerType, number>;
  completedLevels: string[];

  // Actions
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXP: (amount: number) => void;
  setProfileImage: (uri: string) => void;
  unlockTower: (id: TowerType) => boolean;
  upgradeTower: (id: TowerType) => boolean;
  completeLevel: (levelId: string, coinsEarned: number, xpEarned: number) => void;
  reset: () => void;
}

const initialProfile: PlayerProfile = {
  coins: 0,
  level: 0,
  xp: 0,
  profileImage: null,
};

const XP_PER_LEVEL = 100;

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  profile: initialProfile,
  unlockedTowers: ['archer', 'cannon'],
  towerLevels: {
    archer: 1,
    cannon: 1,
    mage: 1,
    ice: 1,
    lightning: 1,
  },
  completedLevels: [],

  addCoins: (amount) =>
    set((s) => ({ profile: { ...s.profile, coins: s.profile.coins + amount } })),

  spendCoins: (amount) => {
    const { profile } = get();
    if (profile.coins < amount) return false;
    set((s) => ({ profile: { ...s.profile, coins: s.profile.coins - amount } }));
    return true;
  },

  addXP: (amount) =>
    set((s) => {
      const newXP = s.profile.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL);
      return { profile: { ...s.profile, xp: newXP, level: newLevel } };
    }),

  setProfileImage: (uri) =>
    set((s) => ({ profile: { ...s.profile, profileImage: uri } })),

  unlockTower: (id) => {
    const { spendCoins, unlockedTowers } = get();
    if (unlockedTowers.includes(id)) return false;
    const def = TOWER_DEFINITIONS[id];
    const cost = def.cost * 2; // unlock cost
    if (!spendCoins(cost)) return false;
    set((s) => ({ unlockedTowers: [...s.unlockedTowers, id] }));
    return true;
  },

  upgradeTower: (id) => {
    const { spendCoins, towerLevels } = get();
    const def = TOWER_DEFINITIONS[id];
    const currentLevel = towerLevels[id];
    if (currentLevel >= def.maxLevel) return false;
    const cost = def.upgradeCost * currentLevel;
    if (!spendCoins(cost)) return false;
    set((s) => ({
      towerLevels: { ...s.towerLevels, [id]: s.towerLevels[id] + 1 },
    }));
    return true;
  },

  completeLevel: (levelId, coinsEarned, xpEarned) => {
    const { addCoins, addXP, completedLevels } = get();
    addCoins(coinsEarned);
    addXP(xpEarned);
    if (!completedLevels.includes(levelId)) {
      set((s) => ({ completedLevels: [...s.completedLevels, levelId] }));
    }
  },

  reset: () =>
    set({
      profile: initialProfile,
      unlockedTowers: ['archer', 'cannon'],
      towerLevels: { archer: 1, cannon: 1, mage: 1, ice: 1, lightning: 1 },
      completedLevels: [],
    }),
}));
