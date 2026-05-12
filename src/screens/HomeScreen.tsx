import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Image,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { usePlayerStore } from '../store/playerStore';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, rounded, shadows, componentStyles } from '../theme';
import Chevron from '../components/Chevron';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  const { profile, setProfileImage } = usePlayerStore();
  const { user, syncing, lastSynced, saveToCloud, signOut } = useAuthStore();
  const playAnim = useRef(new Animated.Value(1)).current;

  const animatePlay = () => {
    Animated.sequence([
      Animated.timing(playAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(playAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start(() => navigation.navigate('LevelSelect'));
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Selección de imagen no disponible en web.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const err = await saveToCloud();
    if (err) {
      Alert.alert('Error al guardar', err);
    } else {
      Alert.alert('¡Guardado!', 'Tu progreso fue guardado en la nube. ☁️');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.replace('Auth');
        },
      },
    ]);
  };

  const xpProgress = (profile.xp % 100) / 100;
  const syncLabel = lastSynced
    ? `Guardado ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Sin guardar';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.ink} />

      {/* ── Utility strip ──────────────────────────────────────────── */}
      <View style={componentStyles.utilityStrip}>
        <Text style={styles.utilityText}>⚔️ Tower Defense · Protege tu reino</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card with HP chevron decorations ────────────────── */}
        <View style={styles.heroWrapper}>
          <Chevron side="left" height={240} width={32} />
          <Chevron side="right" height={240} width={32} />

          <View style={styles.heroCard}>
            {/* Title */}
            <View style={styles.heroText}>
              <Text style={styles.eyebrow}>ENTERPRISE STRATEGY GAME</Text>
              <Text style={styles.heroTitle}>TOWER{'\n'}DEFENSE</Text>
              <View style={styles.primaryLine} />
              <Text style={styles.heroSub}>Defiende tu base. Domina el campo.</Text>
            </View>

            {/* Enemy parade */}
            <View style={styles.enemyRow}>
              {['👺', '👹', '🧌', '🐉', '💀'].map((e, i) => (
                <Text key={i} style={[styles.enemyEmoji, { opacity: 0.4 + i * 0.12 }]}>
                  {e}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* ── Profile stats card ────────────────────────────────────── */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionTitle}>Tu perfil</Text>
        </View>

        <View style={styles.profileCard}>
          {/* Avatar */}
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} activeOpacity={0.8}>
            {profile.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>🧙</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsCol}>
            {/* Coin stat */}
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Monedas</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statIcon}>🪙</Text>
                <Text style={styles.statValue}>{profile.coins.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            {/* Level stat */}
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>Nivel</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{profile.level}</Text>
              </View>
            </View>

            {/* XP bar */}
            <View style={styles.xpRow}>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` as any }]} />
              </View>
              <Text style={styles.xpLabel}>{profile.xp % 100} / 100 XP</Text>
            </View>
          </View>
        </View>

        {/* ── CTA buttons ───────────────────────────────────────────── */}
        <Animated.View style={[styles.btnRow, { transform: [{ scale: playAnim }] }]}>
          <TouchableOpacity
            style={[componentStyles.btnPrimary, styles.btnFull]}
            onPress={animatePlay}
            activeOpacity={0.85}
          >
            <Text style={[componentStyles.btnLabel, styles.btnPrimaryLabel]}>
              ▶  Jugar
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[componentStyles.btnOutlineInk, styles.btnFull]}
          onPress={() => navigation.navigate('Shop')}
          activeOpacity={0.8}
        >
          <Text style={componentStyles.btnLabelOutlineInk}>🏪  Tienda</Text>
        </TouchableOpacity>

        {/* ── Cloud save panel ──────────────────────────────────────── */}
        <View style={styles.cloudPanel}>
          <View style={styles.cloudPanelHeader}>
            <Text style={styles.cloudPanelTitle}>☁️  Nube</Text>
            {user ? (
              <Text style={styles.cloudEmail} numberOfLines={1}>{user.email}</Text>
            ) : (
              <Text style={styles.cloudGuest}>Sin cuenta</Text>
            )}
          </View>

          {user ? (
            <>
              <View style={styles.syncStatusRow}>
                <View style={[styles.syncDot, { backgroundColor: lastSynced ? '#4CAF50' : colors.steel }]} />
                <Text style={styles.syncLabel}>{syncLabel}</Text>
              </View>
              <View style={styles.cloudBtnRow}>
                <TouchableOpacity
                  style={[componentStyles.btnPrimary, styles.cloudBtn]}
                  onPress={handleSave}
                  disabled={syncing}
                  activeOpacity={0.85}
                >
                  {syncing ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <Text style={[componentStyles.btnLabel, { color: colors.onPrimary }]}>
                      ↑  Guardar
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[componentStyles.btnOutlineInk, styles.cloudBtn]}
                  onPress={handleSignOut}
                  activeOpacity={0.8}
                >
                  <Text style={componentStyles.btnLabelOutlineInk}>Salir</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[componentStyles.btnPrimary, { marginTop: spacing.sm }]}
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.85}
            >
              <Text style={[componentStyles.btnLabel, { color: colors.onPrimary }]}>
                → Crear cuenta / Iniciar sesión
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Dark ink slab footer ──────────────────────────────────── */}
        <View style={styles.inkSlab}>
          <Text style={styles.inkSlabTitle}>¿Listo para la batalla?</Text>
          <Text style={styles.inkSlabBody}>
            Coloca tus torres, defiende tu base y conquista todos los niveles.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: {
    paddingBottom: 40,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  utilityText: {
    ...typography.captionMd,
    color: colors.onInk,
  },

  // Hero
  heroWrapper: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  heroCard: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    zIndex: 1,
  },
  heroText: { marginBottom: spacing.xl },
  eyebrow: {
    ...typography.captionBold,
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.displayLg,
    color: colors.ink,
    lineHeight: 46,
  },
  primaryLine: {
    width: 48,
    height: 3,
    backgroundColor: colors.primary,
    marginVertical: spacing.sm,
    borderRadius: 0,
  },
  heroSub: {
    ...typography.bodyMd,
    color: colors.charcoal,
  },
  enemyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  enemyEmoji: { fontSize: 28 },

  // Section header
  sectionLabel: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  sectionTitle: { ...typography.displayXs, color: colors.ink },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    borderRadius: rounded.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
    ...(shadows.softLift as object),
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: rounded.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: rounded.md,
    backgroundColor: colors.cloud,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 34 },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: rounded.sm,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: { fontSize: 10 },

  statsCol: { flex: 1, gap: spacing.xs },
  statBlock: { gap: 2 },
  statLabel: { ...typography.captionMd, color: colors.graphite },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon: { fontSize: 16 },
  statValue: { ...typography.priceMd, color: colors.ink },
  statDivider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: spacing.xs,
  },
  xpRow: { gap: 4 },
  xpBarBg: {
    height: 4,
    backgroundColor: colors.fog,
    borderRadius: rounded.sm,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: rounded.sm,
  },
  xpLabel: { ...typography.captionSm, color: colors.graphite, textAlign: 'right' },

  // Buttons
  btnFull: { marginHorizontal: spacing.xxl, marginTop: spacing.md },
  btnRow: {},
  btnPrimaryLabel: { ...typography.buttonMd, color: colors.onPrimary },

  // Ink slab
  inkSlab: {
    marginTop: spacing.xxl,
    backgroundColor: colors.ink,
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  inkSlabTitle: { ...typography.displaySm, color: colors.onInk },
  inkSlabBody: { ...typography.bodyMd, color: colors.steel },

  // Cloud save panel
  cloudPanel: {
    marginHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    backgroundColor: colors.cloud,
    borderRadius: rounded.xl,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  cloudPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cloudPanelTitle: { ...typography.bodyEmphasis, color: colors.ink },
  cloudEmail: { ...typography.captionMd, color: colors.primary, flex: 1, textAlign: 'right' },
  cloudGuest: { ...typography.captionMd, color: colors.steel },
  syncStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncLabel: { ...typography.captionSm, color: colors.graphite },
  cloudBtnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cloudBtn: { flex: 1 },
});
