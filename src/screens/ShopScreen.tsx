import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayerStore } from '../store/playerStore';
import { TOWER_DEFINITIONS } from '../game/towers';
import { TowerType } from '../types';
import { colors, spacing, typography, rounded, shadows, componentStyles } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Shop'>;
};

const UPGRADE_BONUSES: Record<number, string> = {
  2: '+30% Daño, +0.5 Rango',
  3: '+60% Daño, +1 Rango, +25% Velocidad',
};

export default function ShopScreen({ navigation }: Props) {
  const { profile, unlockedTowers, towerLevels, unlockTower, upgradeTower } = usePlayerStore();
  const [tab, setTab] = useState<'troops' | 'upgrades'>('troops');

  const handleUnlock = (id: TowerType) => {
    const def = TOWER_DEFINITIONS[id];
    const cost = def.cost * 2;
    Alert.alert(
      `Desbloquear ${def.name}`,
      `¿Comprar por ${cost} 🪙?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comprar',
          onPress: () => {
            const ok = unlockTower(id);
            if (!ok) Alert.alert('Sin monedas', 'No tienes suficientes monedas.');
          },
        },
      ]
    );
  };

  const handleUpgrade = (id: TowerType) => {
    const def = TOWER_DEFINITIONS[id];
    const current = towerLevels[id];
    const cost = def.upgradeCost * current;
    if (current >= def.maxLevel) {
      Alert.alert('Nivel máximo', 'Esta tropa ya está al máximo nivel.');
      return;
    }
    Alert.alert(
      `Mejorar ${def.name}`,
      `Nivel ${current} → ${current + 1}\n${UPGRADE_BONUSES[current + 1] ?? ''}\nCosto: ${cost} 🪙`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Mejorar',
          onPress: () => {
            const ok = upgradeTower(id);
            if (!ok) Alert.alert('Sin monedas', 'No tienes suficientes monedas.');
          },
        },
      ]
    );
  };

  const towers = Object.values(TOWER_DEFINITIONS);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      {/* ── Utility strip ──────────────────────────────────────────── */}
      <View style={componentStyles.utilityStrip}>
        <Text style={styles.utilityText}>Torre Defense · Tienda</Text>
      </View>

      {/* ── Nav bar ────────────────────────────────────────────────── */}
      <View style={componentStyles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>🏪  TIENDA</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinBadgeText}>🪙 {profile.coins}</Text>
        </View>
      </View>

      {/* ── Category tabs ──────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {(['troops', 'upgrades'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={tab === t ? componentStyles.categoryTabActive : componentStyles.categoryTab}
            onPress={() => setTab(t)}
          >
            <Text style={tab === t ? styles.tabTextActive : styles.tabText}>
              {t === 'troops' ? '⚔️  Tropas' : '🔧  Mejoras'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {towers.map((def) => {
          const owned = unlockedTowers.includes(def.id);
          const level = towerLevels[def.id];
          const maxed = level >= def.maxLevel;
          const unlockCost = def.cost * 2;
          const upgradeCost = def.upgradeCost * level;

          if (tab === 'troops') {
            return (
              <View key={def.id} style={styles.card}>
                {/* Color accent bar */}
                <View style={[styles.accentBar, { backgroundColor: def.color }]} />

                <View style={[styles.iconBox, { backgroundColor: def.color + '18' }]}>
                  <Text style={styles.towerEmoji}>{def.emoji}</Text>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardName}>{def.name}</Text>
                    {owned && (
                      <View style={styles.ownedBadge}>
                        <Text style={styles.ownedBadgeText}>Nv {level}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{def.description}</Text>
                  <View style={styles.specsRow}>
                    <View style={styles.specChip}>
                      <Text style={styles.specText}>⚔️ {def.damage}</Text>
                    </View>
                    <View style={styles.specChip}>
                      <Text style={styles.specText}>🎯 {def.range}</Text>
                    </View>
                    <View style={styles.specChip}>
                      <Text style={styles.specText}>⚡ {def.fireRate}/s</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardAction}>
                  {owned ? (
                    <View style={styles.ownedTag}>
                      <Text style={styles.ownedTagText}>✓ Tuyo</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={componentStyles.btnPrimary}
                      onPress={() => handleUnlock(def.id)}
                    >
                      <Text style={styles.buyText}>🪙 {unlockCost}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }

          if (!owned) return null;
          return (
            <View key={def.id} style={styles.card}>
              <View style={[styles.accentBar, { backgroundColor: def.color }]} />
              <View style={[styles.iconBox, { backgroundColor: def.color + '18' }]}>
                <Text style={styles.towerEmoji}>{def.emoji}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardName}>{def.name}</Text>
                  <View style={[styles.ownedBadge, { backgroundColor: def.color }]}>
                    <Text style={[styles.ownedBadgeText, { color: '#fff' }]}>Nv {level}</Text>
                  </View>
                </View>
                <View style={styles.starsRow}>
                  {Array.from({ length: def.maxLevel }).map((_, i) => (
                    <Text key={i} style={{ fontSize: 14, opacity: i < level ? 1 : 0.2 }}>⭐</Text>
                  ))}
                </View>
                {!maxed && (
                  <Text style={styles.bonusText}>{UPGRADE_BONUSES[level + 1]}</Text>
                )}
              </View>
              <View style={styles.cardAction}>
                {maxed ? (
                  <View style={[styles.ownedTag, { borderColor: colors.primary }]}>
                    <Text style={[styles.ownedTagText, { color: colors.primary }]}>MAX</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={componentStyles.btnPrimary}
                    onPress={() => handleUpgrade(def.id)}
                  >
                    <Text style={styles.buyText}>🪙 {upgradeCost}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Ink slab footer */}
        <View style={styles.inkSlab}>
          <Text style={styles.inkSlabTitle}>Mejora tus tropas para dominar niveles difíciles.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  utilityText: { ...typography.captionMd, color: colors.onInk },

  // Nav
  backBtn: { paddingRight: spacing.md },
  backText: { ...typography.linkMd, color: colors.primary },
  navTitle: { flex: 1, ...typography.displayXs, color: colors.ink },
  coinBadge: {
    backgroundColor: colors.cloud,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: rounded.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  coinBadgeText: { ...typography.captionBold, color: colors.ink },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  tabText: { ...typography.bodyEmphasis, color: colors.charcoal },
  tabTextActive: { ...typography.bodyEmphasis, color: colors.onInk },

  // Cards
  list: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: rounded.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
    ...(shadows.softLift as object),
  },
  accentBar: { width: 4, alignSelf: 'stretch' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  towerEmoji: { fontSize: 28 },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardName: { ...typography.bodyEmphasis, color: colors.ink },
  ownedBadge: {
    backgroundColor: colors.fog,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: rounded.lg,
  },
  ownedBadgeText: { ...typography.captionSm, color: colors.charcoal, fontWeight: '700' },
  cardDesc: { ...typography.captionMd, color: colors.graphite },
  specsRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 2 },
  specChip: {
    backgroundColor: colors.cloud,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: rounded.sm,
  },
  specText: { ...typography.captionSm, color: colors.charcoal },
  starsRow: { flexDirection: 'row', gap: 4, marginVertical: 2 },
  bonusText: { ...typography.captionMd, color: colors.primary },

  cardAction: { alignItems: 'center', minWidth: 80 },
  buyText: { ...typography.buttonMd, color: colors.onPrimary },
  ownedTag: {
    borderWidth: 1,
    borderColor: colors.steel,
    borderRadius: rounded.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  ownedTagText: { ...typography.captionBold, color: colors.graphite },

  inkSlab: {
    marginTop: spacing.xl,
    backgroundColor: colors.ink,
    borderRadius: rounded.xl,
    padding: spacing.xl,
  },
  inkSlabTitle: { ...typography.bodyMd, color: colors.steel },
});
