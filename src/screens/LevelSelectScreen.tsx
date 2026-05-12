import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LEVELS } from '../game/levels';
import { usePlayerStore } from '../store/playerStore';
import { Difficulty, LevelDefinition } from '../types';
import { colors, spacing, typography, rounded, shadows, componentStyles } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LevelSelect'>;
};

const DIFFICULTIES: {
  key: Difficulty;
  label: string;
  emoji: string;
  accent: string;
}[] = [
  { key: 'easy',    label: 'Fácil',   emoji: '🌿', accent: '#11998e' },
  { key: 'medium',  label: 'Medio',   emoji: '🌀', accent: '#1565C0' },
  { key: 'hard',    label: 'Difícil', emoji: '🔥', accent: '#e53935' },
  { key: 'extreme', label: 'Extremo', emoji: '💀', accent: colors.ink },
];

const DIFF_INFO: Record<Difficulty, string> = {
  easy:    'Vidas: 20 · 3 oleadas · Ideal para aprender',
  medium:  'Vidas: 15 · 4 oleadas · Desafío moderado',
  hard:    'Vidas: 10 · 5 oleadas · Alta dificultad',
  extreme: 'Vidas: 5 · 6 oleadas · Sin piedad',
};

export default function LevelSelectScreen({ navigation }: Props) {
  const { completedLevels } = usePlayerStore();
  const [activeDiff, setActiveDiff] = useState<Difficulty>('easy');

  const diffConfig = DIFFICULTIES.find((d) => d.key === activeDiff)!;
  const filteredLevels = LEVELS.filter((l) => l.difficulty === activeDiff);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      {/* Utility strip */}
      <View style={componentStyles.utilityStrip}>
        <Text style={styles.utilityText}>Tower Defense · Seleccionar nivel</Text>
      </View>

      {/* Nav bar */}
      <View style={componentStyles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>🗺️  NIVELES</Text>
      </View>

      {/* Difficulty selector — pill tabs */}
      <View style={styles.diffRow}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[
              styles.diffTab,
              activeDiff === d.key
                ? [styles.diffTabActive, { backgroundColor: d.accent }]
                : null,
            ]}
            onPress={() => setActiveDiff(d.key)}
          >
            <Text style={styles.diffEmoji}>{d.emoji}</Text>
            <Text
              style={activeDiff === d.key ? styles.diffLabelActive : styles.diffLabel}
            >
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Difficulty info strip */}
      <View style={styles.infoStrip}>
        <View style={[styles.infoAccent, { backgroundColor: diffConfig.accent }]} />
        <Text style={styles.infoText}>{DIFF_INFO[activeDiff]}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filteredLevels.map((level, index) => {
          const locked = !level.unlocked;
          const completed = completedLevels.includes(level.id);

          return (
            <TouchableOpacity
              key={level.id}
              activeOpacity={locked ? 1 : 0.85}
              onPress={() => {
                if (!locked) navigation.navigate('Game', { levelId: level.id });
              }}
              style={[styles.levelCard, locked && styles.levelCardLocked]}
            >
              {/* Left accent */}
              <View
                style={[
                  styles.levelAccent,
                  {
                    backgroundColor: locked
                      ? colors.fog
                      : completed
                      ? '#11998e'
                      : diffConfig.accent,
                  },
                ]}
              />

              {/* Number */}
              <View style={styles.levelNumWrap}>
                <Text style={[styles.levelNum, locked && styles.lockedText]}>
                  {locked ? '🔒' : `${index + 1}`}
                </Text>
              </View>

              {/* Info */}
              <View style={styles.levelInfo}>
                <Text style={[styles.levelName, locked && styles.lockedText]}>
                  {level.emoji}  {level.name}
                </Text>
                <Text style={[styles.levelDesc, locked && styles.lockedText]}>
                  {locked
                    ? 'Completa el nivel anterior para desbloquear'
                    : level.description}
                </Text>
                {!locked && (
                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaText}>❤️ {level.lives}</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaText}>🌊 {level.waves.length} oleadas</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaText}>🪙 +{level.startingCoins}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Status */}
              {completed && !locked && (
                <View style={styles.completedMark}>
                  <Text style={styles.completedText}>✓</Text>
                </View>
              )}
              {!locked && !completed && (
                <View style={styles.playArrow}>
                  <Text style={[styles.playArrowText, { color: diffConfig.accent }]}>▶</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredLevels.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Próximamente más niveles…</Text>
          </View>
        )}

        {/* Ink slab footer */}
        <View style={styles.inkSlab}>
          <Text style={styles.inkSlabTitle}>
            Completa todos los niveles para desbloquear el modo Extremo.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  utilityText: { ...typography.captionMd, color: colors.onInk },

  backBtn: { paddingRight: spacing.md },
  backText: { ...typography.linkMd, color: colors.primary },
  navTitle: { flex: 1, ...typography.displayXs, color: colors.ink },

  // Difficulty tabs
  diffRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    flexWrap: 'wrap',
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  diffTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: rounded.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  diffTabActive: {
    borderColor: 'transparent',
  },
  diffEmoji: { fontSize: 14 },
  diffLabel: { ...typography.captionBold, color: colors.charcoal },
  diffLabelActive: { ...typography.captionBold, color: colors.onInk },

  // Info strip
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cloud,
    gap: spacing.sm,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  infoAccent: { width: 3, height: 16, borderRadius: rounded.sm },
  infoText: { ...typography.captionMd, color: colors.charcoal },

  // Level list
  list: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: rounded.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...(shadows.softLift as object),
  },
  levelCardLocked: { opacity: 0.55 },
  levelAccent: { width: 4, alignSelf: 'stretch' },
  levelNumWrap: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  levelNum: { ...typography.displaySm, color: colors.ink },
  levelInfo: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingRight: spacing.sm,
    gap: 4,
  },
  levelName: { ...typography.bodyEmphasis, color: colors.ink },
  levelDesc: { ...typography.captionMd, color: colors.graphite },
  metaRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor: colors.cloud,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: rounded.sm,
  },
  metaText: { ...typography.captionSm, color: colors.charcoal },
  lockedText: { color: colors.steel },

  completedMark: {
    width: 28,
    height: 28,
    borderRadius: rounded.full,
    backgroundColor: '#11998e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  completedText: { color: colors.onInk, fontWeight: '900', fontSize: 14 },

  playArrow: { marginRight: spacing.xl },
  playArrowText: { fontSize: 18, fontWeight: '700' },

  emptyBox: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.bodyMd, color: colors.steel },

  inkSlab: {
    marginTop: spacing.xl,
    backgroundColor: colors.ink,
    borderRadius: rounded.xl,
    padding: spacing.xl,
  },
  inkSlabTitle: { ...typography.bodyMd, color: colors.steel },
});
